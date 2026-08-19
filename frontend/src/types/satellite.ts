export type OrbitType = "LEO" | "MEO" | "GEO" | "HEO";
export type MissionType = 
  | "Earth Observation"
  | "Communication"
  | "Navigation"
  | "Scientific"
  | "Weather"
  | "Defense/Surveillance"
  | "Other";

export type RadiationHardening = 
  | "Commercial (COTS)"
  | "Industrial"
  | "Rad-Tolerant"
  | "Rad-Hard (Mil/Space)";

export type DielectricCoating = 
  | "Low"
  | "Standard"
  | "Conductive ITO"
  | "Advanced Conductive";

export interface SatelliteProfile {
  id: string;
  name: string;
  mission_type: MissionType;
  orbit_type: OrbitType;
  altitude_km: number;
  apogee_km?: number;
  inclination_deg: number;
  eccentricity: number;
  orbital_period_minutes: number;
  mass_kg: number;
  cross_sectional_area_m2: number;
  drag_coefficient_cd: number;
  ballistic_coefficient: number;
  shielding_thickness_mm_al: number;
  radiation_hardening_level: RadiationHardening;
  solar_panel_sensitivity: number;
  communication_dependency: number;
  navigation_dependency: number;
  dielectric_coating_quality: DielectricCoating;
  notes?: string;
  is_preset?: boolean;
}
