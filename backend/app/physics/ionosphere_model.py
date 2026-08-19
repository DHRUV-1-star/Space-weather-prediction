import math
from typing import Dict

def calculate_comms_and_nav_risk(
    solar_flux_xray: float,
    kp_index: float,
    comms_dependency: int,
    nav_dependency: int,
    orbit_type: str,
    altitude_km: float
) -> Dict:
    """
    Evaluates:
      1. Communication Link Degradation:
         - D-region ionization & HF absorption from solar X-ray flares (GOES R-scale)
         - S-band/X-band telemetry attenuation & ground station phase jitter
      2. GNSS/Navigation Degradation:
         - Ionospheric scintillation index (S4)
         - Total Electron Content (TEC) rapid rate of change (ROTI) causing pseudorange delay errors
    """
    # X-ray flux log scale: 1e-4 is X-class, 1e-5 M-class, 1e-6 C-class
    log_flux = math.log10(max(1e-9, solar_flux_xray))
    
    # Flare absorption intensity 0 to 1
    # -8 -> 0.0, -4 -> 1.0
    flare_factor = max(0.0, min(1.0, (log_flux + 8.0) / 4.0))
    
    # Storm-enhanced TEC and equatorial plasma bubbles (driven by Kp)
    kp_factor = (kp_index / 9.0)
    
    # Estimated Scintillation S4 index (0.0 to 1.0)
    s4_index = round(min(0.95, 0.08 + flare_factor * 0.35 + kp_factor * 0.55), 2)
    
    # Ionospheric pseudorange error estimate in meters
    pseudorange_error_m = round(max(0.5, (s4_index * 18.0) + (kp_factor * 12.0)), 1)
    
    # Communication Risk Calculation
    comms_weight = comms_dependency / 10.0
    raw_comms_risk = (flare_factor * 55.0 + kp_factor * 35.0 + 10.0) * comms_weight
    comms_risk_score = round(max(5.0, min(95.0, raw_comms_risk)), 1)
    
    # Navigation Risk Calculation
    nav_weight = nav_dependency / 10.0
    raw_nav_risk = (s4_index * 60.0 + kp_factor * 30.0 + 10.0) * nav_weight
    nav_risk_score = round(max(5.0, min(95.0, raw_nav_risk)), 1)
    
    def get_level(score: float) -> str:
        if score >= 75: return "CRITICAL"
        if score >= 55: return "HIGH"
        if score >= 35: return "MODERATE"
        return "LOW"
        
    return {
        "comms_risk_score": comms_risk_score,
        "comms_level": get_level(comms_risk_score),
        "nav_risk_score": nav_risk_score,
        "nav_level": get_level(nav_risk_score),
        "scintillation_s4_index": s4_index,
        "gnss_pseudorange_error_m": pseudorange_error_m,
        "comms_explanation": f"Solar X-ray flux of {solar_flux_xray:.2e} W/m² and Kp {kp_index:.1f} elevate D-region absorption and telemetry jitter.",
        "nav_explanation": f"Ionospheric scintillation S4 index of {s4_index:.2f} introduces up to ±{pseudorange_error_m:.1f}m GNSS timing/position error."
    }
