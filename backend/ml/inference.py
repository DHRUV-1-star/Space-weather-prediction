"""Runtime inference glue between the FastAPI router and the persisted models.

Loads the trained XGBoost drag regressor and RandomForest anomaly classifier
once (process-wide), synthesises any telemetry missing from the request and
returns a structured risk assessment for the risk-engine router.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from .features import LEODRAG_FEATURES, REGIMES, anomaly_drag_row, drag_feature_row
from ..data_engine.space_weather_simulator import kp_to_ap

MODELS_DIR = Path(__file__).resolve().parent / "models"

SEVERITIES: tuple[str, ...] = ("Low", "Medium", "High", "Critical")


class InferenceEngine:
    """Lazy model loader exposing a single risk-assessment entry point."""

    def __init__(self, models_dir: Path = MODELS_DIR) -> None:
        self.models_dir = Path(models_dir)
        self._drag = None
        self._anomaly = None
        self._metadata = None

    # --------------------------------------------------------------- loaders
    @property
    def drag_model(self):
        if self._drag is None:
            self._drag = joblib.load(self.models_dir / "leo_drag_predictor.joblib")
        return self._drag

    @property
    def anomaly_model(self):
        if self._anomaly is None:
            self._anomaly = joblib.load(self.models_dir / "anomaly_classifier.joblib")
        return self._anomaly

    def metadata(self) -> dict[str, Any]:
        """Return the training/feature metadata JSON."""
        if self._metadata is None:
            self._metadata = json.loads((self.models_dir / "metadata.json").read_text())
        return self._metadata

    # -------------------------------------------------------------- telemetry
    def synthesize_telemetry(
        self, orbit_type: str, kp: float, f107: float, proton_flux: float
    ) -> tuple[float, float]:
        """Derive ``(ap, electron_flux_2mev)`` from the request fields.

        The API body carries Kp, F10.7 and proton flux but not electron flux or
        Ap. Both are approximated from the same physical couplings the simulator
        uses: storms (high Kp) and enhanced solar flux inject energetic
        electrons, higher orbits accumulate surface charge more readily, and
        proton flux co-moves with electron fluence during SEP events.
        """
        ap = float(kp_to_ap(float(np.clip(kp, 0.0, 9.0))))
        storm = max(0.0, (kp - 3.0) / 4.0)
        f107_eff = max(0.0, f107 - 70.0)
        regime_factor = {"LEO": 1.0, "MEO": 1.5, "GEO": 2.0}.get(orbit_type.upper(), 1.0)
        seam = 1.0 + 0.08 * np.log10(proton_flux + 1.0)
        electron = (
            350.0 + 900.0 * storm + 12.0 * f107_eff
        ) * (1.0 + 0.5 * storm) * regime_factor * seam
        return ap, float(np.clip(electron, 1.0, 1.0e6))

    # --------------------------------------------------------------- assess
    def assess_risk(
        self,
        satellite_name: str,
        orbit_type: str,
        altitude_km: float,
        mass_kg: float,
        area_m2: float,
        kp_index: float,
        solar_flux_f107: float,
        proton_flux: float,
    ) -> dict[str, Any]:
        orbit = orbit_type.strip().upper()
        if orbit not in REGIMES:
            raise ValueError(f"orbit_type must be one of {REGIMES}, got {orbit}")

        ap, electron_flux = self.synthesize_telemetry(orbit, kp_index, solar_flux_f107, proton_flux)

        # --- Orbital decay ---
        drag_row = drag_feature_row(solar_flux_f107, kp_index, altitude_km, mass_kg, area_m2)
        drag_df = pd.DataFrame([drag_row], columns=list(LEODRAG_FEATURES))
        daily_decay = float(self.drag_model.predict(drag_df)[0])
        seven_day_decay = daily_decay * 7.0

        # --- Radiation anomaly ---
        anomaly_row = anomaly_drag_row(proton_flux, electron_flux, kp_index, ap, orbit)
        anomaly_df = pd.DataFrame([anomaly_row], columns=list(self.anomaly_model.feature_names_in_))
        probas = self.anomaly_model.predict_proba(anomaly_df)
        # Multi-output RandomForest: probas[0] for the first output (seu),
        # probas[1] for the second (charging); positive class is index 1.
        seu_pct = float(probas[0][0, 1] * 100.0)
        charging_pct = float(probas[1][0, 1] * 100.0)

        # --- Composite degradation score and band ---
        drag_score = min(daily_decay / 0.3, 1.0) if orbit == "LEO" else min(daily_decay / 1.0, 1.0)
        rad_score = max(seu_pct, charging_pct) / 100.0
        if orbit == "LEO":
            overall = 0.7 * drag_score + 0.3 * rad_score
        else:
            overall = 0.15 * drag_score + 0.85 * rad_score
        level = self._level_from_score(overall)

        recommendations = self._recommendations(orbit, altitude_km, daily_decay, seu_pct, charging_pct)

        return {
            "satellite_name": satellite_name,
            "orbit_type": orbit,
            "assessed_telemetry": {
                "ap": ap,
                "electron_flux_2mev": float(electron_flux),
            },
            "drag_prediction": {
                "daily_decay_km": round(daily_decay, 6),
                "seven_day_decay_km": round(seven_day_decay, 6),
            },
            "radiation_prediction": {
                "seu_risk_pct": round(seu_pct, 2),
                "charging_risk_pct": round(charging_pct, 2),
                "combined_anomaly_risk_pct": round(max(seu_pct, charging_pct), 2),
            },
            "lifetime_degradation_risk": level,
            "recommended_actions": recommendations,
        }

    # ------------------------------------------------------------- thresholds
    def _level_from_score(self, score: float) -> str:
        if score < 0.25:
            return "Low"
        if score < 0.50:
            return "Medium"
        if score < 0.75:
            return "High"
        return "Critical"

    def _recommendations(
        self,
        orbit: str,
        altitude_km: float,
        daily_decay: float,
        seu_pct: float,
        charging_pct: float,
    ) -> list[str]:
        acts: list[str] = []
        if orbit == "LEO" and daily_decay >= 0.02 and altitude_km <= 700.0:
            delta_v = 8.0 if daily_decay < 0.08 else 15.0
            acts.append(
                f"Fire thrusters +{delta_v:.0f} m/s to restore altitude and offset "
                f"{daily_decay:.3f} km/day of atmospheric drag loss"
            )
        elif daily_decay >= 0.4:
            acts.append("Critical drag detected: schedule immediate orbit-raising burn")
        if charging_pct >= 50.0:
            acts.append("Enter Safe Mode - power down sensitive payloads during charging")
        elif charging_pct >= 25.0:
            acts.append("Enable active charge mitigation; reorient booms away from plasma")
        if seu_pct >= 50.0:
            acts.append("Schedule payload electronics scrub and raise EDAC margin")
        elif seu_pct >= 25.0:
            acts.append("Monitor telemetry for soft errors; keep redundancy systems armed")
        if not acts:
            acts.append("Nominal operations - continue standard monitoring cadence")
        return acts


engine = InferenceEngine()

