"use client";

import React, { useEffect, useState } from "react";
import {
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Shield,
  Wind,
  Zap,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { SatelliteProfile } from "@/types/satellite";
import { WhatIfSimulationResponse } from "@/types/risk";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { RiskGauge } from "@/components/RiskGauge";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function WhatIfSimulatorPage() {
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);

  // Simulation Parameters State
  const [simAltitude, setSimAltitude] = useState<number>(550);
  const [simMass, setSimMass] = useState<number>(1200);
  const [simArea, setSimArea] = useState<number>(4.5);
  const [simShielding, setSimShielding] = useState<number>(2.5);
  const [simHardening, setSimHardening] = useState<string>("Rad-Tolerant");
  const [simCommsDep, setSimCommsDep] = useState<number>(8);
  const [simNavDep, setSimNavDep] = useState<number>(7);

  // Weather Overrides
  const [overrideKp, setOverrideKp] = useState<number>(8.7);
  const [overrideWind, setOverrideWind] = useState<number>(840);
  const [overrideProton, setOverrideProton] = useState<number>(850);

  const [simResult, setSimResult] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    async function load() {
      try {
        const [sats, alertsData] = await Promise.all([
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setSatellites(sats);
        setAlerts(alertsData);

        const currentSat = sats.find((s) => s.id === selectedSatId) || sats[0];
        if (currentSat) {
          setSimAltitude(currentSat.altitude_km);
          setSimMass(currentSat.mass_kg);
          setSimArea(currentSat.cross_sectional_area_m2);
          setSimShielding(currentSat.shielding_thickness_mm_al);
          setSimHardening(currentSat.radiation_hardening_level);
          setSimCommsDep(currentSat.communication_dependency);
          setSimNavDep(currentSat.navigation_dependency);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // Re-run simulation whenever parameters change
  useEffect(() => {
    async function runSim() {
      setLoading(true);
      try {
        const res = await orbitalApi.runSimulation({
          satellite_id: selectedSatId,
          simulated_altitude_km: simAltitude,
          simulated_mass_kg: simMass,
          simulated_cross_sectional_area_m2: simArea,
          simulated_shielding_thickness_mm_al: simShielding,
          simulated_radiation_hardening: simHardening,
          simulated_comms_dependency: simCommsDep,
          simulated_nav_dependency: simNavDep,
          override_kp_index: overrideKp,
          override_solar_wind_speed: overrideWind,
          override_proton_flux: overrideProton
        });
        setSimResult(res);
      } catch (err) {
        console.error("Simulation error:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(runSim, 150);
    return () => clearTimeout(timer);
  }, [
    selectedSatId,
    simAltitude,
    simMass,
    simArea,
    simShielding,
    simHardening,
    simCommsDep,
    simNavDep,
    overrideKp,
    overrideWind,
    overrideProton
  ]);

  const handleResetToBaseline = () => {
    const currentSat = satellites.find((s) => s.id === selectedSatId);
    if (currentSat) {
      setSimAltitude(currentSat.altitude_km);
      setSimMass(currentSat.mass_kg);
      setSimArea(currentSat.cross_sectional_area_m2);
      setSimShielding(currentSat.shielding_thickness_mm_al);
      setSimHardening(currentSat.radiation_hardening_level);
      setSimCommsDep(currentSat.communication_dependency);
      setSimNavDep(currentSat.navigation_dependency);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        satellites={satellites}
        selectedSatelliteId={selectedSatId}
        onSatelliteChange={setSelectedSatId}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  ORBITAL SHIELD WHAT-IF SIMULATOR
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  REAL-TIME COUNTERFACTUAL ENGINE
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                MISSION RISK SENSITIVITY & MITIGATION TRADE STUDIES
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Interactively evaluate how orbit re-boosts, mass/area modifications, and heavier shielding reduce mission vulnerability.
              </p>
            </div>

            <button
              onClick={handleResetToBaseline}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          </div>

          {/* Top Result Banner: Before vs After Comparison */}
          {simResult && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-xl">
              {/* Baseline Box */}
              <div className="md:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Baseline Configuration</div>
                  <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
                    {simResult.baseline_assessment.satellite_name}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Alt: {simResult.baseline_assessment.altitude_km} km · Drag: {simResult.baseline_assessment.drag_risk.score} pts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-black text-slate-300">
                    {simResult.baseline_assessment.overall_risk}
                  </div>
                  <ThreatBadge level={simResult.baseline_assessment.risk_level} size="sm" />
                </div>
              </div>

              {/* Center Delta Arrow */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Risk Delta</span>
                <div
                  className={`text-xl font-mono font-black my-0.5 flex items-center gap-1 ${
                    simResult.delta_overall_risk < 0
                      ? "text-emerald-400"
                      : simResult.delta_overall_risk > 0
                      ? "text-red-400"
                      : "text-slate-300"
                  }`}
                >
                  {simResult.delta_overall_risk < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : simResult.delta_overall_risk > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : null}
                  <span>
                    {simResult.delta_overall_risk > 0 ? `+${simResult.delta_overall_risk}` : simResult.delta_overall_risk}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-300 font-semibold uppercase">
                  {simResult.mitigation_verdict}
                </span>
              </div>

              {/* Simulated Box */}
              <div className="md:col-span-5 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Simulated Configuration</div>
                  <div className="text-base font-mono font-bold text-slate-100 mt-0.5">
                    {simResult.simulated_assessment.satellite_name}
                  </div>
                  <div className="text-xs font-mono text-cyan-300 mt-1">
                    Alt: {simResult.simulated_assessment.altitude_km} km · Drag: {simResult.simulated_assessment.drag_risk.score} pts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-black text-cyan-400">
                    {simResult.simulated_assessment.overall_risk}
                  </div>
                  <ThreatBadge level={simResult.simulated_assessment.risk_level} size="sm" />
                </div>
              </div>
            </div>
          )}

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Parameter Sliders */}
            <div className="lg:col-span-7 space-y-4">
              {/* Group 1: Orbital & Geometry */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>1. ORBITAL ALTITUDE & AERODYNAMIC DRAG</span>
                  <span className="text-[10px] text-slate-400">LEO Domain</span>
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Orbital Altitude:</span>
                      <span className="text-cyan-400 font-bold">{simAltitude} km</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={1200}
                      step={25}
                      value={simAltitude}
                      onChange={(e) => setSimAltitude(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>200 km (Extreme Drag)</span>
                      <span>550 km (Nominal LEO)</span>
                      <span>1200 km (Exosphere)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Mass:</span>
                        <span className="text-slate-200 font-bold">{simMass} kg</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={5000}
                        step={50}
                        value={simMass}
                        onChange={(e) => setSimMass(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">Cross-Section Area:</span>
                        <span className="text-slate-200 font-bold">{simArea} m²</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={25.0}
                        step={0.5}
                        value={simArea}
                        onChange={(e) => setSimArea(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: Radiation Shielding & Avionics */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase pb-2 border-b border-slate-800">
                  2. ALUMINUM RADIATION SHIELDING & HARDENING
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Aluminum Shielding Thickness:</span>
                      <span className="text-purple-400 font-bold">{simShielding} mm Al Eq</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={15.0}
                      step={0.5}
                      value={simShielding}
                      onChange={(e) => setSimShielding(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>0.5 mm (Thin / COTS)</span>
                      <span>2.5 mm (Standard)</span>
                      <span>15.0 mm (Heavy Armor)</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="text-slate-300 block mb-1">Semiconductor Hardening Level:</label>
                    <select
                      value={simHardening}
                      onChange={(e) => setSimHardening(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Commercial (COTS)">Commercial (COTS) — High SEU Rate</option>
                      <option value="Industrial">Industrial Grade</option>
                      <option value="Rad-Tolerant">Rad-Tolerant</option>
                      <option value="Rad-Hard (Mil/Space)">Rad-Hard (Mil/Space) — Ultra Low SEU</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 3: Solar Storm Intensity Override */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase pb-2 border-b border-slate-800">
                  3. SPACE WEATHER ENVIRONMENTAL CONDITIONS (WHAT-IF STRESS TEST)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Kp Index:</span>
                      <span className="text-amber-400 font-bold">{overrideKp}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={0.1}
                      value={overrideKp}
                      onChange={(e) => setOverrideKp(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">SW Speed:</span>
                      <span className="text-cyan-400 font-bold">{overrideWind} km/s</span>
                    </div>
                    <input
                      type="range"
                      min={300}
                      max={1200}
                      step={20}
                      value={overrideWind}
                      onChange={(e) => setOverrideWind(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300">Proton Flux:</span>
                      <span className="text-purple-400 font-bold">{overrideProton} pfu</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={5000}
                      step={50}
                      value={overrideProton}
                      onChange={(e) => setOverrideProton(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Before vs After Subsystem Deltas & Explanations */}
            <div className="lg:col-span-5 space-y-4">
              {simResult && (
                <>
                  {/* Subsystems Delta Breakdown */}
                  <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
                    <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase pb-2 border-b border-slate-800">
                      SUBSYSTEM RISK COMPARISON MATRIX
                    </h3>

                    <div className="space-y-2.5 font-mono text-xs">
                      {[
                        { label: "Atmospheric Drag", before: simResult.baseline_assessment.drag_risk.score, after: simResult.simulated_assessment.drag_risk.score, delta: simResult.delta_drag_risk },
                        { label: "Ionizing Radiation", before: simResult.baseline_assessment.radiation_risk.score, after: simResult.simulated_assessment.radiation_risk.score, delta: simResult.delta_radiation_risk },
                        { label: "Spacecraft Charging", before: simResult.baseline_assessment.charging_risk.score, after: simResult.simulated_assessment.charging_risk.score, delta: simResult.delta_charging_risk },
                        { label: "Comms Link Margin", before: simResult.baseline_assessment.communication_risk.score, after: simResult.simulated_assessment.communication_risk.score, delta: simResult.delta_comms_risk },
                        { label: "Navigation Integrity", before: simResult.baseline_assessment.navigation_risk.score, after: simResult.simulated_assessment.navigation_risk.score, delta: simResult.delta_nav_risk },
                      ].map((row, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                          <span className="text-slate-300 font-semibold">{row.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400">{Math.round(row.before)}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-cyan-300 font-bold">{Math.round(row.after)}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                row.delta < 0
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : row.delta > 0
                                  ? "bg-red-950 text-red-400 border border-red-800"
                                  : "bg-slate-950 text-slate-400"
                              }`}
                            >
                              {row.delta > 0 ? `+${row.delta}` : row.delta}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* "Why Did The Risk Change?" Physics Explanation Card */}
                  <div className="p-5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 shadow-lg">
                    <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>PHYSICAL REASONING: WHY DID RISK CHANGE?</span>
                    </h3>

                    <div className="space-y-2">
                      {simResult.change_explanations.map((exp, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2 text-xs font-mono text-slate-300 leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
      />
    </div>
  );
}
