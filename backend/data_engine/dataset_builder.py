"""Synthetic satellite-orbit training dataset generator.

Combines the :class:`SpaceWeatherSimulator` telemetry with a lightweight but
physical orbit-decay model (atmospheric drag via a piecewise-barometric
density profile inflated by solar driving) and a radiation-anomaly ground-truth
dose model. The output ``training_data.csv`` is the training corpus for the
orbital-decay and radiation-risk regressors/classifiers trained in Phase 2.

Decay model: for a near-circular orbit the semi-major axis decay rate satisfies

    d a / d t  =  - rho * (C_D * A / m) * sqrt(mu * a)

in SI units (derived from the orbital-energy relation), with the thermospheric
density rho computed on an exponential layer model and inflated by solar and
equatorial heating. Decays are quoted in km/day.

Radiation model: a soft-threshold (sigmoid) risk score over 10 MeV proton and
2 MeV electron fluence, modulated by orbit-shell shielding.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import numpy.typing as npt
import pandas as pd

from .space_weather_simulator import SpaceWeatherSimulator, kp_to_ap

# ---------------------------------------------------------------------------
# Physical constants
# ---------------------------------------------------------------------------
EARTH_RADIUS_KM: float = 6378.137
MU_EARTH_SI: float = 3.986004418e14  # m^3 / s^2
GEO_ALT_KM: float = 35786.0

# Piecewise barometric reference atmosphere: (base_alt_km, rho_kg_m3, scale_h_km)
# Empirical thermo/exosphere densities (quiet, low solar flux).
DENSITY_LAYERS: tuple[tuple[float, float, float], ...] = (
    (100.0, 5.0e-7, 13.0),
    (200.0, 2.7e-10, 30.0),
    (300.0, 1.2e-11, 48.0),
    (400.0, 2.2e-12, 62.0),
    (500.0, 4.5e-13, 77.0),
    (600.0, 1.3e-13, 92.0),
    (700.0, 4.8e-14, 108.0),
    (800.0, 2.0e-14, 124.0),
    (900.0, 1.0e-14, 140.0),
    (1000.0, 5.5e-15, 160.0),
    (2000.0, 2.0e-17, 240.0),
)

# Radiation shielding factor per regime: less shielding, more charge accumulation
# (GEO sits in the outer belt/plasma sheet; LEO polar is SE-p exposed).
REGIME_NOMINAL_ALT_KM: dict[str, float] = {
    "LEO": 550.0,
    "MEO": 20200.0,
    "GEO": GEO_ALT_KM,
}

# Radiation dose sensitivity per regime (arbitrary physical weighting of how much
# a given fluence perturbs a typical satellite in that shell).
RADIATION_SENSITIVITY: dict[str, float] = {
    "LEO": 1.0,   # mostly polar / SAA SEP exposure
    "MEO": 1.3,   # inner & outer belt crossing
    "GEO": 1.8,   # outer belt / plasma-sheet charging, weak geomagnetic shielding
}

# Median area-to-mass ratio [m^2/kg] and drag coefficient per regime.
ATOM_DEFAULT: dict[str, float] = {"LEO": 0.012, "MEO": 0.004, "GEO": 0.001}
CD_DEFAULT: float = 2.2


# ---------------------------------------------------------------------------
# Domain model
# ---------------------------------------------------------------------------


@dataclass
class SatelliteConfig:
    """Static properties of a simulated satellite."""

    sat_id: str
    name: str
    regime: str  # LEO | MEO | GEO
    altitude_km: float
    inclination_deg: float
    mass_kg: float
    area_m2: float
    cd: float

    @property
    def atom_m2_per_kg(self) -> float:
        """Area-to-mass ratio ``A / m`` [m^2/kg]."""
        return self.area_m2 / self.mass_kg

    @property
    def cd_area_over_mass(self) -> float:
        """Effective ballistic area ``Cd * A / m`` [m^2/kg]."""
        return self.cd * self.area_m2 / self.mass_kg


# ---------------------------------------------------------------------------
# Atmospheric density model
# ---------------------------------------------------------------------------


def _layer_density(alt_km: npt.ArrayLike) -> np.ndarray:
    """Log-interpolated barometric density across :data:`DENSITY_LAYERS`.

    For an altitude between two reference layers we use the lower layer's base
    density scaled by its scale height; below the first layer the first layer
    is used. Above the top layer we extrapolate with the top scale height.
    Density is interpolated in log-space to keep the profile smooth.
    """
    alt = np.asarray(alt_km, dtype=float)
    alts = np.array([h for h, _, _ in DENSITY_LAYERS], dtype=float)
    rho = np.array([r for _, r, _ in DENSITY_LAYERS], dtype=float)

    idx = np.searchsorted(alts, alt, side="right") - 1
    idx = np.clip(idx, 0, len(alts) - 2)
    h_lo = alts[idx]
    h_hi = np.minimum(idx + 1, len(alts) - 1)
    rho_lo = rho[idx]
    rho_hi = rho[h_hi]

    t = (alt - h_lo) / np.maximum(alts[h_hi] - h_lo, 1e-9)
    t = np.clip(t, 0.0, 1.0)
    log_rho = np.log(rho_lo) * (1.0 - t) + np.log(rho_hi) * t
    return np.exp(log_rho)


def thermospheric_density(
    alt_km: npt.ArrayLike,
    f107: npt.ArrayLike,
    ap: npt.ArrayLike,
    storm_boost: npt.ArrayLike,
) -> np.ndarray:
    """Solar/geomagnetically-inflated thermospheric density [kg/m^3].

    Density from the reference layer model is multiplied by an exospheric
    temperature factor driven by F10.7 (solar EUV heating of the thermosphere)
    and a transient geomagnetic (Ap) storm heating term.
    """
    rho_quiet = _layer_density(alt_km)
    f107 = np.asarray(f107, dtype=float)
    ap = np.asarray(ap, dtype=float)
    storm = np.asarray(storm_boost, dtype=float)

    solar_inflation = 1.0 + 1.35 * (f107 - 70.0) / 160.0
    storm_inflation = 1.0 + 0.22 * (ap / 27.0) + 0.35 * storm
    return rho_quiet * solar_inflation * storm_inflation



# ---------------------------------------------------------------------------
# Orbit-decay (atmospheric drag) model
# ---------------------------------------------------------------------------


def orbital_decay_km_per_day(
    altitude_km: npt.ArrayLike,
    cd_area_over_mass: npt.ArrayLike,
    f107: npt.ArrayLike,
    ap: npt.ArrayLike,
    storm_boost: npt.ArrayLike,
) -> np.ndarray:
    """Semi-major-axis decay rate [km/day] from atmospheric drag.

    Implements ``da/dt = -rho * (Cd*A/m) * sqrt(mu*a)`` (SI) and returns the
    positive daily altitude loss in km/day. MEO / GEO regimes sit above the
    dense thermosphere, so their derived decay is essentially zero - which is
    physically correct.
    """
    alt = np.asarray(altitude_km, dtype=float)
    beta = np.asarray(cd_area_over_mass, dtype=float)
    f107 = np.asarray(f107, dtype=float)
    ap = np.asarray(ap, dtype=float)
    storm = np.asarray(storm_boost, dtype=float)

    rho = thermospheric_density(alt, f107, ap, storm)
    a_m = (EARTH_RADIUS_KM + alt) * 1000.0
    sqrt_mu_a = np.sqrt(MU_EARTH_SI * a_m)  # [m/s]
    da_dt_m_s = rho * beta * sqrt_mu_a      # [m/s]
    return np.abs(-da_dt_m_s * 86400.0 / 1000.0)  # [km/day], positive loss


# ---------------------------------------------------------------------------
# Radiation ground truth (SEU + surface charging)
# ---------------------------------------------------------------------------


def _sigmoid(x: npt.ArrayLike) -> np.ndarray:
    x = np.asarray(x, dtype=float)
    return 1.0 / (1.0 + np.exp(-x))


def radiation_ground_truth(
    proton_flux: npt.ArrayLike,
    electron_flux: npt.ArrayLike,
    kp: npt.ArrayLike,
    regime: str | np.ndarray,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Return probabilities and Bernoulli labels for SEU and charging.

    Returns ``(seu_prob, charging_prob, seu_label, charging_label)``. Protons
    drive single-event upsets; electrons drive surface charging. Regime scales
    the sensitivity, and Kp raises both (energetic injection during storms).
    """
    kp = np.asarray(kp, dtype=float)
    p_log = np.log10(np.maximum(np.asarray(proton_flux, dtype=float), 1e-4))
    e_log = np.log10(np.maximum(np.asarray(electron_flux, dtype=float), 1e1))

    if isinstance(regime, str):
        sens = np.full_like(kp, RADIATION_SENSITIVITY[regime])
    else:
        sens = np.asarray(
            [RADIATION_SENSITIVITY[reg] for reg in regime], dtype=float
        )

    noise_p = rng.normal(0.0, 0.25, kp.shape)
    noise_e = rng.normal(0.0, 0.25, kp.shape)

    seu_logit = (
        0.5 * (sens - 1.0)
        + 1.4 * (p_log - 1.0)
        + 0.45 * (kp - 3.0)
        + noise_p
    )
    charge_logit = (
        0.6 * (sens - 1.0)
        + 1.1 * (e_log - 4.0)
        + 0.5 * (kp - 3.0)
        - 1.0 * (sens < 1.0)  # LEO sensors are shielded from wide charging
        + noise_e
    )

    seu_prob = _sigmoid(seu_logit)
    charge_prob = _sigmoid(charge_logit)
    seu_label = (rng.random(kp.shape) < seu_prob).astype(int)
    charge_label = (rng.random(kp.shape) < charge_prob).astype(int)
    return seu_prob, charge_prob, seu_label, charge_label


