"use client";

import React, { useEffect, useState } from "react";
import {
  SunMedium,
  Compass,
  Zap,
  Radio,
  Wind,
  ShieldAlert,
  Layers,
  Sparkles,
  TrendingUp,
  Info,
  CheckCircle2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { orbitalApi } from "@/lib/api";
import { SpaceWeatherForecast, SpaceWeatherTelemetry } from "@/types/space-weather";
import { SatelliteProfile } from "@/types/satellite";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreatBadge } from "@/components/ThreatBadge";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function ForecastPage() {
  const [scenario, setScenario] = useState<string>("extreme_drag");
  const [forecast, setForecast] = useState<SpaceWeatherForecast | null>(null);
  const [telemetry, setTelemetry] = useState<SpaceWeatherTelemetry | null>(null);
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fcData, telemData, satsData, alertsData] = await Promise.all([
          orbitalApi.getForecast(scenario),
          orbitalApi.getCurrentSpaceWeather(scenario),
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setForecast(fcData);
        setTelemetry(telemData);
        setSatellites(satsData);
        setAlerts(alertsData);
      } catch (err) {
        console.error("[Forecast] Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [scenario]);

  const flareData = [
    { name: "C-Class (Common)", prob: forecast?.flare_forecast?.class_c_prob || 75, color: "#eab308", desc: "> 1e-6 W/m² (Minor ionization)" },
    { name: "M-Class (Major)", prob: forecast?.flare_forecast?.class_m_prob || 45, color: "#f97316", desc: "1e-5 to 1e-4 W/m² (R1-R2 Radio blackout)" },
    { name: "X-Class (Extreme)", prob: forecast?.flare_forecast?.class_x_prob || 18, color: "#dc2626", desc: "> 1e-4 W/m² (R3-R5 Global blackout)" },
  ];

  const geomagData = [
    { scale: "G1 Minor", prob: forecast?.geomagnetic_forecast?.g1_prob || 90, color: "#eab308" },
    { scale: "G2 Moderate", prob: forecast?.geomagnetic_forecast?.g2_prob || 75, color: "#f97316" },
    { scale: "G3 Strong", prob: forecast?.geomagnetic_forecast?.g3_prob || 55, color: "#ef4444" },
    { scale: "G4 Severe", prob: forecast?.geomagnetic_forecast?.g4_prob || 38, color: "#dc2626" },
    { scale: "G5 Extreme", prob: forecast?.geomagnetic_forecast?.g5_prob || 18, color: "#9333ea" },
  ];

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
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                  AI PREDICTIVE FORECASTING ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  48-Hour Horizon
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                SOLAR FLARE & GEOMAGNETIC STORM PROJECTIONS
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Ensemble ML models forecasting solar X-ray flares, interplanetary CME shock arrival, and geomagnetic disturbances.
              </p>
            </div>

            {/* Model Confidence Metric Badge */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  Model Confidence
                </span>
                <span className="text-xl font-mono font-black text-cyan-400">
                  {forecast?.overall_confidence || 84}%
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section A & B: Solar Flare & Geomagnetic Storm Forecasts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Section A: Solar Flare Forecast */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
                    <SunMedium className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
                      SOLAR FLARE CLASS PROBABILITY (24H)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      Active Sunspot Source: {forecast?.flare_forecast?.primary_active_region || "AR-3842"}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Conf: {forecast?.flare_forecast?.confidence || 82}%
                </span>
              </div>

              {/* Flare Probabilities Bars */}
              <div className="space-y-3">
                {flareData.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">{item.name}</span>
                      <span className="text-sm font-black" style={{ color: item.color }}>
                        {item.prob}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${item.prob}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Geomagnetic Storm Forecast */}
            <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
                      GEOMAGNETIC STORM SCALE (G1 - G5)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">
                      Peak Forecast: Kp {forecast?.geomagnetic_forecast?.kp_peak_forecast || 8.7} @ T+{forecast?.geomagnetic_forecast?.kp_peak_horizon_hours || 14}h
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  Conf: {forecast?.geomagnetic_forecast?.confidence || 86}%
                </span>
              </div>

              {/* Storm Scale Bar Chart */}
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geomagData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="scale" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#030712",
                        borderColor: "#0ea5e9",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                        fontSize: "11px"
                      }}
                      formatter={(val: any) => [`${val}% Probability`, "Storm Risk"]}
                    />
                    <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                      {geomagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Section C & D: Solar Wind & Radiation Event Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Solar Wind Speed 48h Timeline */}
            <div className="lg:col-span-8 p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                    SOLAR WIND SPEED & IMF BZ FORECAST (48H HORIZON)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  RTSW / ENLIL SIMULATION
                </span>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecast?.solar_wind_speed_forecast_kms || []}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
                    <YAxis domain={[300, 1000]} stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#030712",
                        borderColor: "#0ea5e9",
                        borderRadius: "8px",
                        fontFamily: "monospace",
                        fontSize: "11px"
                      }}
                      formatter={(val: any) => [`${val} km/s`, "Solar Wind Speed"]}
                    />
                    <Area type="monotone" dataKey="speed" stroke="#0ea5e9" strokeWidth={2} fill="url(#windGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radiation Event Scale Card */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between shadow-lg space-y-3">
              <div>
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                    RADIATION STORM PROBABILITY
                  </h3>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">S1+ (Minor Proton Event)</span>
                      <span className="text-amber-400 font-bold">{forecast?.radiation_forecast?.s1_plus_prob || 65}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${forecast?.radiation_forecast?.s1_plus_prob || 65}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-300">S3+ (Strong Proton Event)</span>
                      <span className="text-red-400 font-bold">{forecast?.radiation_forecast?.s3_plus_prob || 42}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${forecast?.radiation_forecast?.s3_plus_prob || 42}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Uncertainty Explanation Alert */}
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Forecast confidence is derived from CME transit velocity variance, solar active region magnetic complexity, and satellite sensor baseline noise.
                </span>
              </div>
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
