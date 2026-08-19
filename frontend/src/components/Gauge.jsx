// Arc gauge rendered in SVG. Shows a value 0..max with a colored arc sweep.
import React from 'react'

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, startDeg)
  const end = polar(cx, cy, r, endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`
}

const START_ANGLE = -120
const END_ANGLE = 120
const SWEEP = END_ANGLE - START_ANGLE

export default function Gauge({ label, value, max = 100, unit = '', color = '#22d3ee', digits = 1 }) {
  const clamped = Math.max(0, Math.min(max, Number(value) || 0))
  const frac = clamped / max
  const size = 150
  const stroke = 12
  const radius = (size - stroke) / 2 - 4
  const cx = size / 2
  const cy = size / 2

  const valueAngle = START_ANGLE + frac * SWEEP
  const track = arcPath(cx, cy, radius, START_ANGLE, END_ANGLE)
  const valuePath = arcPath(cx, cy, radius, START_ANGLE, valueAngle)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label={label}>
        <path d={track} fill="none" stroke="#1c2a44" strokeWidth={stroke} strokeLinecap="round" />
        <path
          d={valuePath}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#e6eefb" fontSize="24" fontFamily="ui-monospace,monospace">
          {clamped.toFixed(clamped < 10 ? 2 : 1)}
        </text>
        {unit && (
          <text x={cx} y={cy + 16} textAnchor="middle" fill="#6b7fa3" fontSize="10" fontFamily="ui-monospace,monospace">
            {unit}
          </text>
        )}
        <text x={cx} y={size - 6} textAnchor="middle" fill="#6b7fa3" fontSize="9" fontFamily="ui-monospace,monospace">
          {label}
        </text>
      </svg>
    </div>
  )
}
