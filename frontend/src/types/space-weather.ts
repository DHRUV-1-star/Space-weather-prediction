export interface SpaceWeatherTelemetry {
  timestamp: string;
  solar_flux_xray: number;
  flare_class: string;
  kp_index: number;
  geomagnetic_scale: string;
  dst_index_nt: number;
  solar_wind_speed_kms: number;
  solar_wind_density_cm3: number;
  imf_bz_gsm_nt: number;
  imf_bt_nt: number;
  proton_flux_10mev: number;
  proton_flux_100mev: number;
  radiation_scale: string;
  radio_blackout_scale: string;
  electron_flux_2mev: number;
  f10_7_cm_flux: number;
  is_live_data: boolean;
  scenario_name?: string;
}

export interface FlareForecast {
  class_c_prob: number;
  class_m_prob: number;
  class_x_prob: number;
  confidence: number;
  primary_active_region: string;
}

export interface GeomagneticForecast {
  g1_prob: number;
  g2_prob: number;
  g3_prob: number;
  g4_prob: number;
  g5_prob: number;
  kp_peak_forecast: number;
  kp_peak_horizon_hours: number;
  confidence: number;
}

export interface RadiationForecast {
  s1_plus_prob: number;
  s3_plus_prob: number;
  risk_level: string;
  confidence: number;
}

export interface SpaceWeatherForecast {
  timestamp: string;
  horizon_hours: number;
  overall_confidence: number;
  flare_forecast: FlareForecast;
  geomagnetic_forecast: GeomagneticForecast;
  radiation_forecast: RadiationForecast;
  solar_wind_speed_forecast_kms: { hour: number; label: string; speed: number; bz: number }[];
  kp_forecast_timeline: { hour: number; label: string; kp: number }[];
  is_live_data: boolean;
}
