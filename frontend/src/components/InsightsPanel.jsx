import React from 'react'
import { AlertTriangle, Gauge as GaugeIco, ListChecks, ShieldCheck, Wifi } from 'lucide-react'
import Gauge from './Gauge.jsx'

const LEVEL_COLORS = {
  Low: '#34d399',
  Medium: '#fbbf24',
  High: '#fb923c',
  Critical: '#f87171',
}

const LEVEL_ICONS = {
  Low: ShieldCheck,
  Medium: AlertTriangle,
  High: AlertTriangle,
  Critical: AlertTriangle,
}

function scintillationRisk(kp, protonIntensity, f107) {
  const solar = Math.max(0, (f107 - 120) / 180)
  const v = kp * 4.2 + protonIntensity * 0.22 + solar * 18
  return Math.round(Math.max(0, Math.min(100, v)))
}

export default function InsightsPanel({ assessment, kp, f107, protonIntensity }) {
  if (!assessment) {
    return (
      <div className="panel grid h-full place-items-center text-mission-muted">
        <div className="text-center">
          <GaugeIco className="mx-auto mb-2 h-8 w-8 animate-pulseSoft text-mission-cyan" />
          <p className="text-xs uppercase tracking-widest">Awaiting assessment</p>
          <p className="mt-1 text-[11px]">Adjust inputs and run the risk engine</p>
        </div>
      </div>
    )
  }

  const decay = assessment.drag_prediction?.seven_day_decay_km ?? 0
  const rad = assessment.radiation_prediction?.combined_anomaly_risk_pct ?? 0
  const scint = scintillationRisk(kp, protonIntensity, f107)
  const level = assessment.lifetime_degradation_risk || 'Low'
  const color = LEVEL_COLORS[level] || '#34d399'
  const actions = assessment.recommended_actions || []
  const estimated = assessment._source === 'estimate'

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Risk banner */}
      <div
        className="flex items-center justify-between rounded-lg border px-4 py-3"
        style={{ borderColor: `${color}55`, background: `${color}14` }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-mission-muted">Lifetime Degradation Risk</div>
          <div className="text-2xl font-black" style={{ color }}>{level}</div>
        </div>
        <div className="text-right text-[11px] leading-tight text-mission-muted">
          <div>MODEL: XGB · RF</div>
          <div className="flex items-center gap-1 justify-end">
            {estimated ? (
              <span className="text-mission-amber">ESTIMATE MODE</span>
            ) : (
              <span className="text-mission-green">LIVE API</span>
            )}
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="panel pb-6">
        <div className="panel-title"><GaugeIco className="h-3.5 w-3.5" /> Gauges</div>
        <div className="grid grid-cols-3 gap-2">
          <Gauge label="7-DAY DECAY" value={decay} max={15} unit="km" color={decay > 7 ? '#f87171' : decay > 3 ? '#fbbf24' : '#22d3ee'} digits={2} />
          <Gauge label="ANOMALY RISK" value={rad} max={100} unit="%" color={rad >= 60 ? '#f87171' : rad >= 30 ? '#fbbf24' : '#34d399'} digits={1} />
          <Gauge label="SCINTILLATION" value={scint} max={100} unit="%" color={scint >= 60 ? '#fb923c' : scint >= 30 ? '#fbbf24' : '#34d399'} digits={1} />
        </div>
      </div>

      {/* Measurements summary */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-mission-line bg-black/20 p-2">
          <div className="text-mission-muted">Daily decay</div>
          <div className="font-mono text-base text-mission-text">{assessment.drag_prediction?.daily_decay_km?.toFixed?.(6) ?? assessment.drag_prediction?.daily_decay_km ?? '—'} km/day</div>
        </div>
        <div className="rounded-lg border border-mission-line bg-black/20 p-2">
          <div className="text-mission-muted">SEU · Charging</div>
          <div className="font-mono text-base text-mission-text">
            {assessment.radiation_prediction?.seu_risk_pct?.toFixed?.(0)}% · {assessment.radiation_prediction?.charging_risk_pct?.toFixed?.(0)}%
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="panel mt-auto grow">
        <div className="panel-title"><ListChecks className="h-3.5 w-3.5" /> Automated Operational Guidance</div>
        <ul className="flex flex-col gap-2">
          {actions.map((act, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg border border-mission-line bg-mission-panel2/60 px-3 py-2 text-[12px] leading-snug text-mission-text"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
              <span>{act}</span>
            </li>
          ))}
          {scint >= 50 && (
            <li className="flex items-start gap-2 rounded-lg border border-mission-line bg-mission-panel2/60 px-3 py-2 text-[12px] text-mission-text">
              <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mission-cyan" />
              <span>High ionospheric scintillation: anticipate GNSS/NavIC ranging errors &amp; hold position fixes</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
