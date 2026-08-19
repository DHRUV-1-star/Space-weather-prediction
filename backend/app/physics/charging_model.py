import math
from typing import Dict

def calculate_spacecraft_charging_risk(
    altitude_km: float,
    inclination_deg: float,
    orbit_type: str,
    electron_flux_2mev: float,
    kp_index: float,
    dielectric_coating_quality: str
) -> Dict:
    """
    Evaluates Surface and Deep Dielectric Charging (Internal ESD):
    - GEO and high MEO are prone to substorm plasma injection & relativistic electron charging.
    - LEO polar crossing experiences high auroral current sheets.
    - Low conductivity thermal blankets/coatings accumulate differential voltage kV.
    """
    is_geo_or_high_meo = altitude_km >= 18000.0
    is_auroral_leo = altitude_km < 1500.0 and inclination_deg >= 60.0
    
    coating_mitigation_factors = {
        "Low": 1.4,
        "Standard": 1.0,
        "Conductive ITO": 0.55,
        "Advanced Conductive": 0.3
    }
    coating_factor = coating_mitigation_factors.get(dielectric_coating_quality, 1.0)
    
    # Differential voltage build-up model (kV)
    base_voltage_kv = 0.2
    if is_geo_or_high_meo:
        # Substorm injection scales with Kp and relativistic electron flux
        electron_factor = min(4.0, math.log10(max(10.0, electron_flux_2mev)) / 2.0)
        kp_factor = (kp_index / 9.0) ** 1.5 * 8.0
        base_voltage_kv = (1.5 + kp_factor * 1.8) * electron_factor * coating_factor
    elif is_auroral_leo:
        base_voltage_kv = (0.5 + (kp_index / 9.0) * 3.0) * coating_factor
    else:
        base_voltage_kv = 0.1 * coating_factor
        
    surface_potential_kv = round(min(18.0, base_voltage_kv), 2)
    
    # Internal deep dielectric discharge hazard threshold is typically ~1-2 kV differential or >10^4 pfu 2MeV electron
    raw_risk = (surface_potential_kv / 10.0) * 85.0 + (electron_flux_2mev / 5000.0) * 15.0
    risk_score = round(max(5.0, min(95.0, raw_risk)), 1)
    
    level = "LOW"
    if risk_score >= 75:
        level = "CRITICAL"
    elif risk_score >= 55:
        level = "HIGH"
    elif risk_score >= 35:
        level = "MODERATE"
        
    return {
        "charging_risk_score": risk_score,
        "level": level,
        "surface_potential_kv": surface_potential_kv,
        "susceptible_regime": is_geo_or_high_meo or is_auroral_leo,
        "primary_mechanism": "Internal Deep Dielectric Charging" if is_geo_or_high_meo else ("Auroral Precipitation Charging" if is_auroral_leo else "Nominal Plasma Neutralization"),
        "physical_explanation": f"Differential surface potential estimated at -{surface_potential_kv:.1f} kV under relativistic electron flux of {electron_flux_2mev:.0f} cm⁻²s⁻¹sr⁻¹."
    }
