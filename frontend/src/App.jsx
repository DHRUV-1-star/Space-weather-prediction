import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import InputPanel from './components/InputPanel.jsx'
import OrbitVisualizer from './components/OrbitVisualizer.jsx'
import InsightsPanel from './components/InsightsPanel.jsx'
import { assessRisk } from './lib/api.js'
import { PRESETS, STORM_LEVELS } from './config/presets.js'

export default function App() {
  const defaultPreset = PRESETS[0]
  const [presetId, setPresetId] = useState(defaultPreset.id)
  const [config, setConfig] = useState({
    name: defaultPreset.name,
    orbit_type: defaultPreset.orbit_type,
    altitude_km: defaultPreset.altitude_km,
    mass_kg: defaultPreset.mass_kg,
    area_m2: defaultPreset.area_m2,
    inclination_deg: defaultPreset.inclination_deg,
  })
  const [kp, setKp] = useState(3.2)
  const [f107, setF107] = useState(140)
  const [stormIndex, setStormIndex] = useState(0)
  const [requestNonce, setRequestNonce] = useState(0)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(false)

  const protonFlux = useMemo(() => STORM_LEVELS[stormIndex]?.flux ?? 1, [stormIndex])
  const protonIntensity = useMemo(() => (stormIndex / (STORM_LEVELS.length - 1)) * 100, [stormIndex])

  const handleConfig = useCallback((next) => setConfig(next), [])
  const handlePreset = useCallback((id) => setPresetId(id), [])
  const handleRun = useCallback(() => setRequestNonce((n) => n + 1), [])

  // Debounced, reactive assessment whenever the mission inputs change.
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(async () => {
      const payload = {
        satellite_name: config.name || 'Custom Object',
        orbit_type: config.orbit_type,
        altitude_km: Number(config.altitude_km),
        mass_kg: Number(config.mass_kg),
        area_m2: Number(config.area_m2),
        kp_index: kp,
        solar_flux_f107: f107,
        proton_flux: protonFlux,
      }
      const result = await assessRisk(payload)
      setAssessment(result)
      setLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [config, kp, f107, protonFlux, requestNonce])

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [assessment])

  const source = assessment?._source

  return (
    <div className="min-h-screen">
      <Header kp={kp} backendOnline={source === 'backend'} isEstimating={source === 'estimate'} />
      <main className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 px-5 py-5 xl:grid-cols-[350px_minmax(0,1fr)]">
        {/* Left: input controls */}
        <aside className="h-fit xl:sticky xl:top-20">
          <InputPanel
            config={config}
            onConfig={handleConfig}
            onPreset={handlePreset}
            preset={presetId}
            kp={kp}
            setKp={setKp}
            f107={f107}
            setF107={setF107}
            stormIndex={stormIndex}
            setStormIndex={setStormIndex}
            onRun={handleRun}
            running={loading}
          />
        </aside>

        {/* Right: visualizer + insights */}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <OrbitVisualizer
            name={config.name}
            orbitType={config.orbit_type}
            altitudeKm={config.altitude_km}
            inclinationDeg={config.inclination_deg}
            kp={kp}
            f107={f107}
            protonIntensity={assessment?.radiation_prediction?.combined_anomaly_risk_pct ?? protonIntensity}
          />
          <InsightsPanel
            assessment={assessment}
            kp={kp}
            f107={f107}
            protonIntensity={protonIntensity}
          />
        </section>
      </main>
    </div>
  )
}
