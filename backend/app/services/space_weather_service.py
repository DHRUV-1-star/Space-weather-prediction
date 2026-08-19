from datetime import datetime, timezone
from typing import Dict, List, Optional
import httpx
import math
import random

from app.schemas.space_weather import (
    SpaceWeatherTelemetry, SpaceWeatherForecast,
    FlareForecast, GeomagneticForecast, RadiationForecast
)
from app.schemas.events import AlertItem
from app.ml.inference import SpaceWeatherMLEngine
from app.config import settings

# Predefined Space Weather Scenarios for Hackathon Demonstrations
SCENARIOS: Dict[str, SpaceWeatherTelemetry] = {
    "normal": SpaceWeatherTelemetry(
        timestamp=datetime.now(timezone.utc),
        solar_flux_xray=2.5e-7,
        flare_class="B2.5",
        kp_index=1.7,
        geomagnetic_scale="G0 (Quiet)",
        dst_index_nt=-6.0,
        solar_wind_speed_kms=385.0,
        solar_wind_density_cm3=4.2,
        imf_bz_gsm_nt=1.8,
        imf_bt_nt=4.5,
        proton_flux_10mev=0.18,
        proton_flux_100mev=0.01,
        radiation_scale="S0 (Quiet)",
        radio_blackout_scale="R0 (Normal)",
        electron_flux_2mev=180.0,
        f10_7_cm_flux=135.0,
        is_live_data=False,
        scenario_name="Normal Space Weather (Nominal Conditions)"
    ),
    "g2_storm": SpaceWeatherTelemetry(
        timestamp=datetime.now(timezone.utc),
        solar_flux_xray=8.5e-6,
        flare_class="C8.5",
        kp_index=6.0,
        geomagnetic_scale="G2 (Moderate Storm)",
        dst_index_nt=-75.0,
        solar_wind_speed_kms=580.0,
        solar_wind_density_cm3=12.5,
        imf_bz_gsm_nt=-8.2,
        imf_bt_nt=14.0,
        proton_flux_10mev=4.8,
        proton_flux_100mev=0.15,
        radiation_scale="S1 (Minor)",
        radio_blackout_scale="R1 (Minor)",
        electron_flux_2mev=2400.0,
        f10_7_cm_flux=178.0,
        is_live_data=False,
        scenario_name="G2 Moderate Geomagnetic Storm (Coronal Hole High-Speed Stream)"
    ),
    "severe_radiation": SpaceWeatherTelemetry(
        timestamp=datetime.now(timezone.utc),
        solar_flux_xray=3.2e-4,
        flare_class="X3.2",
        kp_index=6.7,
        geomagnetic_scale="G3 (Strong Storm)",
        dst_index_nt=-115.0,
        solar_wind_speed_kms=670.0,
        solar_wind_density_cm3=18.0,
        imf_bz_gsm_nt=-11.4,
        imf_bt_nt=19.5,
        proton_flux_10mev=3400.0,
        proton_flux_100mev=65.0,
        radiation_scale="S3 (Strong Radiation Storm)",
        radio_blackout_scale="R3 (Strong Blackout)",
        electron_flux_2mev=8900.0,
        f10_7_cm_flux=240.0,
        is_live_data=False,
        scenario_name="Severe Radiation Storm (X-Class Flare & Proton Event S3)"
    ),
    "extreme_drag": SpaceWeatherTelemetry(
        timestamp=datetime.now(timezone.utc),
        solar_flux_xray=1.8e-4,
        flare_class="X1.8",
        kp_index=8.7,
        geomagnetic_scale="G4/G5 (Severe/Extreme Storm)",
        dst_index_nt=-285.0,
        solar_wind_speed_kms=840.0,
        solar_wind_density_cm3=32.0,
        imf_bz_gsm_nt=-22.5,
        imf_bt_nt=35.0,
        proton_flux_10mev=850.0,
        proton_flux_100mev=18.0,
        radiation_scale="S2 (Moderate)",
        radio_blackout_scale="R3 (Strong)",
        electron_flux_2mev=12500.0,
        f10_7_cm_flux=265.0,
        is_live_data=False,
        scenario_name="Extreme LEO Drag Event (Coronal Mass Ejection Impact G4+)"
    )
}

