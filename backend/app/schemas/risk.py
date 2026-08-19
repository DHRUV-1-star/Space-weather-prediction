from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
from datetime import datetime

RiskLevel = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]

class FeatureContribution(BaseModel):
    name: str = Field(..., description="Feature name e.g. 'Kp Forecast', 'Atmospheric Density Surge', 'Altitude (550 km)'")
    contribution: float = Field(..., description="Risk points contributed (+/-)")
    category: str = Field("Environment", description="Category: 'Environment', 'Orbital', 'Spacecraft Hardware'")
    description: str = Field("", description="Physically grounded explanation of the contribution")

class SubsystemRisk(BaseModel):
    score: float = Field(..., ge=0, le=100, description="Risk score from 0 to 100")
    level: RiskLevel
    trend: Literal["rising", "stable", "improving"] = "stable"
    confidence: float = Field(85.0, ge=0, le=100)
    primary_threat: str
    key_metrics: Dict[str, str] = {}
    factors: List[str] = []
    physical_explanation: str

class RiskTimelinePoint(BaseModel):
    time_offset_hours: int
    time_label: str
    overall_risk: float
    drag_risk: float
    radiation_risk: float
    charging_risk: float
    comms_risk: float
    nav_risk: float

class MissionRiskAssessment(BaseModel):
    satellite_id: str
    satellite_name: str
    orbit_type: str
    altitude_km: float
    timestamp: datetime
    
    # Overall summary
    overall_risk: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    confidence: float = Field(..., ge=0, le=100)
    forecast_horizon_hours: int = 48
    peak_risk_time_hours: int = 12
    primary_threat: str
    
    # Subsystem breakdowns
    radiation_risk: SubsystemRisk
    drag_risk: SubsystemRisk
    communication_risk: SubsystemRisk
    navigation_risk: SubsystemRisk
    charging_risk: SubsystemRisk
    
    # Explainable AI / Physics contributions (SHAP-style)
    feature_contributions: List[FeatureContribution]
    
    # Physics derived metrics
    baseline_drag_force_mn: float = Field(..., description="Baseline aerodynamic drag force in millinewtons")
    storm_drag_force_mn: float = Field(..., description="Storm-elevated drag force in millinewtons")
    relative_drag_increase_pct: float = Field(..., description="Percentage increase in drag force")
    estimated_orbit_decay_rate_m_day: float = Field(..., description="Estimated orbital semi-major axis loss in meters/day")
    estimated_seu_rate_per_day: float = Field(..., description="Estimated Single Event Upsets (SEU) per device/day")
    surface_potential_kv: float = Field(..., description="Estimated spacecraft differential surface charging in kV")
    
    # Decision support recommendations
    recommendations: List[str]
    timeline: List[RiskTimelinePoint]
    
    inference_mode: str = "Physics-Informed Ensemble (Deterministic Prototype)"
    notes: str = "Decision-support estimation for mission operators — advisory only."

class WhatIfSimulationRequest(BaseModel):
    satellite_id: Optional[str] = None
    baseline_profile: Optional[dict] = None
    
    # Modifiable parameters
    simulated_altitude_km: float = Field(550.0, ge=150.0, le=40000.0)
    simulated_mass_kg: float = Field(1200.0, ge=10.0, le=20000.0)
    simulated_cross_sectional_area_m2: float = Field(4.5, ge=0.1, le=100.0)
    simulated_shielding_thickness_mm_al: float = Field(2.5, ge=0.5, le=20.0)
    simulated_radiation_hardening: str = "Rad-Tolerant"
    simulated_comms_dependency: int = Field(8, ge=1, le=10)
    simulated_nav_dependency: int = Field(7, ge=1, le=10)
    
    # Optional weather override
    override_kp_index: Optional[float] = None
    override_solar_wind_speed: Optional[float] = None
    override_proton_flux: Optional[float] = None

class WhatIfSimulationResponse(BaseModel):
    baseline_assessment: MissionRiskAssessment
    simulated_assessment: MissionRiskAssessment
    delta_overall_risk: float
    delta_drag_risk: float
    delta_radiation_risk: float
    delta_charging_risk: float
    delta_comms_risk: float
    delta_nav_risk: float
    change_explanations: List[str]
    mitigation_verdict: str
