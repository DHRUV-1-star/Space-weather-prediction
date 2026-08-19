"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Shield,
  Layers,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function AboutMethodologyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  TECHNICAL METHODOLOGY & ARCHITECTURE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ISRO SPACE HACKATHON
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                PHYSICS-INFORMED ML DIGITAL TWIN PLATFORM
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Bridging space-weather forecasting with spacecraft-specific orbital and hardware vulnerability modeling.
              </p>
            </div>
          </div>

          {/* Section 1: Core Problem & Innovation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                THE CORE CHALLENGE
              </h3>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Traditional space weather platforms stop at forecasting the geomagnetic storm (e.g. <em>"Kp 7 storm expected"</em>). However, mission operators need to know:
              </p>
              <blockquote className="p-3 rounded-lg bg-slate-900 border-l-2 border-cyan-400 text-xs font-mono text-cyan-200 italic">
                "What does this specific solar flare or CME impact mean for MY satellite at 550 km with 2.5mm Al shielding?"
              </blockquote>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                A single space weather event creates drastically distinct threats for LEO (atmospheric drag), MEO (trapped electron SEUs), and GEO (deep dielectric electrostatic charging).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 shadow-lg">
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                THE ORBITAL SHIELD INNOVATION
              </h3>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs font-mono text-slate-200">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span>Solar Activity</span>
                  <span>→</span>
                  <span>Space Weather Forecast</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300 font-bold pl-4">
                  <span>↓</span>
                  <span>Satellite Environment</span>
                  <span>→</span>
                  <span>Hardware Sensitivity</span>
                </div>
                <div className="flex items-center gap-2 text-red-300 font-bold pl-8">
                  <span>↓</span>
                  <span>Subsystem Risk Scores</span>
                  <span>→</span>
                  <span>Operational Advisories</span>
                </div>
              </div>
              <p className="text-xs font-mono text-slate-300">
                Acts as a mission-aware <strong>Digital Twin & Decision Support System</strong> for space operations teams.
              </p>
            </div>
          </div>

          {/* Section 2: Physics-Informed Modeling Formulations */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase pb-2 border-b border-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <span>RIGOROUS PHYSICS-INFORMED FORMULATIONS</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Formula 1: Drag */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-orange-400 uppercase">
                  1. Atmospheric Drag
                </div>
                <div className="p-2 rounded bg-slate-950 text-[11px] font-mono text-cyan-300 border border-slate-800">
                  F_D = 0.5 · C_d · ρ · v² · A<br />
                  B = m / (C_d · A)
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Thermospheric density ρ scales dynamically with geomagnetic Joule heating (Kp) and solar EUV flux (F10.7).
                </p>
              </div>

              {/* Formula 2: Radiation */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-purple-400 uppercase">
                  2. Dipole Cutoff & Shielding
                </div>
                <div className="p-2 rounded bg-slate-950 text-[11px] font-mono text-purple-300 border border-slate-800">
                  R_c = 14.5 · cos⁴(λ) / L²<br />
                  Dose ∝ exp(-μ · t_Al)
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Calculates Van Allen belt L-shell passage and exponential aluminum shielding attenuation for SEU risk.
                </p>
              </div>

              {/* Formula 3: Charging */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase">
                  3. Spacecraft Charging
                </div>
                <div className="p-2 rounded bg-slate-950 text-[11px] font-mono text-amber-300 border border-slate-800">
                  V_diff = - (J_e - J_i) · R_d<br />
                  J_e(&gt;2 MeV) &gt; 10⁴ pfu
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Estimates internal deep dielectric charging and differential surface potential in GEO and auroral zones.
                </p>
              </div>

              {/* Formula 4: Ionosphere */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  4. Scintillation (S4)
                </div>
                <div className="p-2 rounded bg-slate-950 text-[11px] font-mono text-emerald-300 border border-slate-800">
                  S4 = σ_I / ⟨I⟩<br />
                  Δτ_ion = 40.3 · TEC / f²
                </div>
                <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                  Models D-layer flare absorption for comms links and ionospheric TEC delay for GNSS pseudorange errors.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Data Sources & Scientific Rigor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>INTEGRATED PUBLIC DATA SOURCES</span>
              </h3>
              <ul className="space-y-2 text-xs font-mono text-slate-300">
                <li className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-start justify-between">
                  <div>
                    <strong className="text-slate-100 block">NOAA SWPC</strong>
                    <span className="text-slate-400 text-[11px]">Real-time Kp index, GOES X-ray flux, RTSW solar wind, alerts</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold">API ACTIVE</span>
                </li>
                <li className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-start justify-between">
                  <div>
                    <strong className="text-slate-100 block">NASA DONKI</strong>
                    <span className="text-slate-400 text-[11px]">Coronal Mass Ejection (CME) shock vector & transit catalog</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-bold">API ACTIVE</span>
                </li>
              </ul>
            </div>

            {/* Scientific Honesty Notice */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-3 shadow-lg">
              <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>SCIENTIFIC HONESTY & ETHICAL DISCLOSURE</span>
              </h3>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                ORBITAL SHIELD is an advanced prototype developed for the <strong>ISRO Space Hackathon</strong>.
              </p>
              <ul className="space-y-1.5 text-xs font-mono text-slate-400">
                <li>• All predictions are framed as <em>decision-support risk estimations</em> with model confidence indicators.</li>
                <li>• Operational recommendations are advisory only and do not represent autonomous spacecraft commands.</li>
                <li>• Demonstration satellite profiles are illustrative research configurations.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
