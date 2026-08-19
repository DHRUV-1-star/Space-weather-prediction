"""Realistic space weather telemetry synthesis.

Generates physically-plausible daily time-series of the canonical space weather
indices used by the orbital-debris and satellite-operations community:

* ``f107``            - 10.7 cm solar radio flux [sfu] (EUV thermospheric heating)
* ``f107_81day``      - 81-day running mean of F10.7 (slow density driver)
* ``kp``              - planetary geomagnetic index, integer 0-9
* ``ap``              - linear geomagnetic index derived from Kp
* ``dst``             - disturbance storm-time index [nT]
* ``proton_flux_10mev`` - >10 MeV proton flux  [p/cm2/sr/s]
* ``electron_flux_2mev`` - >2 MeV electron flux [p/cm2/sr/s]
* ``solar_wind``      - solar wind speed [km/s]

Every channel is tied to a slowly-varying 11-year solar cycle in F10.7, layered
with a 27-day solar-rotation periodicity and discrete geomagnetic-storm (CME)
and SEP (solar energetic particle) flare events whose outputs are correlated:
a big Kp storm also deepens Dst, raises the solar wind and boosts fluxes.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np
import numpy.typing as npt
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
# Kp -> Ap conversion lookup (standard Bartels table).
KP_AP_LUT: tuple[tuple[int, float], ...] = (
    (0, 0.0), (1, 3.0), (2, 7.0), (3, 15.0), (4, 27.0),
    (5, 48.0), (6, 80.0), (7, 140.0), (8, 240.0), (9, 400.0),
)

# Ap breakpoints indexed by integer Kp (continuous interpolation).
_AP_BREAKPOINTS: np.ndarray = np.asarray([ap for _, ap in KP_AP_LUT], dtype=float)

# 11-year solar cycle F10.7 climatology (SFU).
F107_MIN: float = 67.0
F107_MAX: float = 245.0

# 27-day solar-rotation mean period.
ROTATION_PERIOD_DAYS: float = 27.0

# Gravitational parameter of Earth [km3/s2] used by drag helpers elsewhere.
MU_EARTH_KM3_S2: float = 398600.4418


def kp_to_ap(kp: npt.ArrayLike | float) -> np.ndarray | float:
    """Map a Kp index (or array) to Ap via continuous Bartels interpolation."""
    if np.isscalar(kp):
        k = float(np.clip(kp, 0.0, 9.0))
        lo = int(k)
        hi = min(lo + 1, len(_AP_BREAKPOINTS) - 1)
        return float(_AP_BREAKPOINTS[lo] + (k - lo) * (_AP_BREAKPOINTS[hi] - _AP_BREAKPOINTS[lo]))
    arr = np.asarray(kp, dtype=float)
    clipped = np.clip(arr, 0.0, 9.0)
    lo = np.floor(clipped).astype(int)
    hi = np.minimum(lo + 1, len(_AP_BREAKPOINTS) - 1)
    frac = clipped - lo
    return _AP_BREAKPOINTS[lo] + frac * (_AP_BREAKPOINTS[hi] - _AP_BREAKPOINTS[lo])

# ---------------------------------------------------------------------------
# Domain containers
# ---------------------------------------------------------------------------


@dataclass
class SpaceWeatherEvent:
    """Ephemeris of a simulated geomagnetic storm or SEP (flare) event."""

    start_idx: int
    duration_days: int
    peak_kp: float
    kind: str  # "cme" -> geomagnetic storm, "flare" -> SEP event.


@dataclass
class SpaceWeatherSample:
    """A flattened single-day telemetry record."""

    timestamp: np.datetime64
    f107: float
    f107_81day: float
    kp: float
    ap: float
    dst: float
    proton_flux_10mev: float
    electron_flux_2mev: float
    solar_wind: float

    def to_dict(self) -> dict[str, float]:
        out = asdict(self)
        out.pop("timestamp", None)
        return out


# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------


class SpaceWeatherSimulator:
    """Multi-channel, physically-consistent space-weather time-series generator.

    Parameters
    ----------
    seed:
        Seed for the internal RNG (deterministic runs for reproducibility).
    storm_rate_per_year:
        Average number of geomagnetic storms (CMEs) per year.
    flare_rate_per_year:
        Average number of SEP (solar-energetic-particle) flare events per year.
    """

    CYCLE_LENGTH_DAYS: float = 11.0 * 365.25

    def __init__(
        self,
        seed: int | None = None,
        storm_rate_per_year: float = 16.0,
        flare_rate_per_year: float = 40.0,
    ) -> None:
        self.storm_rate_per_year = storm_rate_per_year
        self.flare_rate_per_year = flare_rate_per_year
        self._rng = np.random.default_rng(seed)

    # -------------------------------------------------------------- public API
    def generate_time_series(self, start: str, days: int) -> pd.DataFrame:
        """Produce ``days`` daily space-weather rows beginning at ``start``."""
        timestamps = pd.date_range(start=start, periods=days, freq="D")
        day_of_epoch = np.arange(days, dtype=float)

        # 1) Long-term solar-cycle modulation of thermospheric F10.7.
        cycle_phase = 2.0 * np.pi * day_of_epoch / self.CYCLE_LENGTH_DAYS
        f107_slow = self._solar_cycle_f107(cycle_phase)

        # 2) 27-day solar-rotation ripple on top of the slow baseline.
        rotation = 1.0 + 0.035 * np.sin(2.0 * np.pi * day_of_epoch / ROTATION_PERIOD_DAYS)
        f107_raw = np.clip(f107_slow * rotation + self._rng.normal(0.0, 1.2, days), 50.0, 320.0)

        # 3) ~81-day running mean (thermospheric heating latency).
        f107_81 = pd.Series(f107_raw).rolling(81, min_periods=1, center=True).mean().to_numpy()

        # 4) Storm / flare scheduling into temporal profiles.
        events = self._schedule_events(days)
        storm_profile = self._sum_events([e for e in events if e.kind == "cme"], days)
        flare_profile = self._sum_events([e for e in events if e.kind == "flare"], days)

        # 5) Kp: quiet gamma background + storm excitation, clipped to [0, 9].
        kp = np.clip(self._quiet_kp(days) + 6.0 * storm_profile, 0.0, 9.0)
        ap = kp_to_ap(kp)

        # 6) Dst: quiet + ring-current deepening during storms.
        dst = -6.0 + self._rng.normal(0.0, 4.0, days) - 55.0 * storm_profile

        # 7) Solar wind speed: baseline + rotation ripple + storm hammer.
        solar_wind = (
            345.0
            + 75.0 * np.sin(2.0 * np.pi * day_of_epoch / ROTATION_PERIOD_DAYS)
            + 250.0 * storm_profile
            + self._rng.normal(0.0, 18.0, days)
        )

        # 8) Particle fluxes: log-normal baseline + SEP / flare injection.
        base_proton = np.exp(self._rng.normal(np.log(0.15), 0.35, days))
        base_electron = np.exp(self._rng.normal(np.log(900.0), 0.5, days))
        proton_flux = base_proton * (1.0 + 260.0 * flare_profile)
        electron_flux = base_electron * (1.0 + 55.0 * storm_profile) * (1.0 + 8.5 * flare_profile)

        return pd.DataFrame(
            {
                "timestamp": timestamps,
                "f107": f107_raw,
                "f107_81day": f107_81,
                "kp": kp,
                "ap": ap,
                "dst": dst,
                "proton_flux_10mev": proton_flux,
                "electron_flux_2mev": electron_flux,
                "solar_wind": solar_wind,
            }
        )

    def sample_batch(self, n_samples: int) -> list[SpaceWeatherSample]:
        """Return ``n_samples`` independent telemetry snapshots (fast path).

        Omits the 81-day rolling dimension (set equal to F10.7) and long-range
        temporal correlation, favouring quick bulk sampling for ML training.
        """
        storm_fraction = min(0.5, self.storm_rate_per_year * (3.0 / 365.25))
        cycle_phase = self._rng.uniform(0.0, 2.0 * np.pi, n_samples)
        f107 = self._solar_cycle_f107(cycle_phase) * self._rng.uniform(0.9, 1.1, n_samples)
        f107 = np.clip(f107, 50.0, 320.0)

        storm = self._rng.random(n_samples) < storm_fraction
        quiet_kp = np.clip(self._rng.gamma(2.2, 0.6, n_samples), 0.0, 6.5)
        storm_kp = self._rng.uniform(4.5, 9.0, n_samples)
        kp = np.clip(np.where(storm, storm_kp, quiet_kp), 0.0, 9.0)

        flare = self._rng.random(n_samples) < (self.flare_rate_per_year / 365.25)
        proton = np.exp(self._rng.normal(np.log(0.15), 0.4, n_samples)) * (1.0 + 260.0 * flare)
        electron = np.exp(self._rng.normal(np.log(900.0), 0.5, n_samples)) * (1.0 + 55.0 * storm) * (1.0 + 8.5 * flare)

        dst = -6.0 - 50.0 * storm + self._rng.normal(0.0, 4.0, n_samples)
        solar_wind = 345.0 + self._rng.normal(0.0, 20.0, n_samples) + 240.0 * storm
        ap = kp_to_ap(kp)

        ts = np.datetime64("2020-01-01")
        return [
            SpaceWeatherSample(
                timestamp=ts, f107=float(f), f107_81day=float(f), kp=float(k),
                ap=float(a), dst=float(d), proton_flux_10mev=float(p),
                electron_flux_2mev=float(e), solar_wind=float(s),
            )
            for (f, a, k, d, p, e, s) in zip(f107, ap, kp, dst, proton, electron, solar_wind)
        ]

    # -------------------------------------------------------------- internals
    def _solar_cycle_f107(self, cycle_phase: np.ndarray) -> np.ndarray:
        """F10.7 envelope over an 11-year cycle: min -> max -> min."""
        return F107_MIN + 0.5 * (F107_MAX - F107_MIN) * (1.0 + np.sin(cycle_phase - np.pi / 2.0))

    def _schedule_events(self, days: int) -> list[SpaceWeatherEvent]:
        events: list[SpaceWeatherEvent] = []
        cme_count = int(self._rng.poisson(self.storm_rate_per_year * days / 365.25))
        for _ in range(cme_count):
            start = int(self._rng.integers(0, max(1, days - 6)))
            duration = int(self._rng.integers(2, 8))
            events.append(SpaceWeatherEvent(start, duration, self._rng.uniform(5.0, 9.5), "cme"))
        flare_count = int(self._rng.poisson(self.flare_rate_per_year * days / 365.25))
        for _ in range(flare_count):
            events.append(
                SpaceWeatherEvent(
                    int(self._rng.integers(0, days)),
                    int(self._rng.integers(1, 4)),
                    self._rng.uniform(4.0, 8.5),
                    "flare",
                )
            )
        return events

    def _sum_events(self, events: list[SpaceWeatherEvent], days: int) -> np.ndarray:
        """Smoothly broaden each event across a few days with a sine envelope."""
        profile = np.zeros(days, dtype=float)
        for ev in events:
            start = ev.start_idx
            end = min(days, start + ev.duration_days)
            if end <= start:
                continue
            length = end - start
            envelope = np.sin(np.pi * np.linspace(0.0, 1.0, length) ** 0.5)
            profile[start:end] += envelope * (ev.peak_kp / 9.0)
        return np.clip(profile, 0.0, 1.5)

    def _quiet_kp(self, days: int) -> np.ndarray:
        return np.clip(self._rng.gamma(2.2, 0.6, days), 0.0, 6.5)