class SpaceWeatherService:
    def __init__(self):
        self.active_scenario_key: str = "extreme_drag" # Default to high-impact scenario for demo flow
        self.cached_live_telemetry: Optional[SpaceWeatherTelemetry] = None
        self.last_fetch_time: Optional[datetime] = None

    def get_current_telemetry(self, scenario_override: Optional[str] = None) -> SpaceWeatherTelemetry:
        key = scenario_override or self.active_scenario_key
        if key in SCENARIOS:
            telemetry = SCENARIOS[key].model_copy()
            telemetry.timestamp = datetime.now(timezone.utc)
            return telemetry
        return SCENARIOS["g2_storm"]

    def set_active_scenario(self, scenario_key: str) -> SpaceWeatherTelemetry:
        if scenario_key in SCENARIOS:
            self.active_scenario_key = scenario_key
        return self.get_current_telemetry()

    async def fetch_live_noaa_telemetry(self) -> SpaceWeatherTelemetry:
        """
        Attempts to fetch live telemetry from NOAA SWPC.
        Falls back to current active scenario if network request fails or times out.
        """
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                # 1. Fetch 1-min Kp
                kp_resp = await client.get(f"{settings.NOAA_BASE_URL}/json/planetary_k_index_1m.json")
                kp_val = 3.0
                if kp_resp.status_code == 200:
                    kp_data = kp_resp.json()
                    if kp_data and len(kp_data) > 0:
                        kp_val = float(kp_data[-1].get("kp_index", kp_data[-1].get("kp", 3.0)))
                        
                # 2. Fetch RTSW Wind
                wind_resp = await client.get(f"{settings.NOAA_BASE_URL}/json/rtsw/rtsw_wind_1m.json")
                sw_speed = 430.0
                sw_density = 5.0
                bz = -2.0
                if wind_resp.status_code == 200:
                    wind_data = wind_resp.json()
                    if wind_data and len(wind_data) > 0:
                        last_w = wind_data[-1]
                        sw_speed = float(last_w.get("speed", 430.0) or 430.0)
                        sw_density = float(last_w.get("density", 5.0) or 5.0)
                        bz = float(last_w.get("bz", -2.0) or -2.0)
                        
                # 3. Fetch GOES X-ray
                xray_resp = await client.get(f"{settings.NOAA_BASE_URL}/json/goes/primary/xrays-1-day.json")
                flux = 2.0e-6
                if xray_resp.status_code == 200:
                    xray_data = xray_resp.json()
                    if xray_data and len(xray_data) > 0:
                        e08 = [d for d in xray_data if d.get("energy") == "0.1-0.8nm"]
                        if e08:
                            flux = float(e08[-1].get("observed_flux", 2.0e-6) or 2.0e-6)
                            
                # Determine flare class
                if flux >= 1e-4:
                    flare_cls = f"X{(flux / 1e-4):.1f}"
                elif flux >= 1e-5:
                    flare_cls = f"M{(flux / 1e-5):.1f}"
                elif flux >= 1e-6:
                    flare_cls = f"C{(flux / 1e-6):.1f}"
                else:
                    flare_cls = f"B{(flux / 1e-7):.1f}"
                    
                live_telem = SpaceWeatherTelemetry(
                    timestamp=datetime.now(timezone.utc),
                    solar_flux_xray=flux,
                    flare_class=flare_cls,
                    kp_index=kp_val,
                    geomagnetic_scale="G0" if kp_val < 5 else f"G{int(kp_val - 4)}",
                    dst_index_nt=-15.0 - (kp_val * 8.0),
                    solar_wind_speed_kms=sw_speed,
                    solar_wind_density_cm3=sw_density,
                    imf_bz_gsm_nt=bz,
                    imf_bt_nt=math.sqrt(bz**2 + 16.0),
                    proton_flux_10mev=0.45,
                    proton_flux_100mev=0.02,
                    radiation_scale="S0",
                    radio_blackout_scale="R0",
                    electron_flux_2mev=320.0,
                    f10_7_cm_flux=155.0,
                    is_live_data=True,
                    scenario_name="Live NOAA SWPC Feed"
                )
                self.cached_live_telemetry = live_telem
                return live_telem
        except Exception as e:
            # Fallback to scenario if offline or NOAA API down
            print(f"[SpaceWeatherService] NOAA API live fetch fallback: {e}")
            return self.get_current_telemetry()

    def get_forecast(self, scenario_override: Optional[str] = None) -> SpaceWeatherForecast:
        telemetry = self.get_current_telemetry(scenario_override)
        
        flare_fc = SpaceWeatherMLEngine.predict_flare_probabilities(
            telemetry.solar_flux_xray, telemetry.kp_index
        )
        geomag_fc = SpaceWeatherMLEngine.predict_geomagnetic_storm(
            telemetry.solar_wind_speed_kms, telemetry.imf_bz_gsm_nt,
            telemetry.solar_wind_density_cm3, telemetry.kp_index
        )
        
        rad_fc = RadiationForecast(
            s1_plus_prob=min(95.0, round(telemetry.proton_flux_10mev * 1.5 + (telemetry.kp_index/9.0)*25.0, 1)),
            s3_plus_prob=min(85.0, round(max(0.0, (telemetry.proton_flux_10mev - 100.0) / 50.0), 1)),
            risk_level="HIGH" if telemetry.proton_flux_10mev > 10.0 else ("MODERATE" if telemetry.kp_index > 5 else "LOW"),
            confidence=82.0
        )
        
        # Build 48h timeline projections
        sw_timeline = []
        kp_timeline = []
        for h in range(0, 49, 4):
            wave = math.sin(h / 8.0)
            sw_timeline.append({
                "hour": h,
                "label": f"+{h}h",
                "speed": round(telemetry.solar_wind_speed_kms * (1.0 + wave * 0.15), 1),
                "bz": round(telemetry.imf_bz_gsm_nt + wave * 4.0, 1)
            })
            kp_timeline.append({
                "hour": h,
                "label": f"+{h}h",
                "kp": round(min(9.0, max(1.0, telemetry.kp_index * (1.0 + math.sin((h - 6) / 8.0) * 0.2))), 1)
            })
            
        return SpaceWeatherForecast(
            timestamp=datetime.now(timezone.utc),
            horizon_hours=48,
            overall_confidence=84.0,
            flare_forecast=flare_fc,
            geomagnetic_forecast=geomag_fc,
            radiation_forecast=rad_fc,
            solar_wind_speed_forecast_kms=sw_timeline,
            kp_forecast_timeline=kp_timeline,
            is_live_data=telemetry.is_live_data
        )

    def get_active_alerts(self) -> List[AlertItem]:
        telem = self.get_current_telemetry()
        alerts = []
        now = datetime.now(timezone.utc)
        
        if telem.kp_index >= 7.0:
            alerts.append(AlertItem(
                id="alt-geomag-crit",
                timestamp=now,
                level="CRITICAL",
                category="GEOMAGNETIC",
                title="Severe Geomagnetic Storm Warning (G4+)",
                message=f"Planetary K-index has reached {telem.kp_index:.1f}. Significant thermospheric heating and power grid GIC hazard in progress.",
                affected_systems=["LEO Satellites (Atmospheric Drag)", "High-Latitude Power Grids", "HF Radio"]
            ))
        elif telem.kp_index >= 5.0:
            alerts.append(AlertItem(
                id="alt-geomag-watch",
                timestamp=now,
                level="WARNING",
                category="GEOMAGNETIC",
                title="Geomagnetic Storm Watch (G1-G2)",
                message=f"Moderate solar wind shock detected (Speed: {telem.solar_wind_speed_kms:.0f} km/s, Bz: {telem.imf_bz_gsm_nt:.1f} nT).",
                affected_systems=["LEO Orbit Ephemeris", "GNSS Scintillation"]
            ))
            
        if telem.proton_flux_10mev >= 10.0:
            alerts.append(AlertItem(
                id="alt-rad-crit",
                timestamp=now,
                level="CRITICAL",
                category="RADIATION",
                title="Solar Particle Event (Proton Flux > 10 MeV)",
                message=f"Proton flux elevated to {telem.proton_flux_10mev:.0f} pfu (Scale {telem.radiation_scale}). SEU probability high.",
                affected_systems=["Polar Aviation", "COTS Satellite Avionics", "Solar Arrays"]
            ))
            
        if telem.solar_flux_xray >= 1e-4:
            alerts.append(AlertItem(
                id="alt-flare-x",
                timestamp=now,
                level="WARNING",
                category="FLARE",
                title=f"Major Solar Flare Detected ({telem.flare_class})",
                message="Extreme X-ray emission causing widespread sunlit hemisphere HF radio absorption.",
                affected_systems=["HF Communications", "D-Region Absorption"]
            ))
            
        if len(alerts) == 0:
            alerts.append(AlertItem(
                id="alt-nom",
                timestamp=now,
                level="INFO",
                category="NOMINAL",
                title="Space Environment Nominal",
                message="Background solar and geomagnetic activity levels are within standard operational baselines.",
                affected_systems=[]
            ))
            
        return alerts

space_weather_service = SpaceWeatherService()
