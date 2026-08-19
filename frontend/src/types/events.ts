export interface HistoricalEventTimelineStep {
  time_offset: string;
  phase_title: string;
  description: string;
  kp: number;
  flux: number;
  satellite_impact_summary: string;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  date_str: string;
  category: string;
  max_kp: number;
  max_flare_class: string;
  dst_peak_nt: number;
  solar_wind_peak_kms: number;
  proton_flux_peak_pfu: number;
  summary: string;
  real_world_consequences: string[];
  timeline_steps: HistoricalEventTimelineStep[];
  model_prediction_accuracy_pct: number;
  prediction_vs_observed_notes: string;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  level: "INFO" | "WATCH" | "WARNING" | "CRITICAL";
  category: "GEOMAGNETIC" | "FLARE" | "RADIATION" | "DRAG" | "CHARGING" | "NOMINAL";
  title: string;
  message: string;
  affected_systems: string[];
  dismissed?: boolean;
}
