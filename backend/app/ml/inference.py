from typing import List, Dict, Optional
from datetime import datetime, timezone
from app.schemas.space_weather import FlareForecast, GeomagneticForecast, SpaceWeatherTelemetry
from app.schemas.satellite import SatelliteProfile
from app.schemas.risk import FeatureContribution
from app.ml.adapters import (
    XGBoostFlareModelAdapter,
    XGBoostGeomagneticModelAdapter,
    SHAPExplainabilityEngine
)

class SpaceWeatherMLEngine:
    """
    Unified ML & Physics Inference Registry for Space Weather & Satellite Mission Risk:
    - Encapsulates Model Interfaces (AbstractBaseClasses) and Model Adapters.
    - Uses trained XGBoost models if model files exist; gracefully defaults to deterministic
      physics-informed inference if missing ("Prototype Inference Mode").
    - Computes SHAP-equivalent feature contribution vectors for explainable AI.
    """
    _flare_model = XGBoostFlareModelAdapter()
    _geomag_model = XGBoostGeomagneticModelAdapter()
    _explainability_engine = SHAPExplainabilityEngine()

    @classmethod
    def predict_flare_probabilities(
        cls,
        current_flux_xray: float,
        kp_index: float,
        recent_trend: float = 1.2
    ) -> FlareForecast:
        return cls._flare_model.predict_flare_probabilities(current_flux_xray, kp_index, recent_trend)

    @classmethod
    def predict_geomagnetic_storm(
        cls,
        solar_wind_speed: float,
        imf_bz: float,
        solar_wind_density: float,
        kp_current: float
    ) -> GeomagneticForecast:
        return cls._geomag_model.predict_geomagnetic_storm(solar_wind_speed, imf_bz, solar_wind_density, kp_current)

    @classmethod
    def compute_explainable_contributions(
        cls,
        satellite_altitude: float,
        satellite_mass: float,
        satellite_area: float,
        shielding_mm: float,
        orbit_type: str,
        kp_index: float,
        solar_wind_speed: float,
        proton_flux_10mev: float,
        solar_flux_xray: float,
        drag_risk_score: float,
        rad_risk_score: float
    ) -> List[FeatureContribution]:
        # Build lightweight profile & telemetry objects for adapter call
        dummy_sat = SatelliteProfile(
            id="SAT-EVAL",
            name="Evaluating Satellite",
            orbit_type=orbit_type,  # type: ignore
            altitude_km=satellite_altitude,
            mass_kg=satellite_mass,
            cross_sectional_area_m2=satellite_area,
            shielding_thickness_mm_al=shielding_mm
        )
        dummy_weather = SpaceWeatherTelemetry(
            timestamp=datetime.now(timezone.utc),
            solar_flux_xray=solar_flux_xray,
            kp_index=kp_index,
            solar_wind_speed_kms=solar_wind_speed,
            proton_flux_10mev=proton_flux_10mev
        )
        return cls._explainability_engine.compute_feature_contributions(
            dummy_sat, dummy_weather, drag_risk_score, rad_risk_score
        )

    @classmethod
    def get_inference_mode_label(cls) -> str:
        flare_loaded = cls._flare_model.is_trained_model_loaded
        geomag_loaded = cls._geomag_model.is_trained_model_loaded
        if flare_loaded and geomag_loaded:
            return "Trained XGBoost ML Ensemble"
        elif flare_loaded or geomag_loaded:
            return "Hybrid XGBoost / Deterministic ML"
        else:
            return "Physics-Informed Ensemble (Deterministic Prototype)"
