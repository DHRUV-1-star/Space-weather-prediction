import React, { useState } from 'react'
import { Activity, Play, Satellite } from 'lucide-react'
import { PRESETS, STORM_LEVELS } from '../config/presets.js'

const RE_KM = 6378.137
const MU = 398600.4418

// Minimal 2-line TLE parse: extract inclination and altitude approximation.
function parseTle(tleText) {
  const lines = tleText.split(/\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return null
  const line2 = lines[1]
  try {
    const get = (a, b) => parseFloat(line2.substring(a, b).trim())
    const incl = get(7, 16) // inclination deg
    const meanMotion = get(51, 63) // rev/day
    if (!incl || !meanMotion) return null
    const nRadPerS = (meanMotion * 2 * Math.PI) / 86400
    const aKm = Math.cbrt(MU / (nRadPerS * nRadPerS))
    return { inclination_deg: incl, altitude_km: Math.round(aKm - RE_KM) }
  } catch {
    return null
  }
}

function Slider({ label, value, min, max, step, onChange, display, accent = '#22d3ee' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between">
        <label className="field-label">{label}</label>
        <span className="text-[13px] font-mono font-bold" style={{ color: accent }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-400"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #1c2a44 ${pct}%, #1c2a44 100%)`,
          height: '6px',
          borderRadius: '9999px',
          appearance: 'none',
        }}
      />
      <div className="flex justify-between text-[9px] text-mission-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export default function InputPanel({ config, onConfig, onPreset, preset, kp, setKp, f107, setF107, stormIndex, setStormIndex, onRun, running }) {
  const [tleText, setTleText] = useState('')
  const [tleError, setTleError] = useState('')
  const isCustom = preset === 'custom'

  const handleTle = () => {
    const parsed = parseTle(tleText)
    if (!parsed) {
      setTleError('Could not parse TLE. Paste both lines.')
      return
    }
    setTleError('')
    onPreset('custom')
    onConfig({ ...config, altitude_km: parsed.altitude_km, inclination_deg: parsed.inclination_deg, name: 'TLE OBJECT' })
  }

  const storm = STORM_LEVELS[stormIndex]

  return (
    <div className="flex h-full flex-col gap-4">
      {/* SATELLITE PRESETS */}
      <div>
        <div className="panel-title"><Satellite className="h-3.5 w-3.5" /> Satellite Presets</div>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => { onPreset(p.id); onConfig({ ...p, name: p.name }) }}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                preset === p.id
                  ? 'border-mission-cyan bg-mission-cyan/10 text-mission-cyan shadow-glow'
                  : 'border-mission-line bg-black/20 text-mission-text hover:border-mission-cyan/40'
              }`}
            >
              <div className="text-[13px] font-semibold">{p.name}</div>
              <div className="text-[10px] text-mission-muted">{p.orbit_type} · {p.altitude_km.toLocaleString()} km</div>
            </button>
          ))}
          <button
            onClick={() => { onPreset('custom'); onConfig({ ...config, name: 'CUSTOM' }) }}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              isCustom ? 'border-mission-cyan bg-mission-cyan/10 text-mission-cyan' : 'border-mission-line bg-mission-panel2 text-mission-text'
            }`}
          >
            <div className="text-[13px] font-semibold">Custom / TLE</div>
            <div className="text-[10px] text-mission-muted">Manual read or TLE</div>
          </button>
        </div>
      </div>

      {/* Custom orbital elements / TLE */}
      {isCustom && (
        <div className="rounded-lg border border-mission-line bg-black/20 p-3">
          <div className="field-label">2-Line Element Set</div>
          <textarea
            value={tleText}
            onChange={(e) => setTleText(e.target.value)}
            rows={3}
            placeholder={'Line 1: 1 25544U ...\nLine 2: 2 25544  51.6416  ...'}
            className="number-input font-mono text-[10px]"
          />
          <div className="mt-2 flex gap-2">
            <button onClick={handleTle} className="rounded-md border border-mission-line px-3 py-1 text-[11px] hover:border-mission-cyan">
              Parse TLE
            </button>
            <span className="text-[10px] text-mission-red">{tleError}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div><label className="field-label">Orbit</label>
              <select value={config.orbit_type} onChange={(e) => onConfig({ ...config, orbit_type: e.target.value })} className="number-input">
                <option>LEO</option><option>MEO</option><option>GEO</option>
              </select>
            </div>
            <div><label className="field-label">Altitude km</label>
              <input type="number" value={config.altitude_km} onChange={(e) => onConfig({ ...config, altitude_km: +e.target.value })} className="number-input" />
            </div>
            <div><label className="field-label">Mass kg</label>
              <input type="number" value={config.mass_kg} onChange={(e) => onConfig({ ...config, mass_kg: +e.target.value })} className="number-input" />
            </div>
            <div><label className="field-label">Area m²</label>
              <input type="number" value={config.area_m2} onChange={(e) => onConfig({ ...config, area_m2: +e.target.value })} className="number-input" />
            </div>
          </div>
        </div>
      )}

      {/* Space weather controls */}
      <div>
        <div className="panel-title"><Activity className="h-3.5 w-3.5" /> Space Weather Drivers</div>
        <div className="rounded-lg border border-mission-line bg-black/20 p-3">
          <Slider label="Kp Index (Geomagnetic)" value={kp} min={0} max={9} onChange={setKp} display={kp.toFixed(1)} accent={kp < 5 ? '#34d399' : kp < 7 ? '#fbbf24' : '#f87171'} />
          <Slider label="Solar Flux F10.7" value={f107} min={70} max={300} onChange={setF107} display={`${Math.round(f107)} sfu`} accent="#22d3ee" />
          <div className="mb-1 flex items-center justify-between">
            <label className="field-label">Solar Proton Storm</label>
            <span className="text-[13px] font-mono font-bold text-mission-amber">{storm.tier} · {storm.label}</span>
          </div>
          <div className="grid grid-cols-6 gap-1 mb-4">
            {STORM_LEVELS.map((s, idx) => (
              <button
                key={s.tier}
                onClick={() => setStormIndex(idx)}
                className={`rounded py-1.5 text-[10px] font-bold transition ${
                  stormIndex === idx ? 'bg-mission-amber/20 text-mission-amber border border-mission-amber' : 'border border-mission-line text-mission-muted hover:bg-mission-line/40'
                }`}
              >
                {s.tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RUN */}
      <button
        onClick={onRun}
        disabled={running}
        className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-mission-cyan to-cyan-500 px-4 py-3 font-bold text-black shadow-glow transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {running ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" /> : <Play className="h-4 w-4" />}
        {running ? 'ASSESSING…' : 'RUN RISK ASSESSMENT'}
      </button>
    </div>
  )
}
