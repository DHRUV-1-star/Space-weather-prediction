"use client";

import React from "react";
import { Radio, Activity, Zap, Shield, Compass, Wind } from "lucide-react";
import { SpaceWeatherTelemetry } from "@/types/space-weather";

interface TelemetryTickerProps {
  telemetry?: SpaceWeatherTelemetry | null;
}

export function TelemetryTicker({ telemetry }: TelemetryTickerProps) {
  const kp = telemetry?.kp_index ?? 8.7;
  const flare = telemetry?.flare_class ?? "X3.2";
  const wind = telemetry?.solar_wind_speed_kms ?? 840;
  const bz = telemetry?.imf_bz_gsm_nt ?? -22.5;
  const dst = telemetry?.dst_index_nt ?? -285;
  const proton = telemetry?.proton_flux_10mev ?? 850;
  const scale = telemetry?.geomagnetic_scale ?? "G4";

  const tickerItems = [
    { label: "ISRO TRACKING LINK", val: "ACTIVE / HIGH-GAIN S-BAND", icon: Radio, color: "text-emerald-400" },
    { label: "NOAA GEOMAG SCALE", val: `${scale} (Kp ${kp.toFixed(1)})`, icon: Activity, color: "text-red-400" },
    { label: "SOLAR WIND VELOCITY", val: `${wind} km/s`, icon: Wind, color: "text-cyan-400" },
    { label: "IMF BZ (GSM)", val: `${bz} nT`, icon: Zap, color: bz < 0 ? "text-red-400" : "text-emerald-400" },
    { label: "DST INDEX", val: `${dst} nT`, icon: Shield, color: "text-amber-400" },
    { label: "SOLAR FLARE CLASS", val: flare, icon: Zap, color: "text-purple-400" },
    { label: "PROTON FLUX (>10MeV)", val: `${proton} pfu`, icon: Compass, color: "text-orange-400" },
    { label: "NORAD TELEMETRY", val: "SYNCHRONIZED 100%", icon: Activity, color: "text-cyan-300" }
  ];

  return (
    <div className="w-full bg-slate-950/90 border-y border-cyan-500/30 overflow-hidden py-1.5 px-4 font-mono text-[11px] flex items-center justify-between shadow-[0_0_15px_rgba(14,165,233,0.1)]">
      <div className="flex items-center gap-2 pr-4 border-r border-slate-800 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 font-bold tracking-wider text-[10px] uppercase">
          LIVE TELEMETRY STREAM
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="animate-marquee flex items-center gap-6 whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-1.5 px-2">
                <Icon className={`w-3 h-3 ${item.color}`} />
                <span className="text-slate-400 font-semibold">{item.label}:</span>
                <span className={`font-bold ${item.color}`}>{item.val}</span>
                <span className="text-slate-700 ml-2">│</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
