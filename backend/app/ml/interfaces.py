from abc import ABC, abstractmethod
from typing import Dict, List, Tuple
from app.schemas.space_weather import FlareForecast, GeomagneticForecast, SpaceWeatherTelemetry
from app.schemas.satellite import SatelliteProfile
from app.schemas.risk import FeatureContribution

class AbstractFlareClassifierModel(ABC):
    """
    Abstract Interface for Solar Flare Classification Models.
    Allows drop-in replacement of deterministic models with trained XGBoost / Random Forest / ONNX models.
    """
    @abstractmethod
    def predict_flare_probabilities(
        self,
        current_flux_xray: float,
        kp_index: float,
        recent_trend: float = 1.2
    ) -> FlareForecast:
        pass

class AbstractGeomagneticStormModel(ABC):
    """
    Abstract Interface for Geomagnetic Storm Severity Models.
    Supports interplanetary energy coupling function dPhi/dt and XGBoost regression/classification.
    """
    @abstractmethod
    def predict_geomagnetic_storm(
        self,
        solar_wind_speed: float,
        imf_bz: float,
        solar_wind_density: float,
        kp_current: float
    ) -> GeomagneticForecast:
        pass

class AbstractExplainabilityEngine(ABC):
    """
    Abstract Interface for Model Explainability & Feature Contribution Breakdown (SHAP-style).
    """
    @abstractmethod
    def compute_feature_contributions(
        self,
        satellite: SatelliteProfile,
        weather: SpaceWeatherTelemetry,
        drag_risk_score: float,
        rad_risk_score: float
    ) -> List[FeatureContribution]:
        pass
