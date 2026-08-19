"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Satellite,
  ShieldAlert,
  SlidersHorizontal,
  History,
  Scale,
  BookOpen,
  Radio,
  Activity
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: "Mission Control", href: "/", icon: LayoutDashboard, mod: "MOD-01" },
    { name: "AI Weather Forecast", href: "/forecast", icon: Zap, mod: "MOD-02" },
    { name: "Digital Twin Builder", href: "/satellite", icon: Satellite, mod: "MOD-03" },
    { name: "Mission Risk Deep-Dive", href: "/risk", icon: ShieldAlert, mod: "MOD-04" },
    { name: "What-If Simulator", href: "/simulation", icon: SlidersHorizontal, mod: "MOD-05" },
    { name: "Historical Replay", href: "/events", icon: History, mod: "MOD-06" },
    { name: "Fleet Comparison", href: "/compare", icon: Scale, mod: "MOD-07" },
    { name: "Methodology & Docs", href: "/about", icon: BookOpen, mod: "MOD-08" }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-950/90 border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0 space-y-6">
      <div className="space-y-4">
        <div className="px-2 py-1 text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center justify-between border-b border-slate-800/60 pb-2">
          <span>OPERATIONAL MODULES</span>
          <span className="text-cyan-400">ISRO / SWPC</span>
        </div>

        <nav className="space-y-1 font-mono text-xs">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-cyan-950/60 border border-cyan-400/60 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-cyan-900 text-cyan-200" : "bg-slate-900 text-slate-400"}`}>
                  {item.mod}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Ground Station Status Panel */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
          <span className="flex items-center gap-1.5 text-xs text-cyan-300 font-bold">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>GROUND LINK</span>
          </span>
          <span className="text-emerald-400 font-bold text-[10px]">NOMINAL</span>
        </div>

        <div className="space-y-1 text-slate-400 text-[10px]">
          <div className="flex justify-between">
            <span>UHF/S-Band:</span>
            <span className="text-slate-200">14.204 MHz</span>
          </div>
          <div className="flex justify-between">
            <span>Telemetry Bitrate:</span>
            <span className="text-slate-200">2.4 Mbps</span>
          </div>
          <div className="flex justify-between">
            <span>Orbit Accuracy:</span>
            <span className="text-emerald-400">&lt; 1.2 meters</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
