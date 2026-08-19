"""Feature builders shared by training and runtime inference.

The oracle bounds of the models (regime sets, feature ordering, one-hot coding)
are defined here once so training and the FastAPI router stay in lock-step.
"""

from __future__ import annotations

import numpy as np

# Features (in exact column order) consumed by the orbital-decay regressor.
LEODRAG_FEATURES: tuple[str, ...] = (
    "f107",
    "kp",
    "altitude_km",
    "mass_kg",
    "area_m2",
)

# Orbit regime one-hot coding used by the anomaly classifier.
REGIMES: tuple[str, ...] = ("LEO", "MEO", "GEO")

# Base anomaly features (regime one-hot is appended after these).
ANOMALY_BASE_FEATURES: tuple[str, ...] = (
    "proton_flux_10mev",
    "electron_flux_2mev",
    "kp",
    "ap",
)


def drag_feature_row(
    f107: float,
    kp: float,
    altitude_km: float,
    mass_kg: float,
    area_m2: float,
) -> list[float]:
    """Build a single regressor feature row in :data:`LEODRAG_FEATURES` order."""
    return [
        float(f107),
        float(np.clip(kp, 0.0, 9.0)),
        float(altitude_km),
        float(mass_kg),
        float(area_m2),
    ]


def anomaly_drag_row(
    proton_flux: float,
    electron_flux: float,
    kp: float,
    ap: float,
    regime: str,
) -> list[float]:
    """Build an anomaly-classifier input row (base + one-hot regime)."""
    one_hot = [1.0 if regime == r else 0.0 for r in REGIMES]
    return [
        float(proton_flux),
        float(electron_flux),
        float(np.clip(kp, 0.0, 9.0)),
        float(ap),
        *one_hot,
    ]


def anomaly_feature_names() -> list[str]:
    """Column names for the anomaly classifier feature matrix."""
    one_hot = [f"regime_{r.lower()}" for r in REGIMES]
    return list(ANOMALY_BASE_FEATURES) + one_hot

