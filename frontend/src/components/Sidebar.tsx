"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  SunMedium,
  Satellite,
  ShieldAlert,
  Sliders,
  History,
  Scale,
  BookOpen
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Mission Control", icon: LayoutDashboard, tag: "LIVE" },
    { href: "/forecast", label: "AI Forecast", icon: SunMedium, tag: "ML" },
    { href: "/satellite", label: "Digital Twin", icon: Satellite, tag: "TWIN" },
    { href: "/risk", label: "Mission Risk", icon: ShieldAlert, tag: "RISK" },
    { href: "/simulation", label: "What-If Simulator", icon: Sliders, tag: "SIM" },
    { href: "/events", label: "Historical Replay", icon: History, tag: "REPLAY" },
    { href: "/compare", label: "Compare Fleet", icon: Scale, tag: "MULTI" },
    { href: "/about", label: "Methodology", icon: BookOpen, tag: "DOCS" },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-slate-950/70 border-r border-slate-800/80 p-3 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-slate-400 uppercase">
          OPERATIONAL MODULES
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 ${
                isActive
                  ? "bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? "bg-cyan-900/60 text-cyan-200"
                    : "bg-slate-900 text-slate-400"
                }`}
              >
                {item.tag}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ISRO Hackathon Telemetry Footer Badge */}
      <div className="p-3 mt-4 rounded-lg bg-slate-900/40 border border-slate-800/60 text-[11px] font-mono space-y-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span>SYSTEM STATUS</span>
          <span className="text-emerald-400 flex items-center gap-1 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Physics-Informed Digital Twin Platform for Satellite Mission Survivability.
        </div>
      </div>
    </aside>
  );
}
