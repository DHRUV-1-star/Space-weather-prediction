// Lightweight client-side mirror of the backend drag + radiation physics.
// Used as an offline fallback when the FastAPI service is unreachable, so the
// dashboard stays interactive. The returned shape mirrors /api/assess-risk.

const EARTH_RADIUS_KM = 6378.137
const MU_SI = 3.986004418e14
const CD = 2.2

// Empirical thermosphere layer model: [base_alt_km, rho_kg_m3, scale_h_km]
const LAYERS = [
  [100, 5e-7, 13],
  [200, 2.7e-10, 30],
  [300, 1.2e-11, 48],
  [400, 2.2e-12, 62],
  [500, 4.5e-13, 77],
  [600, 1.3e-13, 92],
  [700, 4.8e-14, 108],
  [800, 2e-14, 124],
  [900, 1e-14, 140],
  [1000, 5.5e-15, 160],
]

const KP_AP = [0, 3, 7, 15, 27, 48, 80, 140, 240, 400]
const REGIME_SENS = { LEO: 1.0, MEO: 1.3, GEO: 1.8 }

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x))
}

function kpToAp(kp) {
  const k = Math.max(0, Math.min(9, Number(kp) || 0))
  const lo = Math.floor(k)
  const hi = Math.min(9, lo + 1)
  const f = k - lo
  return KP_AP[lo] + f * (KP_AP[hi] - KP_AP[lo])
}

function layerRho(alt) {
  if (alt <= LAYERS[0][0]) return LAYERS[0][1]
  for (let i = 0; i < LAYERS.length - 1; i++) {
    const [h0, r0] = LAYERS[i]
    const [h1, r1] = LAYERS[i + 1]
    if (alt <= h1) {
      const t = (alt - h0) / Math.max(h1 - h0, 1e-9)
      return Math.exp(Math.log(r0) * (1 - t) + Math.log(r1) * t)
    }
  }
  return 1e-20
}

function solarInflation(f107) {
  return 1 + (1.35 * (f107 - 70)) / 160
}

function stormInflation(ap) {
  return 1 + (0.22 * ap) / 27
}

// da/dt = rho * (Cd*A/m) * sqrt(mu*a)  [km/day]
export function dailyDecayKmDay(altitudeKm, f107, kp, massKg, areaM2) {
  const ap = kpToAp(kp)
  const beta = (CD * areaM2) / massKg
  const rho = layerRho(altitudeKm) * solarInflation(f107) * stormInflation(ap)
  const a = (EARTH_RADIUS_KM + altitudeKm) * 1000
  return Math.max(0, (rho * beta * Math.sqrt(MU_SI * a) * 86400) / 1000)
}

// >2 MeV electron flux approximation from the request fields.
export function synthesizeElectronFlux(kp, f107, protonFlux, orbitType) {
  const storm = Math.max(0, (kp - 3) / 4)
  const f107eff = Math.max(0, f107 - 70)
  const regimeFactor = { LEO: 1.0, MEO: 1.5, GEO: 2.0 }[orbitType] || 1
  const seam = 1 + 0.08 * Math.log10(protonFlux + 1)
  const value = (350 + 900 * storm + 12 * f107eff) * (1 + 0.5 * storm) * regimeFactor * seam
  return Math.min(1e6, Math.max(1, value))
}

// SEU + surface-charging probabilities, returned as percentages.
export function synthesizeRadiation(protonFlux, electronFlux, kp, orbitType) {
  const sens = REGIME_SENS[orbitType] || 1
  const pLog = Math.log10(Math.max(protonFlux, 1e-4))
  const eLog = Math.log10(Math.max(electronFlux, 1e1))
  const seu = 100 * sigmoid(0.5 * (sens - 1) + 1.4 * (pLog - 1) + 0.45 * (kp - 3))
  const chg =
    100 * sigmoid(0.6 * (sens - 1) + 1.1 * (eLog - 4) + 0.5 * (kp - 3) - (sens < 1 ? 1 : 0))
  return { seu, chg }
}

function fmt(v, digits = 3) {
  return Math.round(v * 10 ** digits) / 10 ** digits
}

function riskLevel(score) {
  if (score < 0.25) return 'Low'
  if (score < 0.5) return 'Medium'
  if (score < 0.75) return 'High'
  return 'Critical'
}

function recommend(orbit, altitudeKm, dailyDecay, seuPct, chgPct) {
  const acts = []
  if (orbit === 'LEO' && dailyDecay >= 0.02 && altitudeKm <= 700) {
    const dv = dailyDecay < 0.08 ? 8 : 15
    acts.push(`Fire thrusters +${dv} m/s to restore altitude and offset ${fmt(dailyDecay)} km/day drag loss`)
  } else if (dailyDecay >= 0.4) {
    acts.push('Critical drag: schedule immediate orbit-raising burn')
  }
  if (chgPct >= 50) {
    acts.push('Enter Safe Mode - power down sensitive payloads during charging')
  } else if (chgPct >= 25) {
    acts.push('Enable active charge mitigation; reorient booms away from plasma')
  }
  if (seuPct >= 50) {
    acts.push('Schedule payload electronics scrub and raise EDAC margin')
  } else if (seuPct >= 25) {
    acts.push('Monitor telemetry for soft errors; keep redundancy systems armed')
  }
  if (acts.length === 0) acts.push('Nominal operations - continue standard monitoring cadence')
  return acts
}

// Full offline assessment mirroring POST /api/assess-risk.
export function assessRiskOffline(payload) {
  const orbit = String(payload.orbit_type || 'LEO').toUpperCase()
  const kp = Number(payload.kp_index) || 0
  const f107 = Number(payload.solar_flux_f107) || 120
  const alt = Number(payload.altitude_km) || 550
  const mass = Number(payload.mass_kg) || 300
  const area = Number(payload.area_m2) || 8
  const proton = Number(payload.proton_flux) || 1

  const electron = synthesizeElectronFlux(kp, f107, proton, orbit)
  const decay = dailyDecayKmDay(alt, f107, kp, mass, area)
  const rad = synthesizeRadiation(proton, electron, kp, orbit)
  const ap = kpToAp(kp)

  const dragScore = orbit === 'LEO' ? Math.min(decay / 0.3, 1) : Math.min(decay / 1, 1)
  const radScore = Math.max(rad.seu, rad.chg) / 100
  const overall = orbit === 'LEO' ? 0.7 * dragScore + 0.3 * radScore : 0.15 * dragScore + 0.85 * radScore
  const combined = Math.max(rad.seu, rad.chg)

  return {
    satellite_name: payload.satellite_name || 'Unknown',
    orbit_type: orbit,
    assessed_telemetry: {
      ap: fmt(ap, 0),
      electron_flux_2mev: fmt(electron, 1),
    },
    drag_prediction: {
      daily_decay_km: fmt(decay),
      seven_day_decay_km: fmt(decay * 7),
    },
    radiation_prediction: {
      seu_risk_pct: fmt(rad.seu, 1),
      charging_risk_pct: fmt(rad.chg, 1),
      combined_anomaly_risk_pct: fmt(combined, 1),
    },
    lifetime_degradation_risk: riskLevel(overall),
    recommended_actions: recommend(orbit, alt, decay, rad.seu, rad.chg),
  }
}