# ---------------------------------------------------------------------------
# Dataset generation
# ---------------------------------------------------------------------------


def _draw_satellite(rng: np.random.Generator, index: int) -> SatelliteConfig:
    """Draw a random satellite across the LEO / MEO / GEO regimes."""
    regime = rng.choice(["LEO", "MEO", "GEO"], p=[0.5, 0.25, 0.25])
    if regime == "LEO":
        altitude = rng.uniform(350.0, 1200.0)
        inclination = rng.uniform(28.0, 98.0)
    elif regime == "MEO":
        altitude = rng.uniform(19000.0, 22000.0)
        inclination = rng.uniform(45.0, 65.0)
    else:
        altitude = GEO_ALT_KM + rng.normal(0.0, 150.0)
        inclination = rng.uniform(0.0, 10.0)

    # Ballistic parameters: physically-scaled masses and solar-panel areas.
    if regime == 'LEO':
        mass = rng.lognormal(mean=np.log(400.0), sigma=0.8)
        area = rng.lognormal(mean=np.log(12.0), sigma=0.6)
    else:
        mass = rng.lognormal(mean=np.log(1500.0), sigma=0.5)
        area = rng.lognormal(mean=np.log(45.0), sigma=0.6)
    cd = CD_DEFAULT * (1.0 + rng.uniform(-0.2, 0.2))
    return SatelliteConfig(
        sat_id=f'SAT-{index:04d}',
        name=f'Sim-{index:04d}',
        regime=regime,
        altitude_km=float(altitude),
        inclination_deg=float(inclination),
        mass_kg=float(mass),
        area_m2=float(area),
        cd=float(cd),
    )


