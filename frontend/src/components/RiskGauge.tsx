"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { RiskLevel } from "@/types/risk";

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  primaryThreat?: string;
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export function RiskGauge({ score, level, primaryThreat, title, subtitle, size = "md" }: RiskGaugeProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const angle = (normalizedScore / 100) * 180 - 90; // -90 to +90 deg

  const getColorClass = (lvl: RiskLevel) => {
    switch (lvl) {
      case "CRITICAL":
        return "text-red-500 stroke-red-500 shadow-red-500/50";
      case "HIGH":
        return "text-orange-500 stroke-orange-500 shadow-orange-500/50";
      case "MODERATE":
        return "text-amber-400 stroke-amber-400 shadow-amber-400/50";
      case "LOW":
      default:
        return "text-emerald-400 stroke-emerald-400 shadow-emerald-400/50";
    }
  };

  const getBgGlow = (lvl: RiskLevel) => {
    switch (lvl) {
      case "CRITICAL":
        return "from-red-950/40 to-slate-950 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.25)]";
      case "HIGH":
        return "from-orange-950/40 to-slate-950 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.2)]";
      case "MODERATE":
        return "from-amber-950/30 to-slate-950 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]";
      case "LOW":
      default:
        return "from-emerald-950/30 to-slate-950 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-b border backdrop-blur-md flex flex-col items-center justify-center text-center transition-all ${getBgGlow(level)}`}>
      {/* Header Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <ShieldAlert className={`w-4 h-4 ${getColorClass(level)}`} />
        <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
          MISSION RISK SCORE GAUGE
        </span>
      </div>

      {/* SVG Semi-Circle Dial */}
      <div className="relative w-48 h-28 flex items-end justify-center my-2">
        <svg className="w-48 h-48 transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
          {/* Background Arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeDasharray="125.6 251.2" // Half circle
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            className={`transition-all duration-1000 ${getColorClass(level)}`}
            strokeWidth="8"
            strokeDasharray={`${(normalizedScore / 100) * 125.6} 251.2`}
            strokeLinecap="round"
          />
        </svg>

        {/* Needle Indicator */}
        <div
          className="absolute bottom-2 left-1/2 w-1 h-20 bg-gradient-to-t from-slate-400 to-white rounded-full origin-bottom transition-transform duration-1000 -translate-x-1/2 shadow-lg"
          style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-400 absolute bottom-0 -left-1 border-2 border-slate-900 shadow-md"></div>
        </div>

        {/* Score Readout Center Overlay */}
        <div className="absolute bottom-0 text-center">
          <span className="text-3xl md:text-4xl font-mono font-black tracking-tight text-slate-100">
            {normalizedScore.toFixed(0)}
          </span>
          <span className="text-xs font-mono text-slate-400 block -mt-1 font-semibold">
            / 100 INDEX
          </span>
        </div>
      </div>

      {/* Threat Level Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-lg text-xs font-mono font-black uppercase tracking-wider bg-slate-900 border border-slate-800 ${getColorClass(level)}`}>
          {level} THREAT
        </span>
      </div>

      {primaryThreat && (
        <div className="mt-2 text-[11px] font-mono text-slate-400 line-clamp-1">
          Primary: <span className="text-slate-200 font-bold">{primaryThreat}</span>
        </div>
      )}
    </div>
  );
}
