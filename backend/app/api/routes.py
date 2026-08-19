from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict
from datetime import datetime, timezone

from app.schemas.space_weather import SpaceWeatherTelemetry, SpaceWeatherForecast
from app.schemas.satellite import SatelliteProfile
from app.schemas.risk import (
    MissionRiskAssessment, WhatIfSimulationRequest, WhatIfSimulationResponse
)
from app.schemas.events import HistoricalEvent, AlertItem
from app.services.space_weather_service import space_weather_service, SCENARIOS
from app.services.satellite_service import satellite_service
from app.services.historical_service import historical_service
from app.risk.engine import evaluate_mission_risk

router = APIRouter()

# ────────────────────────────────────────────────────────
# Health Check
# ────────────────────────────────────────────────────────
@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "system": "ORBITAL SHIELD Decision Support API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc),
        "inference_engine": "Physics-Informed ML Ensemble"
    }

# ────────────────────────────────────────────────────────
# Space Weather Telemetry & Scenarios
# ────────────────────────────────────────────────────────
@router.get("/space-weather/current", response_model=SpaceWeatherTelemetry)
def get_current_space_weather(scenario: Optional[str] = Query(None)):
    return space_weather_service.get_current_telemetry(scenario)

@router.post("/space-weather/scenario", response_model=SpaceWeatherTelemetry)
def set_scenario(scenario_key: str = Body(..., embed=True)):
    if scenario_key not in SCENARIOS:
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Choices: {list(SCENARIOS.keys())}")
    return space_weather_service.set_active_scenario(scenario_key)

@router.get("/space-weather/live", response_model=SpaceWeatherTelemetry)
async def fetch_live_noaa():
    return await space_weather_service.fetch_live_noaa_telemetry()

@router.get("/space-weather/forecast", response_model=SpaceWeatherForecast)
def get_forecast(scenario: Optional[str] = Query(None)):
    return space_weather_service.get_forecast(scenario)

@router.get("/alerts", response_model=List[AlertItem])
def get_alerts():
    return space_weather_service.get_active_alerts()

# ────────────────────────────────────────────────────────
# Satellite Digital Twins
# ────────────────────────────────────────────────────────
@router.get("/satellites", response_model=List[SatelliteProfile])
def list_satellites():
    return satellite_service.list_satellites()

@router.get("/satellites/{satellite_id}", response_model=SatelliteProfile)
def get_satellite(satellite_id: str):
    sat = satellite_service.get_satellite(satellite_id)
    if not sat:
        raise HTTPException(status_code=404, detail=f"Satellite '{satellite_id}' not found.")
    return sat

@router.post("/satellites", response_model=SatelliteProfile)
def create_or_update_satellite(profile: SatelliteProfile):
    return satellite_service.save_satellite(profile)

@router.post("/satellites/{satellite_id}/select", response_model=SatelliteProfile)
def select_satellite(satellite_id: str):
    sat = satellite_service.select_active_satellite(satellite_id)
    if not sat:
        raise HTTPException(status_code=404, detail=f"Satellite '{satellite_id}' not found.")
    return sat

# ────────────────────────────────────────────────────────
# Mission Risk Assessment
# ────────────────────────────────────────────────────────
class RiskCalculationRequest(dict):
    satellite_id: Optional[str] = None
    satellite_profile: Optional[SatelliteProfile] = None
    scenario_override: Optional[str] = None

@router.post("/risk/calculate", response_model=MissionRiskAssessment)
def calculate_risk(
    satellite_id: Optional[str] = Query(None),
    scenario: Optional[str] = Query(None),
    custom_profile: Optional[SatelliteProfile] = None
):
    # Resolve satellite
    target_sat: Optional[SatelliteProfile] = None
    if custom_profile:
        target_sat = custom_profile
    elif satellite_id:
        target_sat = satellite_service.get_satellite(satellite_id)
    else:
        target_sat = satellite_service.get_satellite(satellite_service.selected_satellite_id)
        
    if not target_sat:
        target_sat = satellite_service.get_satellite("SAT-EO-01")
        
    weather = space_weather_service.get_current_telemetry(scenario)
    return evaluate_mission_risk(target_sat, weather)

