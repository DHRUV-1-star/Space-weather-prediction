"use client";

import React from "react";
import { getRiskColor } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  level: string;
  size?: number;
  title?: string;
  subtitle?: string;
}

export function RiskGauge({ score, level, size = 180, title, subtitle }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score || 0));
  const colors = getRiskColor(level);
  
  // Radial arc math (240 degree arc)
  const strokeWidth = size * 0.085;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 240 deg arc is 240/360 = 2/3 of circumference
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100;
  
  // Start rotation angle (-210 degrees so it is centered)
  const startAngle = 150;

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      <svg width={size} height={size * 0.85} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset="0"
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
        />

        {/* Active Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.hex}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(${startAngle} ${center} ${center})`}
          filter="url(#gaugeGlow)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Outer Tick Marks */}
        {[0, 25, 50, 75, 100].map((tickVal) => {
          const angle = (startAngle + (tickVal / 100) * 240) * (Math.PI / 180);
          const x1 = center + (radius + strokeWidth * 0.8) * Math.cos(angle);
          const y1 = center + (radius + strokeWidth * 0.8) * Math.sin(angle);
          const x2 = center + (radius + strokeWidth * 1.3) * Math.cos(angle);
          const y2 = center + (radius + strokeWidth * 1.3) * Math.sin(angle);
          return (
            <line
              key={tickVal}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#475569"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>

      {/* Center Digital Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none">
        <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          {title || "RISK SCORE"}
        </span>
        <div className="flex items-baseline gap-1 my-0.5">
          <span
            className="text-4xl md:text-5xl font-black font-mono tracking-tight transition-colors duration-500"
            style={{ color: colors.hex }}
          >
            {Math.round(clampedScore)}
          </span>
          <span className="text-xs font-mono text-slate-500">/100</span>
        </div>
        <span
          className="text-xs font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded border"
          style={{
            color: colors.hex,
            borderColor: `${colors.hex}44`,
            backgroundColor: `${colors.hex}15`
          }}
        >
          {level}
        </span>
        {subtitle && (
          <span className="text-[10px] font-mono text-slate-400 mt-1 text-center max-w-[140px] truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
