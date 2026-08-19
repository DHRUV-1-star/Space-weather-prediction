import math
from typing import Dict, Tuple

# Physical constants
EARTH_RADIUS_KM = 6378.137
EARTH_GM = 3.986004418e14  # m^3 / s^2
SECONDS_PER_DAY = 86400.0

def get_orbital_velocity(altitude_km: float) -> float:
    """Returns circular orbital velocity in m/s for a given altitude in km."""
    r = (EARTH_RADIUS_KM + altitude_km) * 1000.0
    return math.sqrt(EARTH_GM / r)

def get_orbital_period_minutes(altitude_km: float) -> float:
    """Returns circular orbital period in minutes."""
    r = (EARTH_RADIUS_KM + altitude_km) * 1000.0
    v = get_orbital_velocity(altitude_km)
    circumference = 2.0 * math.pi * r
    return (circumference / v) / 60.0

def estimate_thermospheric_density(altitude_km: float, kp_index: float, f10_7_flux: float = 150.0) -> Tuple[float, float, float]:
    """
    Simplified physics-informed NRLMSISE-00 / Jacchia-Roberts hybrid thermospheric model.
    Calculates:
      - rho_baseline: quiet thermospheric density (kg/m^3)
      - rho_storm: storm-elevated density accounting for Joule heating and EUV expansion (kg/m^3)
      - density_ratio: multiplier of density expansion
    """
    if altitude_km > 1000.0:
        # Exosphere / above major neutral atmosphere
        return 1e-17, 1e-17, 1.0
    
    # Reference density layers (altitude km, base density kg/m^3, scale height H km)
    layers = [
        (200.0, 3.3e-10, 37.5),
        (300.0, 2.4e-11, 48.0),
        (400.0, 2.8e-12, 58.2),
        (500.0, 4.3e-13, 68.0),
        (600.0, 8.6e-14, 78.5),
        (700.0, 2.0e-14, 90.0),
        (800.0, 5.0e-15, 105.0),
        (1000.0, 3.5e-16, 130.0)
    ]
    
    # Find matching layer
    matched_layer = layers[0]
    for alt, rho_0, h_scale in layers:
        if altitude_km >= alt:
            matched_layer = (alt, rho_0, h_scale)
        else:
            break
            
    alt_ref, rho_ref, scale_height = matched_layer
    # Quiet exponential decay
    rho_baseline = rho_ref * math.exp(-(altitude_km - alt_ref) / scale_height)
    
    # Space weather solar EUV heating factor (F10.7 standard is 70 quiet, up to 250 active)
    f107_factor = 1.0 + 0.003 * max(0.0, f10_7_flux - 70.0)
    
    # Geomagnetic Joule heating factor: high Kp causes auroral & global thermosphere upwelling
    # Scales non-linearly: Kp=7 -> ~3x to 5x density at 400-500km
    kp_norm = kp_index / 9.0
    altitude_vulnerability = max(0.2, (800.0 - altitude_km) / 500.0) if altitude_km < 800 else 0.1
    kp_surge = 1.0 + (kp_norm ** 1.7) * (4.5 * altitude_vulnerability)
    
    rho_storm = rho_baseline * f107_factor * kp_surge
    density_ratio = rho_storm / max(rho_baseline, 1e-20)
    
    return rho_baseline, rho_storm, density_ratio