# ────────────────────────────────────────────────────────
# What-If Simulator
# ────────────────────────────────────────────────────────
@router.post("/simulation", response_model=WhatIfSimulationResponse)
def run_what_if_simulation(req: WhatIfSimulationRequest):
    # 1. Establish baseline
    base_sat = satellite_service.get_satellite(req.satellite_id or satellite_service.selected_satellite_id)
    if not base_sat:
        base_sat = satellite_service.get_satellite("SAT-EO-01")
        
    base_weather = space_weather_service.get_current_telemetry()
    
    # 2. Evaluate baseline risk
    baseline_assessment = evaluate_mission_risk(base_sat, base_weather)
    
    # 3. Create simulated satellite profile
    sim_sat = base_sat.model_copy()
    sim_sat.id = f"{base_sat.id}-SIM"
    sim_sat.name = f"{base_sat.name} (Simulated)"
    sim_sat.altitude_km = req.simulated_altitude_km
    sim_sat.mass_kg = req.simulated_mass_kg
    sim_sat.cross_sectional_area_m2 = req.simulated_cross_sectional_area_m2
    sim_sat.shielding_thickness_mm_al = req.simulated_shielding_thickness_mm_al
    sim_sat.radiation_hardening_level = req.simulated_radiation_hardening  # type: ignore
    sim_sat.communication_dependency = req.simulated_comms_dependency
    sim_sat.navigation_dependency = req.simulated_nav_dependency
    
    # Check if orbit type changed due to altitude
    if req.simulated_altitude_km >= 35000.0:
        sim_sat.orbit_type = "GEO"
    elif req.simulated_altitude_km >= 2000.0:
        sim_sat.orbit_type = "MEO"
    else:
        sim_sat.orbit_type = "LEO"
        
    # Recompute ballistic coeff
    sim_sat.ballistic_coefficient = round(sim_sat.mass_kg / max(0.01, sim_sat.drag_coefficient_cd * sim_sat.cross_sectional_area_m2), 1)
    
    # 4. Simulated weather override if provided
    sim_weather = base_weather.model_copy()
    if req.override_kp_index is not None:
        sim_weather.kp_index = req.override_kp_index
    if req.override_solar_wind_speed is not None:
        sim_weather.solar_wind_speed_kms = req.override_solar_wind_speed
    if req.override_proton_flux is not None:
        sim_weather.proton_flux_10mev = req.override_proton_flux
        
    simulated_assessment = evaluate_mission_risk(sim_sat, sim_weather)
    
    # 5. Compute Deltas & Physical Explanations
    d_overall = round(simulated_assessment.overall_risk - baseline_assessment.overall_risk, 1)
    d_drag = round(simulated_assessment.drag_risk.score - baseline_assessment.drag_risk.score, 1)
    d_rad = round(simulated_assessment.radiation_risk.score - baseline_assessment.radiation_risk.score, 1)
    d_charge = round(simulated_assessment.charging_risk.score - baseline_assessment.charging_risk.score, 1)
    d_comms = round(simulated_assessment.communication_risk.score - baseline_assessment.communication_risk.score, 1)
    d_nav = round(simulated_assessment.navigation_risk.score - baseline_assessment.navigation_risk.score, 1)
    
    explanations: List[str] = []
    if abs(d_drag) > 3.0:
        if d_drag < 0:
            explanations.append(
                f"Increasing altitude to {sim_sat.altitude_km:.0f} km reduced thermospheric drag risk by {abs(d_drag):.1f} pts (orbit decay dropped from {baseline_assessment.estimated_orbit_decay_rate_m_day:.1f} to {simulated_assessment.estimated_orbit_decay_rate_m_day:.1f} m/day)."
            )
        else:
            explanations.append(
                f"Lowering altitude or increasing area/mass ratio elevated aerodynamic drag force from {baseline_assessment.storm_drag_force_mn:.3f} to {simulated_assessment.storm_drag_force_mn:.3f} mN (+{d_drag:.1f} pts)."
            )
            
    if abs(d_rad) > 3.0:
        if d_rad < 0:
            explanations.append(
                f"Increasing aluminum shielding from {base_sat.shielding_thickness_mm_al:.1f}mm to {sim_sat.shielding_thickness_mm_al:.1f}mm improved particle attenuation, reducing radiation risk by {abs(d_rad):.1f} pts."
            )
        else:
            explanations.append(
                f"Orbiting in higher radiation belt or thinner shielding increased estimated SEU rate (+{d_rad:.1f} pts)."
            )
            
    if len(explanations) == 0:
        explanations.append("Parameters produced minimal delta relative to current space weather baseline.")
        
    verdict = "Significant Risk Mitigation Achieved" if d_overall <= -10.0 else ("Risk Increased" if d_overall > 5.0 else "Marginal Risk Change")
    
    return WhatIfSimulationResponse(
        baseline_assessment=baseline_assessment,
        simulated_assessment=simulated_assessment,
        delta_overall_risk=d_overall,
        delta_drag_risk=d_drag,
        delta_radiation_risk=d_rad,
        delta_charging_risk=d_charge,
        delta_comms_risk=d_comms,
        delta_nav_risk=d_nav,
        change_explanations=explanations,
        mitigation_verdict=verdict
    )

# ────────────────────────────────────────────────────────
# Satellite Comparison
# ────────────────────────────────────────────────────────
class SatelliteComparisonRequest(dict):
    satellite_ids: List[str]

@router.post("/compare")
def compare_satellites(satellite_ids: List[str] = Body(..., embed=True)):
    if len(satellite_ids) < 2 or len(satellite_ids) > 4:
        satellite_ids = ["SAT-EO-01", "SAT-COM-01", "SAT-NAV-01"]
        
    weather = space_weather_service.get_current_telemetry()
    assessments = []
    
    for sat_id in satellite_ids:
        sat = satellite_service.get_satellite(sat_id)
        if sat:
            assessments.append({
                "satellite": sat,
                "assessment": evaluate_mission_risk(sat, weather)
            })
            
    comparison_analysis = [
        "LEO satellites (e.g. SAT-EO-01) experience predominantly atmospheric drag threats due to thermospheric expansion.",
        "GEO satellites (e.g. SAT-COM-01) are immune to drag but face extreme internal deep dielectric charging and substorm plasma injection.",
        "MEO satellites (e.g. SAT-NAV-01) pass through the heart of the outer electron radiation belt, experiencing high ionizing particle dose and GNSS scintillation."
    ]
    
    return {
        "space_weather": weather,
        "satellites_evaluated": assessments,
        "why_risks_differ": comparison_analysis
    }

# ────────────────────────────────────────────────────────
# Historical Events Replay
# ────────────────────────────────────────────────────────
@router.get("/events", response_model=List[HistoricalEvent])
def list_historical_events():
    return historical_service.list_events()

@router.get("/events/{event_id}", response_model=HistoricalEvent)
def get_historical_event(event_id: str):
    ev = historical_service.get_event(event_id)
    if not ev:
        raise HTTPException(status_code=404, detail=f"Historical event '{event_id}' not found.")
    return ev
