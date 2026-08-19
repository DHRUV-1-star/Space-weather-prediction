import { SatelliteProfile } from "./satellite";

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface FeatureContribution {
  name: string;
  contribution: number;
  category: "Environment" | "Orbital" | "Spacecraft Hardware";
  description: string;
}

export interface SubsystemRisk {
  score: number;
  level: RiskLevel;
  trend: "rising" | "stable" | "improving";
  confidence: number;
  primary_threat: string;
  key_metrics: Record<string, string>;
  factors: string[];
  physical_explanation: string;
}

export interface RiskTimelinePoint {
  time_offset_hours: number;
  time_label: string;
  overall_risk: number;
  drag_risk: number;
  radiation_risk: number;
  charging_risk: number;
  comms_risk: number;
  nav_risk: number;
}

export interface MissionRiskAssessment {
  satellite_id: string;
  satellite_name: string;
  orbit_type: string;
  altitude_km: number;
  timestamp: string;
  
  overall_risk: number;
  risk_level: RiskLevel;
  confidence: number;
  forecast_horizon_hours: number;
  peak_risk_time_hours: number;
  primary_threat: string;
  
  radiation_risk: SubsystemRisk;
  drag_risk: SubsystemRisk;
  communication_risk: SubsystemRisk;
  navigation_risk: SubsystemRisk;
  charging_risk: SubsystemRisk;
  
  feature_contributions: FeatureContribution[];
  
  baseline_drag_force_mn: number;
  storm_drag_force_mn: number;
  relative_drag_increase_pct: number;
  estimated_orbit_decay_rate_m_day: number;
  estimated_seu_rate_per_day: number;
  surface_potential_kv: number;
  
  recommendations: string[];
  timeline: RiskTimelinePoint[];
  inference_mode: string;
  notes: string;
}

export interface WhatIfSimulationRequest {
  satellite_id?: string;
  simulated_altitude_km: number;
  simulated_mass_kg: number;
  simulated_cross_sectional_area_m2: number;
  simulated_shielding_thickness_mm_al: number;
  simulated_radiation_hardening: string;
  simulated_comms_dependency: number;
  simulated_nav_dependency: number;
  override_kp_index?: number;
  override_solar_wind_speed?: number;
  override_proton_flux?: number;
}

export interface WhatIfSimulationResponse {
  baseline_assessment: MissionRiskAssessment;
  simulated_assessment: MissionRiskAssessment;
  delta_overall_risk: number;
  delta_drag_risk: number;
  delta_radiation_risk: number;
  delta_charging_risk: number;
  delta_comms_risk: number;
  delta_nav_risk: number;
  change_explanations: string[];
  mitigation_verdict: string;
}

export interface SatelliteComparisonResponse {
  space_weather: any;
  satellites_evaluated: {
    satellite: SatelliteProfile;
    assessment: MissionRiskAssessment;
  }[];
  why_risks_differ: string[];
}
