"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Radio,
  Clock,
  Bell,
  Layers,
  ChevronDown,
  Satellite as SatIcon,
  Sparkles,
  Zap
} from "lucide-react";
import { SatelliteProfile } from "@/types/satellite";
import { AlertItem } from "@/types/events";
import { TelemetryTicker } from "@/components/TelemetryTicker";

interface NavbarProps {
  satellites?: SatelliteProfile[];
  selectedSatelliteId?: string;
  onSatelliteChange?: (id: string) => void;
  selectedScenario?: string;
  currentScenario?: string;
  onScenarioChange?: (scenarioKey: string) => void;
  alerts?: AlertItem[];
  onOpenAlerts?: () => void;
}

export function Navbar({
  satellites = [],
  selectedSatelliteId = "SAT-EO-01",
  onSatelliteChange,
  selectedScenario,
  currentScenario,
  onScenarioChange,
  alerts = [],
  onOpenAlerts
}: NavbarProps) {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scenarios = [
    { key: "normal", label: "Normal Quiet Sun" },
    { key: "g2_storm", label: "G2 Moderate Storm" },
    { key: "severe_radiation", label: "Severe Solar Radiation" },
    { key: "extreme_drag", label: "Extreme Thermospheric Drag" }
  ];

  return (
    <header className="w-full bg-slate-950/95 border-b border-cyan-500/30 sticky top-0 z-40 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: ISRO Mission Control Crest & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-950 via-slate-900 to-purple-950 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-mono font-black tracking-wider text-slate-100 uppercase">
                ORBITAL SHIELD
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                ISRO HACKATHON
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-tight hidden sm:block">
              SPACE WEATHER & SATELLITE RISK ASSESSMENT PLATFORM
            </p>
          </div>
        </div>

        {/* Center: Live UTC Clock & Target Satellite Selector */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2 font-mono text-xs text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-cyan-300 font-bold">{utcTime || "14:06:45 UTC"}</span>
          </div>

          {satellites.length > 0 && onSatelliteChange && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <SatIcon className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 font-semibold">TARGET:</span>
              <select
                value={selectedSatelliteId}
                onChange={(e) => onSatelliteChange(e.target.value)}
                className="bg-transparent text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                {satellites.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-950 text-slate-100">
                    {s.id} ({s.orbit_type} {s.altitude_km}km)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Controls: Scenario Simulator & Alerts */}
        <div className="flex items-center gap-2.5">
          {onScenarioChange && (
            <div className="relative">
              <select
                value={selectedScenario || currentScenario || "normal"}
                onChange={(e) => onScenarioChange(e.target.value)}
                className="appearance-none bg-slate-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              >
                {scenarios.map((sc) => (
                  <option key={sc.key} value={sc.key} className="bg-slate-950 text-slate-100">
                    Sim: {sc.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-red-600 text-white animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Marquee Stream */}
      <TelemetryTicker />
    </header>
  );
}
