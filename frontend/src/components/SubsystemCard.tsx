"use client";

import React from "react";
import { SubsystemRisk } from "@/types/risk";
import { ThreatBadge } from "./ThreatBadge";
import { getRiskColor } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, ShieldAlert } from "lucide-react";

interface SubsystemCardProps {
  name: string;
  icon: React.ReactNode;
  risk: SubsystemRisk;
}

export function SubsystemCard({ name, icon, risk }: SubsystemCardProps) {
  const colors = getRiskColor(risk.level);

  const getTrendIcon = (trend: string) => {
    if (trend === "rising") return <TrendingUp className="w-3.5 h-3.5 text-red-400" />;
    if (trend === "improving") return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 shadow-lg">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 text-cyan-400">
              {icon}
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                {name}
              </h4>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                {getTrendIcon(risk.trend)}
                <span className="capitalize">{risk.trend} Trend</span>
              </div>
            </div>
          </div>
          <ThreatBadge level={risk.level} size="sm" />
        </div>

        {/* Score & Progress */}
        <div className="my-2">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-mono font-black tracking-tight" style={{ color: colors.hex }}>
              {Math.round(risk.score)}
            </span>
            <span className="text-[10px] font-mono text-slate-400">Score / 100</span>
          </div>

          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(5, risk.score)}%`,
                backgroundColor: colors.hex
              }}
            />
          </div>
        </div>

        {/* Primary Threat Summary */}
        <div className="my-2.5 p-2 rounded bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Primary Threat:</div>
          <div className="text-xs font-mono text-cyan-300 font-medium line-clamp-2">
            {risk.primary_threat}
          </div>
        </div>

        {/* Key Physics Metrics */}
        {risk.key_metrics && Object.keys(risk.key_metrics).length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 my-2">
            {Object.entries(risk.key_metrics).map(([k, v]) => (
              <div key={k} className="p-1.5 rounded bg-slate-900/40 border border-slate-800/40 text-[11px] font-mono">
                <span className="text-slate-400 block text-[9px] uppercase">{k}</span>
                <span className="text-slate-200 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Physics Explanation */}
      {risk.physical_explanation && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono leading-relaxed">
          {risk.physical_explanation}
        </div>
      )}
    </div>
  );
}