def calculate_atmospheric_drag_risk(
    altitude_km: float,
    mass_kg: float,
    cross_sectional_area_m2: float,
    drag_coefficient_cd: float,
    kp_index: float,
    f10_7_flux: float = 160.0
) -> Dict:
    """
    Computes rigorous physical drag quantities and converts to an interpretable risk score.
    Formula: F_D = 0.5 * Cd * rho * v^2 * A
    Ballistic Coeff: B = mass / (Cd * A)
    Decay: delta_a = -2 * pi * (Cd * A / mass) * rho * a^2
    """
    if altitude_km >= 1200.0:
        return {
            "drag_risk_score": 5.0,
            "level": "LOW",
            "baseline_drag_force_mn": 0.0001,
            "storm_drag_force_mn": 0.0001,
            "relative_drag_increase_pct": 0.0,
            "orbit_decay_rate_m_day": 0.01,
            "ballistic_coefficient": mass_kg / max(0.01, drag_coefficient_cd * cross_sectional_area_m2),
            "physical_explanation": "Altitude > 1200 km is above the effective thermospheric drag domain."
        }
        
    v = get_orbital_velocity(altitude_km)
    rho_base, rho_storm, density_ratio = estimate_thermospheric_density(altitude_km, kp_index, f10_7_flux)
    
    # Drag force: F_D = 0.5 * Cd * rho * v^2 * A  (in Newtons)
    f_drag_base_n = 0.5 * drag_coefficient_cd * rho_base * (v ** 2) * cross_sectional_area_m2
    f_drag_storm_n = 0.5 * drag_coefficient_cd * rho_storm * (v ** 2) * cross_sectional_area_m2
    
    f_drag_base_mn = f_drag_base_n * 1000.0  # millinewtons
    f_drag_storm_mn = f_drag_storm_n * 1000.0
    
    relative_increase_pct = ((f_drag_storm_mn - f_drag_base_mn) / max(f_drag_base_mn, 1e-9)) * 100.0
    
    # Ballistic coefficient B = m / (Cd * A)
    ballistic_coeff = mass_kg / max(0.01, drag_coefficient_cd * cross_sectional_area_m2)
    
    # Semi-major axis loss in meters per day:
    # delta_a_day = -2 * pi * rho * a^2 * (v / Period) * (Cd * A / m) * (86400 / Period_sec)
    r_orbit = (EARTH_RADIUS_KM + altitude_km) * 1000.0
    period_sec = (2.0 * math.pi * r_orbit) / v
    orbits_per_day = SECONDS_PER_DAY / period_sec
    delta_a_per_orbit_m = 2.0 * math.pi * (drag_coefficient_cd * cross_sectional_area_m2 / mass_kg) * rho_storm * (r_orbit ** 2)
    decay_rate_m_day = delta_a_per_orbit_m * orbits_per_day
    
    # Compute normalized drag risk score (0 to 100)
    # Satellites < 400km are inherently high risk during storms; 500-600km moderate; >800km low
    altitude_factor = max(0.0, min(1.0, (750.0 - altitude_km) / 450.0))
    decay_factor = min(1.0, math.log10(max(1.0, decay_rate_m_day + 1.0)) / 2.5)
    kp_contribution = (kp_index / 9.0) * 0.4
    area_to_mass = (cross_sectional_area_m2 / mass_kg) * 1000.0  # m^2 per tonne
    geometry_factor = min(1.0, area_to_mass / 5.0)
    
    raw_risk = (altitude_factor * 0.45 + decay_factor * 0.35 + kp_contribution + geometry_factor * 0.2) * 100.0
    risk_score = round(max(5.0, min(98.0, raw_risk)), 1)
    
    level = "LOW"
    if risk_score >= 80:
        level = "CRITICAL"
    elif risk_score >= 60:
        level = "HIGH"
    elif risk_score >= 35:
        level = "MODERATE"
        
    return {
        "drag_risk_score": risk_score,
        "level": level,
        "baseline_drag_force_mn": round(f_drag_base_mn, 4),
        "storm_drag_force_mn": round(f_drag_storm_mn, 4),
        "relative_drag_increase_pct": round(relative_increase_pct, 1),
        "orbit_decay_rate_m_day": round(decay_rate_m_day, 2),
        "ballistic_coefficient": round(ballistic_coeff, 1),
        "density_expansion_ratio": round(density_ratio, 2),
        "physical_explanation": f"Thermospheric density increased by {density_ratio:.1f}x from Joule heating, causing orbital decay rate of ~{decay_rate_m_day:.1f} m/day."
    }
