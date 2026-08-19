"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sun,
  Compass,
  Zap,
  Radio,
  Satellite,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  Sparkles,
  Info,
  Clock
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { SpaceWeatherTelemetry } from "@/types/space-weather";
import { SatelliteProfile } from "@/types/satellite";
import { MissionRiskAssessment } from "@/types/risk";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { RiskGauge } from "@/components/RiskGauge";
import { SubsystemCard } from "@/components/SubsystemCard";
import { ThreeGlobe } from "@/components/ThreeGlobe";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function MissionControlDashboard() {
  const [scenario, setScenario] = useState<string>("extreme_drag");
  const [telemetry, setTelemetry] = useState<SpaceWeatherTelemetry | null>(null);
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [riskAssessment, setRiskAssessment] = useState<MissionRiskAssessment | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load baseline data on mount or scenario change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [weatherData, satsData, alertsData] = await Promise.all([
          orbitalApi.getCurrentSpaceWeather(scenario),
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);

        setTelemetry(weatherData);
        setSatellites(satsData);
        setAlerts(alertsData);

        const currentRisk = await orbitalApi.calculateRisk({
          satelliteId: selectedSatId,
          scenario: scenario
        });
        setRiskAssessment(currentRisk);
      } catch (err) {
        console.error("[Dashboard] Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [scenario, selectedSatId]);

  const selectedSat = satellites.find((s) => s.id === selectedSatId) || satellites[0];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
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
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Dashboard Canvas */}
        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  MISSION CONTROL DASHBOARD
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {telemetry?.scenario_name || "Simulation Active"}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                ORBITAL SHIELD <span className="text-cyan-400">· MISSION INTELLIGENCE</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Transforming global solar space weather forecasts into spacecraft-specific vulnerability assessments.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/simulation"
                className="px-3.5 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <span>What-If Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Section 1: Current Space Weather Status Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>GLOBAL SPACE WEATHER TELEMETRY</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                NOAA SWPC / NASA DONKI FEED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Solar Activity */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-amber-400">
                    <Flame className="w-3.5 h-3.5" /> Solar Activity
                  </span>
                  <ThreatBadge
                    level={telemetry?.solar_flux_xray && telemetry.solar_flux_xray >= 1e-4 ? "CRITICAL" : (telemetry?.solar_flux_xray && telemetry.solar_flux_xray >= 1e-5 ? "HIGH" : "MODERATE")}
                    size="sm"
                  />
                </div>
                <div className="text-2xl font-mono font-black text-slate-100">
                  {telemetry?.flare_class || "B2.5"}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Flux: <span className="text-slate-200 font-semibold">{telemetry?.solar_flux_xray?.toExponential(2)} W/m²</span>
                </div>
                <div className="text-[10px] font-mono text-amber-400/80 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> F10.7 Flux: {telemetry?.f10_7_cm_flux} sfu
                </div>
              </div>

              {/* Card 2: Geomagnetic Activity */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-cyan-400">
                    <Compass className="w-3.5 h-3.5" /> Geomagnetic Field
                  </span>
                  <ThreatBadge
                    level={telemetry?.kp_index && telemetry.kp_index >= 7 ? "CRITICAL" : (telemetry?.kp_index && telemetry.kp_index >= 5 ? "HIGH" : "LOW")}
                    size="sm"
                  />
                </div>
                <div className="text-2xl font-mono font-black text-slate-100 flex items-baseline gap-2">
                  <span>Kp {telemetry?.kp_index?.toFixed(1) || "1.7"}</span>
                  <span className="text-xs text-cyan-300 font-bold">{telemetry?.geomagnetic_scale}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  Dst Index: <span className="text-slate-200 font-semibold">{telemetry?.dst_index_nt} nT</span>
                </div>
                <div className="text-[10px] font-mono text-cyan-400/80 mt-1 flex items-center gap-1">
                  <Wind className="w-3 h-3" /> SW Speed: {telemetry?.solar_wind_speed_kms} km/s
                </div>
              </div>

              {/* Card 3: Radiation Environment */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-purple-400">
                    <Zap className="w-3.5 h-3.5" /> Radiation Flux
                  </span>
                  <ThreatBadge
                    level={telemetry?.proton_flux_10mev && telemetry.proton_flux_10mev >= 100 ? "CRITICAL" : (telemetry?.proton_flux_10mev && telemetry.proton_flux_10mev >= 10 ? "HIGH" : "LOW")}
                    size="sm"
                  />
                </div>
                <div className="text-2xl font-mono font-black text-slate-100 flex items-baseline gap-2">
                  <span>{telemetry?.proton_flux_10mev?.toFixed(1)} <span className="text-xs text-slate-400">pfu</span></span>
                  <span className="text-xs text-purple-300 font-bold">{telemetry?.radiation_scale}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  &gt;100 MeV: <span className="text-slate-200 font-semibold">{telemetry?.proton_flux_100mev} pfu</span>
                </div>
                <div className="text-[10px] font-mono text-purple-400/80 mt-1">
                  Relativistic e⁻: {telemetry?.electron_flux_2mev?.toFixed(0)} pfu
                </div>
              </div>

              {/* Card 4: Ionospheric Disturbance */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-emerald-400">
                    <Radio className="w-3.5 h-3.5" /> Ionosphere / RF
                  </span>
                  <ThreatBadge
                    level={telemetry?.radio_blackout_scale && telemetry.radio_blackout_scale.startsWith("R3") ? "HIGH" : "LOW"}
                    size="sm"
                  />
                </div>
                <div className="text-2xl font-mono font-black text-slate-100">
                  {telemetry?.radio_blackout_scale || "R0"}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  IMF Bz: <span className="text-slate-200 font-semibold">{telemetry?.imf_bz_gsm_nt} nT</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80 mt-1">
                  Total Bt: {telemetry?.imf_bt_nt} nT
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Spacecraft Digital Twin Risk Assessment & 3D Globe */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Selected Satellite Mission Risk Card */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between shadow-xl space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                      <Satellite className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-400 uppercase">Target Spacecraft</div>
                      <div className="text-base font-mono font-bold text-slate-100">
                        {selectedSat?.name || "SAT-EO-01"}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-300">
                        {selectedSat?.orbit_type} · {selectedSat?.altitude_km} km · {selectedSat?.inclination_deg}° Inc
                      </div>
                    </div>
                  </div>

                  <ThreatBadge level={riskAssessment?.risk_level || "MODERATE"} size="md" />
                </div>

                {/* Overall Mission Risk Radial Gauge */}
                <div className="py-2 flex items-center justify-center">
                  <RiskGauge
                    score={riskAssessment?.overall_risk || 0}
                    level={riskAssessment?.risk_level || "LOW"}
                    title="OVERALL MISSION RISK"
                    subtitle={`Primary: ${riskAssessment?.primary_threat || "Drag"}`}
                    size={210}
                  />
                </div>

                {/* Subsystem Progress Bars */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
                    Subsystem Risk Breakdown:
                  </div>

                  {[
                    { label: "Atmospheric Drag", score: riskAssessment?.drag_risk?.score || 0, color: "#f97316" },
                    { label: "Ionizing Radiation & SEU", score: riskAssessment?.radiation_risk?.score || 0, color: "#a855f7" },
                    { label: "Spacecraft Charging (ESD)", score: riskAssessment?.charging_risk?.score || 0, color: "#eab308" },
                    { label: "Comms Link Margin", score: riskAssessment?.communication_risk?.score || 0, color: "#38bdf8" },
                    { label: "GNSS Navigation Delay", score: riskAssessment?.navigation_risk?.score || 0, color: "#22c55e" },
                  ].map((sub, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">{sub.label}</span>
                        <span className="font-bold" style={{ color: sub.color }}>
                          {Math.round(sub.score)} / 100
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max(4, sub.score)}%`,
                            backgroundColor: sub.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <Link
                  href="/risk"
                  className="flex-1 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold text-center tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                >
                  WHY IS RISK ELEVATED? (XAI)
                </Link>
                <Link
                  href="/satellite"
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs text-center uppercase transition-all"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Right: 3D Earth Globe Visualization */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>INTERACTIVE ORBIT & SPACE ENVIRONMENT 3D</span>
                </h2>
                <span className="text-[10px] font-mono text-emerald-400">
                  REAL-TIME VECTOR ENGINE
                </span>
              </div>

              <div className="flex-1 min-h-[380px]">
                <ThreeGlobe
                  altitudeKm={selectedSat?.altitude_km || 550}
                  inclinationDeg={selectedSat?.inclination_deg || 53}
                  satelliteName={selectedSat?.name || "SAT-EO-01"}
                  riskLevel={riskAssessment?.risk_level || "MODERATE"}
                  solarWindSpeed={telemetry?.solar_wind_speed_kms || 580}
                  kpIndex={telemetry?.kp_index || 6.0}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Space Weather Timeline Stream */}
          <section className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>48-HOUR SPACE WEATHER MISSION EVENT TIMELINE</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                CHRONOLOGICAL IMPACT PROGRESSION
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { time: "T-12h", title: "Solar Active Region Flares", tag: "CORONAL", status: "COMPLETE", color: "#f59e0b" },
                { time: "T-6h", title: "Halo CME Interplanetary Transit", tag: "SHOCK", status: "PROPAGATING", color: "#f97316" },
                { time: "T-2h", title: "Solar Proton Storm Onset", tag: "PARTICLES", status: "DETECTED", color: "#a855f7" },
                { time: "T+0h", title: "Geomagnetic Shock Impact", tag: "MAGNETOPAUSE", status: "ACTIVE", color: "#ef4444" },
                { time: "T+4h", title: "Thermospheric Density Expansion", tag: "JOULE HEAT", status: "EXPANDING", color: "#ec4899" },
                { time: "T+8h", title: "Peak LEO Drag Deceleration", tag: "DRAG MAX", status: "FORECAST", color: "#06b6d4" },
              ].map((ev, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold" style={{ color: ev.color }}>{ev.time}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {ev.tag}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-200 font-medium leading-tight">
                    {ev.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                    <span>{ev.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: Operational Decision Support Advisories */}
          {riskAssessment && riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
            <section className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>OPERATIONAL DECISION-SUPPORT RECOMMENDATIONS</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  MISSION-AWARE ADVISORY PROTOCOLS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {riskAssessment.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-start gap-2.5 text-xs font-mono text-slate-300 leading-relaxed"
                  >
                    <span className="text-cyan-400 font-bold">[{idx + 1}]</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Alerts Drawer Modal */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
      />
    </div>
  );
}
