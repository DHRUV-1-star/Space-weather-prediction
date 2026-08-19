"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Radio, Satellite, Bell, Sparkles, Activity } from "lucide-react";
import { SatelliteProfile } from "@/types/satellite";
import { AlertItem } from "@/types/events";

interface NavbarProps {
  currentScenario?: string;
  onScenarioChange?: (scenario: string) => void;
  satellites?: SatelliteProfile[];
  selectedSatelliteId?: string;
  onSatelliteChange?: (id: string) => void;
  alerts?: AlertItem[];
  onOpenAlerts?: () => void;
}

export function Navbar({
  currentScenario = "extreme_drag",
  onScenarioChange,
  satellites = [],
  selectedSatelliteId = "SAT-EO-01",
  onSatelliteChange,
  alerts = [],
  onOpenAlerts
}: NavbarProps) {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scenarios = [
    { key: "extreme_drag", label: "G4/G5 Extreme Drag" },
    { key: "severe_radiation", label: "S3 Radiation Storm" },
    { key: "g2_storm", label: "G2 Moderate Storm" },
    { key: "normal", label: "Normal (Quiet Sun)" }
  ];

  const criticalAlerts = alerts.filter(a => a.level === "CRITICAL" || a.level === "WARNING");

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-cyan-500/20 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.35)] group-hover:border-cyan-400 transition-all">
              <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black tracking-widest text-base text-slate-100 uppercase">
                  ORBITAL<span className="text-cyan-400">SHIELD</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ISRO HACKATHON
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 hidden sm:block">
                AI-Powered Space Weather & Satellite Mission Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Center / Right Telemetry Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Active Spacecraft Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedSatelliteId}
              onChange={(e) => onSatelliteChange && onSatelliteChange(e.target.value)}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer pr-1"
            >
              {satellites.map((sat) => (
                <option key={sat.id} value={sat.id} className="bg-slate-950 text-slate-200">
                  {sat.id} ({sat.orbit_type} {sat.altitude_km}km)
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Selector Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400 uppercase hidden md:inline">Mode:</span>
            <select
              value={currentScenario}
              onChange={(e) => onScenarioChange && onScenarioChange(e.target.value)}
              className="bg-transparent text-amber-300 font-mono text-xs focus:outline-none cursor-pointer pr-1"
            >
              {scenarios.map((s) => (
                <option key={s.key} value={s.key} className="bg-slate-950 text-slate-200">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live UTC Clock */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">{utcTime || "SYNCING..."}</span>
          </div>

          {/* Alerts Trigger Button */}
          <button
            onClick={onOpenAlerts}
            className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-300 transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Alerts</span>
            {criticalAlerts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-[10px] text-white font-bold animate-pulse">
                {criticalAlerts.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
