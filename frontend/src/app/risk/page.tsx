"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Wind,
  Zap,
  Radio,
  Compass,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { MissionRiskAssessment } from "@/types/risk";
import { SatelliteProfile } from "@/types/satellite";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { RiskGauge } from "@/components/RiskGauge";
import { SubsystemCard } from "@/components/SubsystemCard";
import { FeatureContributionChart } from "@/components/FeatureContributionChart";
import { RiskTimeline } from "@/components/RiskTimeline";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function MissionRiskPage() {
  const [scenario, setScenario] = useState<string>("extreme_drag");
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [riskAssessment, setRiskAssessment] = useState<MissionRiskAssessment | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sats, alertsData] = await Promise.all([
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setSatellites(sats);
        setAlerts(alertsData);

        const assessment = await orbitalApi.calculateRisk({
          satelliteId: selectedSatId,
          scenario: scenario
        });
        setRiskAssessment(assessment);
      } catch (err) {
        console.error("[MissionRisk] Error loading risk data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [scenario, selectedSatId]);

  const selectedSat = satellites.find((s) => s.id === selectedSatId) || satellites[0];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentScenario={scenario}
        onScenarioChange={setScenario}
        satellites={satellites}
        selectedSatelliteId={selectedSatId}
        onSatelliteChange={setSelectedSatId}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsOpen(true)}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
                  MISSION RISK ASSESSMENT ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Target: {selectedSat?.id || "SAT-EO-01"}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                VULNERABILITY ASSESSMENT & THREAT ATTRIBUTION
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Multi-subsystem physics modeling and explainable AI feature attribution for {selectedSat?.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/simulation"
                className="px-4 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              >
                <span>Launch What-If Mitigation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Section 1: Overall Risk Summary Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center shadow-lg">
            <div className="md:col-span-4 flex justify-center">
              <RiskGauge
                score={riskAssessment?.overall_risk || 0}
                level={riskAssessment?.risk_level || "LOW"}
                title="MISSION RISK SCORE"
                subtitle={`Primary Threat: ${riskAssessment?.primary_threat || "Drag"}`}
                size="lg"
              />
            </div>

            <div className="md:col-span-8 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Assessment Summary:
                </span>
                <ThreatBadge level={riskAssessment?.risk_level || "LOW"} size="md" />
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-900 px-2 py-0.5 rounded">
                  Inference Mode: {riskAssessment?.inference_mode || "Physics-Informed Ensemble"}
                </span>
              </div>

              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Spacecraft <span className="text-cyan-300 font-bold">{selectedSat?.id}</span> ({selectedSat?.mission_type}, {selectedSat?.altitude_km} km) is operating under elevated risk conditions. The primary driver is{" "}
                <span className="text-orange-400 font-bold">{riskAssessment?.primary_threat}</span>, resulting in an estimated orbital decay rate of{" "}
                <span className="text-orange-300 font-bold">{riskAssessment?.estimated_orbit_decay_rate_m_day} m/day</span> and an estimated SEU rate of{" "}
                <span className="text-purple-300 font-bold">{riskAssessment?.estimated_seu_rate_per_day} upsets/dev/day</span>.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Storm Drag</span>
                  <span className="text-orange-400 font-bold">{riskAssessment?.storm_drag_force_mn} mN</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Density Surge</span>
                  <span className="text-orange-400 font-bold">+{riskAssessment?.relative_drag_increase_pct}%</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Surface Charge</span>
                  <span className="text-amber-400 font-bold">-{riskAssessment?.surface_potential_kv} kV</span>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
                  <span className="text-cyan-400 font-bold">{riskAssessment?.confidence}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Subsystem Risk Breakdown (5 Subsystems) */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>SUBSYSTEM RISK PROFILES & PHYSICAL QUANTITIES</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riskAssessment && (
                <>
                  <SubsystemCard
                    name="Atmospheric Drag"
                    icon={<Wind className="w-5 h-5 text-orange-400" />}
                    risk={riskAssessment.drag_risk}
                  />
                  <SubsystemCard
                    name="Ionizing Radiation & SEU"
                    icon={<Zap className="w-5 h-5 text-purple-400" />}
                    risk={riskAssessment.radiation_risk}
                  />
                  <SubsystemCard
                    name="Spacecraft Charging (ESD)"
                    icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                    risk={riskAssessment.charging_risk}
                  />
                  <SubsystemCard
                    name="Communications Link"
                    icon={<Radio className="w-5 h-5 text-cyan-400" />}
                    risk={riskAssessment.communication_risk}
                  />
                  <SubsystemCard
                    name="Navigation & GNSS Integrity"
                    icon={<Compass className="w-5 h-5 text-emerald-400" />}
                    risk={riskAssessment.navigation_risk}
                  />
                </>
              )}
            </div>
          </div>

          {/* Section 3: Explainable AI (SHAP-Style) Attribution & Forward Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: SHAP-Style Explainability */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
              <FeatureContributionChart
                contributions={riskAssessment?.feature_contributions || []}
                satelliteName={selectedSat?.id}
              />
            </div>

            {/* Right: Forward Risk Timeline */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                  48-HOUR FORWARD RISK PROJECTION
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  PEAK THREAT HORIZON: T+12H
                </span>
              </div>

              <RiskTimeline
                timeline={riskAssessment?.timeline || []}
                peakHour={riskAssessment?.peak_risk_time_hours || 12}
              />
            </div>
          </div>

          {/* Section 4: Operational Recommendations */}
          {riskAssessment && (
            <div className="p-5 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-3 shadow-lg">
              <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>MISSION OPERATIONAL MITIGATION RECOMMENDATIONS</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskAssessment.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex items-start gap-2.5 text-xs font-mono text-slate-200 leading-relaxed"
                  >
                    <span className="text-cyan-400 font-bold">[{idx + 1}]</span>
                    <span>{rec}</span>
                  </div>
                ))}
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
