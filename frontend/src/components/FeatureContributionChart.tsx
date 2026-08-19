"use client";

import React from "react";
import { FeatureContribution } from "@/types/risk";
import { Info } from "lucide-react";

interface FeatureContributionChartProps {
  contributions: FeatureContribution[];
  satelliteName?: string;
}

export function FeatureContributionChart({ contributions, satelliteName }: FeatureContributionChartProps) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs font-mono text-slate-400">
        No feature contribution data available for this satellite profile.
      </div>
    );
  }

  // Find maximum absolute contribution for scaling
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.contribution)), 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
            <span>EXPLAINABLE AI (XAI) ATTRIBUTION</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
              SHAP EQUIVALENT
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical & environmental factors driving {satelliteName || "spacecraft"} risk scoring:
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {contributions.map((item, idx) => {
          const isPositive = item.contribution >= 0;
          const barWidthPct = Math.min(100, (Math.abs(item.contribution) / maxAbs) * 100);

          return (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="font-semibold text-slate-200">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase">
                    [{item.category}]
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                      isPositive
                        ? "bg-red-950/60 text-red-400 border border-red-800/50"
                        : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                    }`}
                  >
                    {isPositive ? `+${item.contribution}` : item.contribution} pts
                  </span>
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex relative">
                {isPositive ? (
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${barWidthPct}%` }}
                  />
                ) : (
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${barWidthPct}%` }}
                  />
                )}
              </div>

              {/* Physical explanation */}
              {item.description && (
                <div className="flex items-start gap-1.5 mt-1.5 text-[11px] text-slate-400">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{item.description}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
