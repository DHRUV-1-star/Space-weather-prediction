import React, { useEffect, useState } from 'react'
import { Radio, Satellite, ShieldCheck, Wifi } from 'lucide-react'

// NOAA G-scale (geomagnetic storm) mapping from Kp.
function gScale(kp) {
  if (kp < 5) return { g: 'G0', label: 'No storm', color: '#34d399' }
  if (kp < 6) return { g: 'G1', label: 'Minor', color: '#5eead4' }
  if (kp < 7) return { g: 'G2', label: 'Moderate', color: '#fbbf24' }
  if (kp < 8) return { g: 'G3', label: 'Strong', color: '#fb923c' }
  if (kp < 9) return { g: 'G4', label: 'Severe', color: '#f87171' }
  return { g: 'G5', label: 'Extreme', color: '#ef4444' }
}

export default function Header({ kp, backendOnline, isEstimating }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const storm = gScale(kp)
  const nominal = kp < 5
  const clock = now.toUTCString()

  return (
    <header className="sticky top-0 z-20 border-b border-mission-line bg-mission-bg/85 backdrop-blur-md">
      {/* Scanline accent */}
      <div className="h-0.5 w-full overflow-hidden bg-transparent">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-mission-cyan to-transparent animate-pulseSoft" />
      </div>
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-mission-cyan/60 bg-mission-cyan/10 text-mission-cyan shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-[0.15em] text-white">ORBITAL SHIELD</h1>
            <p className="text-[10px] tracking-[0.28em] text-mission-muted">SPACE WEATHER RISK ENGINE · ISRO HACKATHON</p>
          </div>
        </div>

        {/* Live status banner */}
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
            nominal ? 'border-mission-green/50 bg-mission-green/10' : 'border-mission-red/60 bg-mission-red/10'
          }`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${nominal ? 'bg-mission-green' : 'bg-mission-red'} animate-pulseSoft`} />
          <span className={`text-sm font-bold ${nominal ? 'text-mission-green' : 'text-mission-red'}`}>
            {nominal ? 'ALL SYSTEMS NOMINAL' : `${storm.g} GEOMAGNETIC STORM WATCH`}
          </span>
        </div>

        {/* Aditya-L1 / SW alert */}
        <div className="flex items-center gap-2 rounded-lg border border-mission-line bg-mission-panel px-4 py-2">
          <Radio className="h-4 w-4 text-mission-cyan" />
          <div className="leading-tight">
            <div className="text-[11px] text-mission-muted">ISRO Aditya-L1 L1 Halo Orbit</div>
            <div className="text-[13px] font-semibold text-mission-text">
              Solar Wind Monitor <span className="text-mission-green">● ACTIVE</span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: `${storm.color}55`, background: `${storm.color}14` }}
        >
          <Satellite className="h-4 w-4" style={{ color: storm.color }} />
          <div className="leading-tight">
            <div className="text-[11px] text-mission-muted">SW ALERT · Kp {kp.toFixed(1)}</div>
            <div className="text-[13px] font-bold" style={{ color: storm.color }}>
              {storm.g} — {storm.label}
            </div>
          </div>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          {isEstimating ? (
            <span className="flex items-center gap-1.5 rounded-lg border border-mission-amber/50 bg-mission-amber/10 px-3 py-2 text-[12px] text-mission-amber">
              <span className="h-2 w-2 rounded-full bg-mission-amber animate-pulseSoft" /> ESTIMATE MODE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-mission-line px-2 py-1 text-[11px] text-mission-muted">
              <Wifi className="h-3.5 w-3.5 text-mission-green" /> API LINKED
            </span>
          )}
          <div className="text-right text-[12px] leading-tight text-mission-muted">
            <div className="text-mission-text">UTC</div>
            <div className="font-mono">{now.toTimeString().slice(0, 8)}Z</div>
          </div>
        </div>
      </div>
    </header>
  )
}
