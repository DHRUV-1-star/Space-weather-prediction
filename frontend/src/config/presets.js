// Satellite library for the input panel, plus the proton-storm NOAA S-scale
// to >10 MeV proton flux mapping used by the backend API.

export const PRESETS = [
  {
    id: 'starlink',
    name: 'Starlink',
    orbit_type: 'LEO',
    altitude_km: 550,
    mass_kg: 260,
    area_m2: 6,
    inclination_deg: 53,
  },
  {
    id: 'cartosat',
    name: 'Cartosat-2',
    orbit_type: 'LEO',
    altitude_km: 630,
    mass_kg: 710,
    area_m2: 8,
    inclination_deg: 97.9,
  },
  {
    id: 'navic',
    name: 'NavIC (IRNSS)',
    orbit_type: 'MEO',
    altitude_km: 23200,
    mass_kg: 1500,
    area_m2: 45,
    inclination_deg: 55,
  },
  {
    id: 'gsat',
    name: 'GSAT (GEO)',
    orbit_type: 'GEO',
    altitude_km: 35786,
    mass_kg: 2500,
    area_m2: 55,
    inclination_deg: 0.5,
  },
]

// NOAA Solar Radiation Storm Scale (S0..S5) -> >10 MeV proton flux
// [p/cm2/sr/s].
export const STORM_LEVELS = [
  { tier: 'S0', label: 'Background', flux: 1 },
  { tier: 'S1', label: 'Minor', flux: 10 },
  { tier: 'S2', label: 'Moderate', flux: 100 },
  { tier: 'S3', label: 'Strong', flux: 1000 },
  { tier: 'S4', label: 'Severe', flux: 10000 },
  { tier: 'S5', label: 'Extreme', flux: 100000 },
]

export const DEFAULT_PRESET_ID = 'starlink'
