"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { RiskTimelinePoint } from "@/types/risk";

interface RiskTimelineProps {
  timeline: RiskTimelinePoint[];
  peakHour?: number;
}

export function RiskTimeline({ timeline, peakHour = 12 }: RiskTimelineProps) {
  const [activeMetric, setActiveMetric] = useState<"overall_risk" | "drag_risk" | "radiation_risk" | "charging_risk">("overall_risk");

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs font-mono text-slate-400">
        No forward projection data available.
      </div>
    );
  }

  const metricColors = {
    overall_risk: "#0ea5e9",
    drag_risk: "#f97316",
    radiation_risk: "#a855f7",
    charging_risk: "#eab308"
  };

  const metricLabels = {
    overall_risk: "Overall Mission Risk",
    drag_risk: "Atmospheric Drag",
    radiation_risk: "Ionizing Radiation",
    charging_risk: "Spacecraft Charging"
  };

  return (
    <div className="space-y-3">
      {/* Metric Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(["overall_risk", "drag_risk", "radiation_risk", "charging_risk"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                activeMetric === key
                  ? "bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {metricLabels[key]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Peak Threat Horizon: T+{peakHour}h</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors[activeMetric]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={metricColors[activeMetric]} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time_label"
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#030712",
                borderColor: "#0ea5e9",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "12px"
              }}
              formatter={(val: any) => [`${val} / 100`, metricLabels[activeMetric]]}
            />

            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "CRITICAL (80)", fill: "#ef4444", fontSize: 10 }} />
            <ReferenceLine y={60} stroke="#f97316" strokeDasharray="3 3" label={{ value: "HIGH (60)", fill: "#f97316", fontSize: 10 }} />
            <ReferenceLine x={`T+${peakHour}h`} stroke="#eab308" strokeDasharray="4 4" />

            <Area
              type="monotone"
              dataKey={activeMetric}
              stroke={metricColors[activeMetric]}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#metricGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
