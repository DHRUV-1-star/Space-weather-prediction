import math
from typing import Dict

EARTH_RADIUS_KM = 6378.137

def calculate_radiation_risk(
    altitude_km: float,
    inclination_deg: float,
    orbit_type: str,
    shielding_thickness_mm_al: float,
    radiation_hardening_level: str,
    solar_panel_sensitivity: int,
    proton_flux_10mev: float,
    proton_flux_100mev: float,
    electron_flux_2mev: float,
    kp_index: float
) -> Dict:
    """
    Computes cumulative space radiation exposure and Single Event Upset (SEU) risk.
    Accounts for:
      - Dipole magnetic cutoff (polar horn penetration for inc > 55 deg)
      - Van Allen belt trapping zones (Inner proton belt ~1000-6000 km, Outer electron belt ~13000-25000 km)
      - South Atlantic Anomaly (SAA) traversal in LEO
      - Solar Energetic Particle (SEP) storm events
      - Aluminum shielding attenuation (exponential absorption)
      - COTS vs Rad-Hard semiconductor sensitivity
    """
    r_km = EARTH_RADIUS_KM + altitude_km
    l_shell = r_km / (EARTH_RADIUS_KM * max(0.1, math.cos(math.radians(inclination_deg)) ** 2))
    
    # 1. Magnetospheric Shielding Cutoff
    # Polar cap exposure: high inclination satellites pass through open field lines with 0 cutoff
    is_polar = inclination_deg >= 55.0
    geomagnetic_shielding_factor = 0.2 if is_polar else max(0.05, min(0.95, math.cos(math.radians(inclination_deg)) ** 3))
    
    # 2. Environment flux by orbit regime
    trapped_proton_flux = 0.0
    trapped_electron_flux = 0.0
    
    if altitude_km < 800:
        # LEO: SAA dominates trapped protons
        trapped_proton_flux = 150.0 * (altitude_km / 500.0) ** 2
        trapped_electron_flux = 50.0
    elif 800 <= altitude_km <= 6000:
        # Inner Van Allen Belt — Extreme Proton Trap
        trapped_proton_flux = 8000.0 * math.exp(-((altitude_km - 3000.0) / 1500.0) ** 2)
        trapped_electron_flux = 1200.0
    elif 6000 < altitude_km < 12000:
        # Slot Region
        trapped_proton_flux = 500.0
        trapped_electron_flux = 800.0
    elif 12000 <= altitude_km <= 26000:
        # MEO / GPS regime: Heart of Outer Electron Radiation Belt
        trapped_proton_flux = 50.0
        trapped_electron_flux = 15000.0 * (1.0 + (kp_index / 9.0) * 2.0)
    else:
        # GEO / HEO
        trapped_proton_flux = 10.0
        trapped_electron_flux = max(electron_flux_2mev, 5000.0) * (1.0 + (kp_index / 9.0) * 1.5)
        
    # SEP solar storm flux reaching spacecraft:
    sep_proton_dose = (proton_flux_10mev * 10.0 + proton_flux_100mev * 200.0) * (1.0 - geomagnetic_shielding_factor if not is_polar else 1.0)
    
    total_unshielded_ionizing_flux = trapped_proton_flux + trapped_electron_flux * 0.1 + sep_proton_dose
    
    # 3. Spacecraft Shielding Attenuation: Beer-Lambert equivalent absorption
    # Effective mass absorption coefficient mu ~ 0.28 / mm Al for typical trapped/SEP spectrum
    shielding_attenuation = math.exp(-0.28 * max(0.5, shielding_thickness_mm_al))
    shielded_flux = total_unshielded_ionizing_flux * shielding_attenuation
    
    # 4. Semiconductor Hardening Multiplier
    hardening_multipliers = {
        "Commercial (COTS)": 3.0,
        "Industrial": 1.8,
        "Rad-Tolerant": 1.0,
        "Rad-Hard (Mil/Space)": 0.35
    }
    hard_factor = hardening_multipliers.get(radiation_hardening_level, 1.0)
    
    # Single Event Upset rate estimate (events per device per day)
    base_seu_rate = (shielded_flux * 0.002) * hard_factor
    seu_rate_per_day = round(max(0.01, base_seu_rate), 3)
    
    # Solar panel degradation rate factor
    solar_array_factor = 1.0 + (solar_panel_sensitivity / 10.0) * 0.5
    
    # Normalized risk score 0 - 100
    norm_flux = min(1.0, math.log10(max(1.0, shielded_flux)) / 4.0)
    raw_risk = (norm_flux * 60.0 + (seu_rate_per_day / 2.0) * 25.0 + (proton_flux_10mev / 50.0) * 15.0) * solar_array_factor
    risk_score = round(max(5.0, min(99.0, raw_risk)), 1)
    
    level = "LOW"
    if risk_score >= 80:
        level = "CRITICAL"
    elif risk_score >= 60:
        level = "HIGH"
    elif risk_score >= 35:
        level = "MODERATE"
        
    return {
        "radiation_risk_score": risk_score,
        "level": level,
        "estimated_seu_rate_per_day": seu_rate_per_day,
        "shielded_flux_index": round(shielded_flux, 1),
        "shielding_attenuation_pct": round((1.0 - shielding_attenuation) * 100.0, 1),
        "l_shell": round(l_shell, 2),
        "polar_horn_penetration": is_polar,
        "physical_explanation": f"Shielding of {shielding_thickness_mm_al:.1f}mm Al reduces ionizing flux by {(1.0 - shielding_attenuation)*100:.0f}%. Est. SEU rate: {seu_rate_per_day:.2f}/device/day."
    }
