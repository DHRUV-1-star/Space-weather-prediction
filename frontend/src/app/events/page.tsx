"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Calendar,
  Layers,
  Compass,
  Zap,
  Info,
  CheckCircle2
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { HistoricalEvent } from "@/types/events";
import { SatelliteProfile } from "@/types/satellite";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function HistoricalEventsPage() {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("may-2024-g5");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(2); // Default to T-0h
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      try {
        const [evData, sats, alertData] = await Promise.all([
          orbitalApi.getHistoricalEvents(),
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setEvents(evData);
        setSatellites(sats);
        setAlerts(alertData);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const steps = activeEvent?.timeline_steps || [];
  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto playback loop
  useEffect(() => {
    let interval: any;
    if (isPlaying && steps.length > 0) {
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % steps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps]);

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
          <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
                  HISTORICAL STORM REPLAY & VALIDATION
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  SPACE WEATHER TIME-TRAVEL
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                BENCHMARK STORM SIMULATION & RETROSPECTIVE VALIDATION
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Replay historical super-storms and evaluate how ORBITAL SHIELD predictive models correlate with observed spacecraft anomalies.
              </p>
            </div>

            {/* Model Accuracy Badge */}
            {activeEvent && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Retrospective Accuracy
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {activeEvent.model_prediction_accuracy_pct}%
                  </span>
                </div>
                <div className="h-9 w-9 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>

          {/* Event Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => {
                  setSelectedEventId(ev.id);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedEventId === ev.id
                    ? "bg-purple-950/40 border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-slate-950/80 border border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-purple-400 font-bold">{ev.date_str}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono text-[10px]">
                    Max Kp {ev.max_kp}
                  </span>
                </div>
                <h4 className="text-sm font-mono font-bold text-slate-100 line-clamp-1">
                  {ev.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1 line-clamp-2">
                  {ev.summary}
                </p>
              </div>
            ))}
          </div>

          {/* Active Event Replay Console */}
          {activeEvent && (
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-6 shadow-xl">
              {/* Event Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-mono font-bold text-slate-100">
                    {activeEvent.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                    <span>Flare: <strong className="text-amber-400">{activeEvent.max_flare_class}</strong></span>
                    <span>·</span>
                    <span>Peak Wind: <strong className="text-cyan-400">{activeEvent.solar_wind_peak_kms} km/s</strong></span>
                    <span>·</span>
                    <span>Peak Dst: <strong className="text-red-400">{activeEvent.dst_peak_nt} nT</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isPlaying
                        ? "bg-red-950 border border-red-500 text-red-300"
                        : "bg-purple-950 border border-purple-500 text-purple-300 hover:bg-purple-900"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isPlaying ? "Pause Replay" : "Play Timeline"}</span>
                  </button>
                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timeline Phase Scrubber */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase font-semibold">
                  Timeline Phase Scrubber (Select Step):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {steps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={`p-3 rounded-lg text-left font-mono transition-all ${
                        currentStepIndex === idx
                          ? "bg-purple-950 border-2 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                          : "bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold text-cyan-400">{step.time_offset}</div>
                      <div className="text-[11px] font-semibold text-slate-200 truncate mt-0.5">
                        {step.phase_title}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-1">Kp {step.kp}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Step Telemetry & Spacecraft Impact */}
              {currentStep && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-cyan-400 uppercase font-bold">
                      {currentStep.time_offset} · Phase Description:
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-100">
                      {currentStep.phase_title}
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {currentStep.description}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-purple-500/30 space-y-2">
                    <div className="text-xs font-mono text-purple-400 uppercase font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                      <span>Simulated Spacecraft Fleet Impact:</span>
                    </div>
                    <p className="text-xs text-purple-200 font-mono leading-relaxed">
                      {currentStep.satellite_impact_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Observed Real-World Consequences & Retrospective Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Observed Real-World Impact Checklist:
                  </div>
                  <ul className="space-y-1.5 text-xs font-mono text-slate-400">
                    {activeEvent.real_world_consequences.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1.5">
                  <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Model vs Observed Telemetry Notes</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {activeEvent.prediction_vs_observed_notes}
                  </p>
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
