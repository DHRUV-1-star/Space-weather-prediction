from datetime import datetime, timezone
from typing import Dict, List
import math

from app.schemas.satellite import SatelliteProfile
from app.schemas.space_weather import SpaceWeatherTelemetry
from app.schemas.risk import MissionRiskAssessment, SubsystemRisk, RiskTimelinePoint, RiskLevel
from app.physics.drag_model import calculate_atmospheric_drag_risk
from app.physics.radiation_model import calculate_radiation_risk
from app.physics.charging_model import calculate_spacecraft_charging_risk
from app.physics.ionosphere_model import calculate_comms_and_nav_risk
from app.ml.inference import SpaceWeatherMLEngine
from app.risk.recommendations import generate_operational_recommendations

def get_mission_weights(mission_type: str, orbit_type: str, altitude_km: float) -> Dict[str, float]:
    """
    Computes dynamic subsystem weighting based on mission profile and orbital regime.
    """
    if orbit_type == "LEO" and altitude_km < 750:
        if mission_type == "Earth Observation":
            return {"drag": 0.40, "radiation": 0.20, "comms": 0.20, "nav": 0.15, "charging": 0.05}
        elif mission_type == "Scientific":
            return {"drag": 0.35, "radiation": 0.30, "comms": 0.15, "nav": 0.10, "charging": 0.10}
        else:
            return {"drag": 0.35, "radiation": 0.25, "comms": 0.20, "nav": 0.15, "charging": 0.05}
    elif orbit_type == "GEO":
        return {"drag": 0.02, "radiation": 0.30, "comms": 0.35, "nav": 0.05, "charging": 0.28}
    elif orbit_type == "MEO":
        return {"drag": 0.02, "radiation": 0.45, "comms": 0.15, "nav": 0.30, "charging": 0.08}
    else: # HEO / Other
        return {"drag": 0.15, "radiation": 0.35, "comms": 0.20, "nav": 0.15, "charging": 0.15}

