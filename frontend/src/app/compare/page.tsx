"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  Satellite,
  ShieldAlert,
  Wind,
  Zap,
  Sparkles,
  Radio,
  Compass,
  CheckCircle2,
  Info,
  Layers
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { SatelliteProfile } from "@/types/satellite";
import { SatelliteComparisonResponse } from "@/types/risk";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function SatelliteComparePage() {
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatIds, setSelectedSatIds] = useState<string[]>(["SAT-EO-01", "SAT-COM-01", "SAT-NAV-01"]);
  const [compareData, setCompareData] = useState<SatelliteComparisonResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [sats, alertsData] = await Promise.all([
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setSatellites(sats);
        setAlerts(alertsData);

        const comp = await orbitalApi.compareSatellites(selectedSatIds);
        setCompareData(comp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleSat = async (id: string) => {
    let updated = [...selectedSatIds];
    if (updated.includes(id)) {
      if (updated.length > 2) updated = updated.filter((s) => s !== id);
    } else {
      if (updated.length < 3) updated.push(id);
      else updated = [updated[1], updated[2], id];
    }
    setSelectedSatIds(updated);
    try {
      const comp = await orbitalApi.compareSatellites(updated);
      setCompareData(comp);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        satellites={satellites}
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
                  FLEET VULNERABILITY COMPARISON
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  MULTI-ORBIT ANALYSIS
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                SATELLITE ORBITAL REGIME COMPARATIVE MATRIX
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Evaluate why different spacecraft (LEO vs MEO vs GEO) face drastically distinct space weather threats under the exact same storm.
              </p>
            </div>
          </div>

          {/* Spacecraft Selector Pills */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
              Select 2 to 3 Spacecraft Profiles to Compare:
            </div>
            <div className="flex flex-wrap gap-2">
              {satellites.map((sat) => {
                const isSelected = selectedSatIds.includes(sat.id);
                return (
                  <button
                    key={sat.id}
                    onClick={() => handleToggleSat(sat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-cyan-950 border-2 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {sat.id} ({sat.orbit_type} {sat.altitude_km}km)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          {compareData && (
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 overflow-x-auto shadow-xl space-y-4">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="p-3">METRIC / SUBSYSTEM</th>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <th key={idx} className="p-3 text-slate-100 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Satellite className="w-4 h-4 text-cyan-400" />
                          <span>{s.satellite.name}</span>
                        </div>
                        <div className="text-[10px] text-cyan-300 font-normal mt-0.5">
                          {s.satellite.orbit_type} · {s.satellite.altitude_km} km · {s.satellite.mission_type}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {/* Overall Risk Row */}
                  <tr className="bg-cyan-950/20 font-bold">
                    <td className="p-3 text-cyan-300">OVERALL MISSION RISK</td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-black text-slate-100">
                            {s.assessment.overall_risk}
                          </span>
                          <ThreatBadge level={s.assessment.risk_level} size="sm" />
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Primary Threat Row */}
                  <tr>
                    <td className="p-3 text-slate-400 font-semibold">Primary Threat</td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3 text-orange-300 font-bold">
                        {s.assessment.primary_threat}
                      </td>
                    ))}
                  </tr>

                  {/* Drag Risk */}
                  <tr>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-orange-400" />
                      <span>Atmospheric Drag Risk</span>
                    </td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <span className="font-bold text-orange-400">{Math.round(s.assessment.drag_risk.score)} / 100</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Decay: {s.assessment.estimated_orbit_decay_rate_m_day} m/day
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Radiation Risk */}
                  <tr>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ionizing Radiation & SEU</span>
                    </td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <span className="font-bold text-purple-400">{Math.round(s.assessment.radiation_risk.score)} / 100</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          SEU Rate: {s.assessment.estimated_seu_rate_per_day} /dev/day
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Spacecraft Charging */}
                  <tr>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Spacecraft Charging (ESD)</span>
                    </td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <span className="font-bold text-amber-400">{Math.round(s.assessment.charging_risk.score)} / 100</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Voltage: -{s.assessment.surface_potential_kv} kV
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Comms Risk */}
                  <tr>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Comms Link Margin</span>
                    </td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <span className="font-bold text-cyan-300">{Math.round(s.assessment.communication_risk.score)} / 100</span>
                      </td>
                    ))}
                  </tr>

                  {/* Navigation Risk */}
                  <tr>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      <span>GNSS Navigation Integrity</span>
                    </td>
                    {compareData.satellites_evaluated.map((s, idx) => (
                      <td key={idx} className="p-3">
                        <span className="font-bold text-emerald-400">{Math.round(s.assessment.navigation_risk.score)} / 100</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* "Why Are The Risks Different?" Comparative Analysis Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2 mt-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>AEROSPACE ANALYSIS: WHY DO RISKS DIFFER ACROSS ORBITS?</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {compareData.why_risks_differ.map((analysis, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed"
                    >
                      <span className="text-cyan-400 font-bold block mb-1">
                        Domain Insight #{idx + 1}
                      </span>
                      <span>{analysis}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