COLUMNS: tuple[str, ...] = (
    "sat_id", "name", "regime", "date", "altitude_km", "inclination_deg",
    "mass_kg", "area_m2", "cd", "atom", "cd_area_over_mass",
    "f107", "f107_81day", "kp", "ap", "dst", "proton_flux_10mev",
    "electron_flux_2mev", "solar_wind", "daily_decay_km", "seu_prob",
    "charging_prob", "seu_label", "charging_label", "anomaly_label",
)


def build_training_dataset(
    out_path: str | Path,
    n_satellites: int = 300,
    days_per_satellite: int = 60,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate the full synthetic training corpus and write ``training_data.csv``."""
    rng = np.random.default_rng(seed)
    sw = SpaceWeatherSimulator(seed=seed)
    frames: list[pd.DataFrame] = []
    epoch_start = pd.Timestamp("2010-01-01")

    for i in range(n_satellites):
        sat = _draw_satellite(rng, i)
        # Offset each satellite's weather start to decorrelate solar phase.
        start = epoch_start + pd.Timedelta(days=int(rng.integers(0, 1600)))
        sw_df = sw.generate_time_series(start.strftime("%Y-%m-%d"), days_per_satellite)

        cd_am = np.full(days_per_satellite, sat.cd_area_over_mass)
        ap = sw_df["ap"].to_numpy()
        kp = sw_df["kp"].to_numpy()
        storm = np.clip((kp - 3.0) / 4.0, 0.0, 1.5)
        decay = orbital_decay_km_per_day(
            np.full(days_per_satellite, sat.altitude_km), cd_am,
            sw_df["f107"].to_numpy(), ap, storm,
        )

        seu_prob, charge_prob, seu_l, charge_l = radiation_ground_truth(
            sw_df["proton_flux_10mev"].to_numpy(),
            sw_df["electron_flux_2mev"].to_numpy(),
            kp, sat.regime, rng,
        )
        anomaly = np.maximum(seu_l, charge_l)

        mass = sat.mass_kg
        area = sat.area_m2

        frame = pd.DataFrame(
            {
                "sat_id": [sat.sat_id] * days_per_satellite,
                "name": [sat.name] * days_per_satellite,
                "regime": [sat.regime] * days_per_satellite,
                "date": sw_df["timestamp"],
                "altitude_km": [sat.altitude_km] * days_per_satellite,
                "inclination_deg": [sat.inclination_deg] * days_per_satellite,
                "mass_kg": mass,
                "area_m2": area,
                "cd": CD_DEFAULT,
                "atom": sat.atom_m2_per_kg,
                "cd_area_over_mass": sat.cd_area_over_mass,
                "f107": sw_df["f107"],
                "f107_81day": sw_df["f107_81day"],
                "kp": kp,
                "ap": ap,
                "dst": sw_df["dst"],
                "proton_flux_10mev": sw_df["proton_flux_10mev"],
                "electron_flux_2mev": sw_df["electron_flux_2mev"],
                "solar_wind": sw_df["solar_wind"],
                "daily_decay_km": decay,
                "seu_prob": seu_prob,
                "charging_prob": charge_prob,
                "seu_label": seu_l,
                "charging_label": charge_l,
                "anomaly_label": anomaly,
            }
        )
        frames.append(frame)

    df = pd.concat(frames, ignore_index=True)
    df = df[list(COLUMNS)]
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out, index=False)
    return df


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate Orbital Shield training data.")
    parser.add_argument("--n-satellites", type=int, default=300)
    parser.add_argument("--days", type=int, default=60)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", default="training_data.csv", help="Output CSV path.")
    args = parser.parse_args(argv)
    df = build_training_dataset(args.out, args.n_satellites, args.days, args.seed)
    print(f"Wrote {len(df):,} rows to {args.out}")
    print(df[["regime", "daily_decay_km", "anomaly_label"]].describe())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