def evaluate_mission_risk(satellite: SatelliteProfile, weather: SpaceWeatherTelemetry) -> MissionRiskAssessment:
    """
    Full physics-informed & ML-assisted mission risk evaluation.
    """
    # 1. Physics Calculations
    drag_res = calculate_atmospheric_drag_risk(
        altitude_km=satellite.altitude_km,
        mass_kg=satellite.mass_kg,
        cross_sectional_area_m2=satellite.cross_sectional_area_m2,
        drag_coefficient_cd=satellite.drag_coefficient_cd,
        kp_index=weather.kp_index,
        f10_7_flux=weather.f10_7_cm_flux
    )
    
    rad_res = calculate_radiation_risk(
        altitude_km=satellite.altitude_km,
        inclination_deg=satellite.inclination_deg,
        orbit_type=satellite.orbit_type,
        shielding_thickness_mm_al=satellite.shielding_thickness_mm_al,
        radiation_hardening_level=satellite.radiation_hardening_level,
        solar_panel_sensitivity=satellite.solar_panel_sensitivity,
        proton_flux_10mev=weather.proton_flux_10mev,
        proton_flux_100mev=weather.proton_flux_100mev,
        electron_flux_2mev=weather.electron_flux_2mev,
        kp_index=weather.kp_index
    )
    
    charge_res = calculate_spacecraft_charging_risk(
        altitude_km=satellite.altitude_km,
        inclination_deg=satellite.inclination_deg,
        orbit_type=satellite.orbit_type,
        electron_flux_2mev=weather.electron_flux_2mev,
        kp_index=weather.kp_index,
        dielectric_coating_quality=satellite.dielectric_coating_quality
    )
    
    ion_res = calculate_comms_and_nav_risk(
        solar_flux_xray=weather.solar_flux_xray,
        kp_index=weather.kp_index,
        comms_dependency=satellite.communication_dependency,
        nav_dependency=satellite.navigation_dependency,
        orbit_type=satellite.orbit_type,
        altitude_km=satellite.altitude_km
    )
    
    # 2. Build Subsystem Risk Objects
    sub_drag = SubsystemRisk(
        score=drag_res["drag_risk_score"],
        level=drag_res["level"],
        trend="rising" if weather.kp_index > 4.5 and satellite.altitude_km < 650 else "stable",
        confidence=88.0,
        primary_threat="Neutral Thermospheric Expansion & Drag Deceleration",
        key_metrics={
            "Decay Rate": f"{drag_res['orbit_decay_rate_m_day']} m/day",
            "Drag Force": f"{drag_res['storm_drag_force_mn']} mN",
            "Density Surge": f"+{drag_res['relative_drag_increase_pct']}%"
        },
        factors=["Atmospheric Joule Heating", "Area/Mass Cross Section", "Ballistic Coeff"],
        physical_explanation=drag_res["physical_explanation"]
    )
    
    sub_rad = SubsystemRisk(
        score=rad_res["radiation_risk_score"],
        level=rad_res["level"],
        trend="rising" if weather.proton_flux_10mev > 10.0 else "stable",
        confidence=84.0,
        primary_threat="Ionizing Particle Flux & Single Event Upsets (SEU)",
        key_metrics={
            "Est. SEU Rate": f"{rad_res['estimated_seu_rate_per_day']} /dev/day",
            "Shielding Atten.": f"{rad_res['shielding_attenuation_pct']}%",
            "L-Shell": f"{rad_res['l_shell']}"
        },
        factors=["Trapped Protons", "SEP Storm Injection", "Shielding Thickness"],
        physical_explanation=rad_res["physical_explanation"]
    )
    
    sub_charge = SubsystemRisk(
        score=charge_res["charging_risk_score"],
        level=charge_res["level"],
        trend="rising" if weather.electron_flux_2mev > 1000 and satellite.altitude_km > 10000 else "stable",
        confidence=80.0,
        primary_threat=charge_res["primary_mechanism"],
        key_metrics={
            "Surface Potential": f"-{charge_res['surface_potential_kv']} kV",
            "Relativistic Electron": f"{weather.electron_flux_2mev:.0f} pfu",
            "Coating Mitigation": satellite.dielectric_coating_quality
        },
        factors=["Substorm Injection", "Relativistic Electrons", "Dielectric Surface"],
        physical_explanation=charge_res["physical_explanation"]
    )
    
    sub_comms = SubsystemRisk(
        score=ion_res["comms_risk_score"],
        level=ion_res["comms_level"],
        trend="rising" if weather.solar_flux_xray > 1e-5 else "stable",
        confidence=86.0,
        primary_threat="D-Region Solar Flare Radio Absorption & Phase Jitter",
        key_metrics={
            "X-Ray Flux": f"{weather.solar_flux_xray:.2e} W/m²",
            "Flare Class": weather.flare_class,
            "Link Margin Impact": "-3.8 dB" if ion_res["comms_risk_score"] > 60 else "-0.9 dB"
        },
        factors=["X-Ray Flux", "Daylight Absorption", "Link Criticality"],
        physical_explanation=ion_res["comms_explanation"]
    )
    
    sub_nav = SubsystemRisk(
        score=ion_res["nav_risk_score"],
        level=ion_res["nav_level"],
        trend="rising" if weather.kp_index > 5 else "stable",
        confidence=85.0,
        primary_threat="Ionospheric TEC Scintillation & Phase Delay",
        key_metrics={
            "Scintillation S4": f"{ion_res['scintillation_s4_index']}",
            "Pseudorange Error": f"±{ion_res['gnss_pseudorange_error_m']} m",
            "Lock Loss Risk": "Elevated" if ion_res["scintillation_s4_index"] > 0.6 else "Nominal"
        },
        factors=["TEC Gradient", "S4 Scintillation", "GNSS Dependency"],
        physical_explanation=ion_res["nav_explanation"]
    )
    
    # 3. Overall Weighted Mission Risk
    weights = get_mission_weights(satellite.mission_type, satellite.orbit_type, satellite.altitude_km)
    raw_overall = (
        sub_drag.score * weights["drag"] +
        sub_rad.score * weights["radiation"] +
        sub_charge.score * weights["charging"] +
        sub_comms.score * weights["comms"] +
        sub_nav.score * weights["nav"]
    )
    
    overall_score = round(max(5.0, min(99.0, raw_overall)), 1)
    
    risk_level: RiskLevel = "LOW"
    if overall_score >= 80:
        risk_level = "CRITICAL"
    elif overall_score >= 60:
        risk_level = "HIGH"
    elif overall_score >= 35:
        risk_level = "MODERATE"
        
    # Primary threat identification
    sub_scores = [
        ("Atmospheric Drag", sub_drag.score),
        ("Ionizing Radiation & SEUs", sub_rad.score),
        ("Spacecraft Charging / ESD", sub_charge.score),
        ("Communications Blackout", sub_comms.score),
        ("Navigation Scintillation", sub_nav.score)
    ]
    sub_scores.sort(key=lambda x: x[1], reverse=True)
    primary_threat = sub_scores[0][0]
    
    # 4. Explainable AI Feature Contributions
    feature_contributions = SpaceWeatherMLEngine.compute_explainable_contributions(
        satellite_altitude=satellite.altitude_km,
        satellite_mass=satellite.mass_kg,
        satellite_area=satellite.cross_sectional_area_m2,
        shielding_mm=satellite.shielding_thickness_mm_al,
        orbit_type=satellite.orbit_type,
        kp_index=weather.kp_index,
        solar_wind_speed=weather.solar_wind_speed_kms,
        proton_flux_10mev=weather.proton_flux_10mev,
        solar_flux_xray=weather.solar_flux_xray,
        drag_risk_score=sub_drag.score,
        rad_risk_score=sub_rad.score
    )
    
    # 5. Operational Recommendations
    recommendations = generate_operational_recommendations(
        drag=sub_drag,
        radiation=sub_rad,
        charging=sub_charge,
        comms=sub_comms,
        nav=sub_nav,
        altitude_km=satellite.altitude_km,
        orbit_type=satellite.orbit_type,
        mission_type=satellite.mission_type
    )
    
    # 6. 48-Hour Forward Risk Timeline Simulation
    timeline: List[RiskTimelinePoint] = []
    offsets = [0, 4, 8, 12, 18, 24, 36, 48]
    # Storm profile simulation (peaks around T+12h to T+18h)
    for offset in offsets:
        if offset == 0:
            mult = 1.0
        elif offset <= 12:
            mult = 1.0 + (offset / 12.0) * 0.25
        elif offset <= 24:
            mult = 1.25 - ((offset - 12) / 12.0) * 0.15
        else:
            mult = 1.10 - ((offset - 24) / 24.0) * 0.35
            
        t_overall = round(max(5.0, min(99.0, overall_score * mult)), 1)
        t_drag = round(max(5.0, min(99.0, sub_drag.score * mult)), 1)
        t_rad = round(max(5.0, min(99.0, sub_rad.score * (1.0 + math.sin(offset/6.0)*0.15))), 1)
        t_charge = round(max(5.0, min(99.0, sub_charge.score * mult)), 1)
        t_comms = round(max(5.0, min(99.0, sub_comms.score * (1.1 if offset < 12 else 0.8))), 1)
        t_nav = round(max(5.0, min(99.0, sub_nav.score * mult)), 1)
        
        timeline.append(RiskTimelinePoint(
            time_offset_hours=offset,
            time_label=f"T+{offset}h" if offset > 0 else "Now",
            overall_risk=t_overall,
            drag_risk=t_drag,
            radiation_risk=t_rad,
            charging_risk=t_charge,
            comms_risk=t_comms,
            nav_risk=t_nav
        ))
        
    return MissionRiskAssessment(
        satellite_id=satellite.id,
        satellite_name=satellite.name,
        orbit_type=satellite.orbit_type,
        altitude_km=satellite.altitude_km,
        timestamp=datetime.now(timezone.utc),
        overall_risk=overall_score,
        risk_level=risk_level,
        confidence=85.0,
        forecast_horizon_hours=48,
        peak_risk_time_hours=12,
        primary_threat=primary_threat,
        radiation_risk=sub_rad,
        drag_risk=sub_drag,
        communication_risk=sub_comms,
        navigation_risk=sub_nav,
        charging_risk=sub_charge,
        feature_contributions=feature_contributions,
        baseline_drag_force_mn=drag_res["baseline_drag_force_mn"],
        storm_drag_force_mn=drag_res["storm_drag_force_mn"],
        relative_drag_increase_pct=drag_res["relative_drag_increase_pct"],
        estimated_orbit_decay_rate_m_day=drag_res["orbit_decay_rate_m_day"],
        estimated_seu_rate_per_day=rad_res["estimated_seu_rate_per_day"],
        surface_potential_kv=charge_res["surface_potential_kv"],
        recommendations=recommendations,
        timeline=timeline,
        inference_mode=SpaceWeatherMLEngine.get_inference_mode_label(),
        notes="Model output is advisory for mission planning."
    )
