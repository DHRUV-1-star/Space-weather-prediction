import math
from typing import Dict, List
from app.schemas.space_weather import FlareForecast, GeomagneticForecast, RadiationForecast
from app.schemas.risk import FeatureContribution

class SpaceWeatherMLEngine:
    """
    ML/Physics Inference Engine for Space Weather & Mission Risk:
    - Provides deterministic feature-driven predictions for solar flare probabilities,
      geomagnetic storm severity, and satellite risk attribution.
    - Generates SHAP-style explainability vectors demonstrating exactly why
      a satellite is flagged for high risk.
    - Structured to allow drop-in replacement with trained XGBoost/PyTorch ONNX weights.
    """
    
    @staticmethod
    def predict_flare_probabilities(current_flux_xray: float, kp_index: float, recent_trend: float = 1.2) -> FlareForecast:
        """
        Solar Flare Classification (simulating Gradient Boosted Classifier / Random Forest).
        Inputs: GOES 0.1-0.8nm X-ray flux, magnetic complexity proxy, recent flux gradient.
        """
        log_flux = math.log10(max(1e-9, current_flux_xray))
        kp_norm = kp_index / 9.0
        
        # Base probabilities
        if log_flux >= -4.8: # Already near/in M/X class
            p_x = min(92.0, max(15.0, 35.0 + (log_flux + 4.5) * 40.0 + kp_norm * 15.0))
            p_m = min(88.0, max(20.0, 50.0 + kp_norm * 10.0))
            p_c = 95.0
        elif log_flux >= -5.8: # C/M class boundary
            p_x = min(45.0, max(2.0, 8.0 + (log_flux + 5.8) * 25.0 + kp_norm * 10.0))
            p_m = min(75.0, max(15.0, 30.0 + (log_flux + 5.8) * 35.0 + kp_norm * 12.0))
            p_c = min(99.0, 70.0 + kp_norm * 15.0)
        else: # Background / Quiet
            p_x = min(15.0, max(1.0, 2.0 + kp_norm * 4.0))
            p_m = min(35.0, max(4.0, 10.0 + kp_norm * 12.0))
            p_c = min(75.0, max(20.0, 45.0 + kp_norm * 20.0))
            
        confidence = round(min(96.0, 78.0 + (kp_norm * 10.0)), 1)
        
        return FlareForecast(
            class_c_prob=round(p_c, 1),
            class_m_prob=round(p_m, 1),
            class_x_prob=round(p_x, 1),
            confidence=confidence,
            primary_active_region="AR-3842 (Beta-Gamma-Delta)"
        )
        
    @staticmethod
    def predict_geomagnetic_storm(solar_wind_speed: float, imf_bz: float, solar_wind_density: float, kp_current: float) -> GeomagneticForecast:
        """
        Geomagnetic Storm Severity Classifier (simulating XGBoost / LSTM model).
        Physics drivers: Newell interplanetary coupling function dPhi/dt = v^(4/3) * Bt^(2/3) * sin(theta/2)^8
        Southward IMF Bz < 0 allows magnetic reconnection on dayside magnetopause.
        """
        bz_effective = max(0.0, -imf_bz) # positive when southward
        speed_factor = max(0.0, (solar_wind_speed - 350.0) / 450.0)
        density_factor = max(0.0, (solar_wind_density - 3.0) / 20.0)
        
        # Coupling energy index (0 to 1)
        coupling_index = min(1.0, (bz_effective / 15.0) * 0.5 + speed_factor * 0.35 + density_factor * 0.15 + (kp_current / 9.0) * 0.2)
        
        # Probabilities for G1 - G5
        p_g1 = round(min(98.0, max(10.0, coupling_index * 95.0 + 15.0)), 1)
        p_g2 = round(min(92.0, max(5.0, (coupling_index ** 1.3) * 90.0)), 1)
        p_g3 = round(min(80.0, max(2.0, (coupling_index ** 1.7) * 80.0)), 1)
        p_g4 = round(min(65.0, max(0.5, (coupling_index ** 2.2) * 70.0)), 1)
        p_g5 = round(min(45.0, max(0.1, (coupling_index ** 2.8) * 55.0)), 1)
        
        peak_kp = round(min(9.0, max(1.0, 2.0 + coupling_index * 7.0)), 1)
        confidence = round(min(94.0, 75.0 + coupling_index * 15.0), 1)
        
        return GeomagneticForecast(
            g1_prob=p_g1,
            g2_prob=p_g2,
            g3_prob=p_g3,
            g4_prob=p_g4,
            g5_prob=p_g5,
            kp_peak_forecast=peak_kp,
            kp_peak_horizon_hours=14,
            confidence=confidence
        )

    @staticmethod
    def compute_explainable_contributions(
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
        """
        Computes SHAP-equivalent feature attributions for risk scoring:
        Explains to the satellite operator exactly which environmental and spacecraft parameters
        are driving the elevated risk score.
        """
        contributions: List[FeatureContribution] = []
        
        # 1. Kp index contribution
        kp_pts = round((kp_index / 9.0) * 26.0, 1)
        contributions.append(FeatureContribution(
            name=f"Geomagnetic Activity (Kp {kp_index:.1f})",
            contribution=kp_pts,
            category="Environment",
            description=f"Elevated planetary K-index drives Joule heating in upper atmosphere and substorm injection."
        ))
        
        # 2. Solar Wind Speed
        sw_pts = round(max(0.0, (solar_wind_speed - 400.0) / 400.0 * 18.0), 1)
        if sw_pts > 1.0:
            contributions.append(FeatureContribution(
                name=f"Solar Wind Velocity ({solar_wind_speed:.0f} km/s)",
                contribution=sw_pts,
                category="Environment",
                description="High-speed solar wind stream compresses magnetopause and accelerates ring current."
            ))
            
        # 3. Altitude contribution
        if satellite_altitude < 600.0:
            alt_pts = round((600.0 - satellite_altitude) / 450.0 * 24.0, 1)
            contributions.append(FeatureContribution(
                name=f"Low Altitude ({satellite_altitude:.0f} km)",
                contribution=alt_pts,
                category="Orbital",
                description="Spacecraft orbits within dense thermospheric layer subject to extreme storm-induced drag expansion."
            ))
        elif 1000.0 <= satellite_altitude <= 6000.0:
            contributions.append(FeatureContribution(
                name=f"Inner Van Allen Belt ({satellite_altitude:.0f} km)",
                contribution=22.0,
                category="Orbital",
                description="Traverses trapped proton belt, causing severe cumulative ionizing dose and SEU hazards."
            ))
            
        # 4. Ballistic / Area-to-Mass ratio
        area_to_mass = (satellite_area / satellite_mass) * 1000.0
        if area_to_mass > 3.0 and satellite_altitude < 900.0:
            atm_pts = round(min(16.0, (area_to_mass - 2.0) * 3.5), 1)
            contributions.append(FeatureContribution(
                name=f"High Area/Mass Ratio ({satellite_area:.1f} m² / {satellite_mass:.0f} kg)",
                contribution=atm_pts,
                category="Spacecraft Hardware",
                description="Large cross-section accelerates orbital momentum loss per revolution."
            ))
            
        # 5. Proton Flux / Radiation
        if proton_flux_10mev > 1.0:
            prot_pts = round(min(20.0, math.log10(proton_flux_10mev + 1.0) * 9.0), 1)
            contributions.append(FeatureContribution(
                name=f"Solar Proton Flux ({proton_flux_10mev:.1f} pfu)",
                contribution=prot_pts,
                category="Environment",
                description="High-energy solar protons penetrate shielding, degrading solar cells and triggering bit-flips."
            ))
            
        # 6. Shielding Mitigation (Negative contribution = risk reduction)
        if shielding_mm >= 3.0:
            shield_reduc = round(-min(18.0, (shielding_mm - 1.5) * 2.8), 1)
            contributions.append(FeatureContribution(
                name=f"Heavy Shielding ({shielding_mm:.1f} mm Al)",
                contribution=shield_reduc,
                category="Spacecraft Hardware",
                description="Robust aluminum casing attenuates energetic electrons and softens trapped proton spectrum."
            ))
        elif shielding_mm < 2.0:
            shield_penalty = round((2.0 - shielding_mm) * 6.0, 1)
            contributions.append(FeatureContribution(
                name=f"Thin Shielding ({shielding_mm:.1f} mm Al)",
                contribution=shield_penalty,
                category="Spacecraft Hardware",
                description="Minimal casing provides low stopping power against >10 MeV protons."
            ))
            
        return contributions
