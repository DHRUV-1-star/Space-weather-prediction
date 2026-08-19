from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SpaceWeatherTelemetry(BaseModel):
    timestamp: datetime
    solar_flux_xray: float = Field(..., description="GOES X-ray flux (0.1-0.8nm) in W/m^2")
    flare_class: str = Field("B1.0", description="Current solar flare classification (e.g. C2.4, M1.8, X1.0)")
    kp_index: float = Field(..., ge=0, le=9, description="Planetary K-index (0 to 9)")
    geomagnetic_scale: str = Field("G0", description="NOAA Geomagnetic Storm Scale (G0 to G5)")
    dst_index_nt: float = Field(-12.0, description="Disturbance Storm Time index in nT")
    solar_wind_speed_kms: float = Field(420.0, description="Solar wind speed in km/s")
    solar_wind_density_cm3: float = Field(5.5, description="Solar wind proton density in N/cm^3")
    imf_bz_gsm_nt: float = Field(-2.5, description="Interplanetary Magnetic Field Bz in nT (GSM frame)")
    imf_bt_nt: float = Field(5.8, description="Interplanetary Magnetic Field total strength Bt in nT")
    proton_flux_10mev: float = Field(0.45, description="Proton flux >10 MeV in pfu (particles/cm^2-s-sr)")
    proton_flux_100mev: float = Field(0.02, description="Proton flux >100 MeV in pfu")
    radiation_scale: str = Field("S0", description="NOAA Solar Radiation Storm Scale (S0 to S5)")
    radio_blackout_scale: str = Field("R0", description="NOAA Radio Blackout Scale (R0 to R5)")
    electron_flux_2mev: float = Field(250.0, description="Relativistic electron flux >2 MeV in electrons/cm^2-s-sr")
    f10_7_cm_flux: float = Field(165.0, description="Solar Radio Flux at 10.7 cm in sfu")
    is_live_data: bool = Field(False, description="True if fetched live from NOAA/NASA, False if simulation/demo")
    scenario_name: Optional[str] = None

class FlareForecast(BaseModel):
    class_c_prob: float = Field(..., ge=0, le=100)
    class_m_prob: float = Field(..., ge=0, le=100)
    class_x_prob: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=100)
    primary_active_region: str = "AR-3842"

class GeomagneticForecast(BaseModel):
    g1_prob: float = Field(..., ge=0, le=100)
    g2_prob: float = Field(..., ge=0, le=100)
    g3_prob: float = Field(..., ge=0, le=100)
    g4_prob: float = Field(..., ge=0, le=100)
    g5_prob: float = Field(..., ge=0, le=100)
    kp_peak_forecast: float = Field(..., ge=0, le=9)
    kp_peak_horizon_hours: int = 18
    confidence: float = Field(..., ge=0, le=100)

class RadiationForecast(BaseModel):
    s1_plus_prob: float = Field(..., ge=0, le=100)
    s3_plus_prob: float = Field(..., ge=0, le=100)
    risk_level: str = "MODERATE"
    confidence: float = Field(..., ge=0, le=100)

class SpaceWeatherForecast(BaseModel):
    timestamp: datetime
    horizon_hours: int = 48
    overall_confidence: float = 84.0
    flare_forecast: FlareForecast
    geomagnetic_forecast: GeomagneticForecast
    radiation_forecast: RadiationForecast
    solar_wind_speed_forecast_kms: List[Dict[str, Any]] = []
    kp_forecast_timeline: List[Dict[str, Any]] = []
    is_live_data: bool = False
