"use client";

import React, { useEffect, useState } from "react";
import {
  Satellite,
  Save,
  CheckCircle2,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  Info,
  RotateCcw
} from "lucide-react";
import { orbitalApi } from "@/lib/api";
import { SatelliteProfile, MissionType, OrbitType, RadiationHardening, DielectricCoating } from "@/types/satellite";
import { AlertItem } from "@/types/events";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { ThreeGlobe } from "@/components/ThreeGlobe";
import { AlertsDrawer } from "@/components/AlertsDrawer";

export default function SatelliteDigitalTwinPage() {
  const [satellites, setSatellites] = useState<SatelliteProfile[]>([]);
  const [selectedSatId, setSelectedSatId] = useState<string>("SAT-EO-01");
  const [formProfile, setFormProfile] = useState<SatelliteProfile>({
    id: "SAT-CUSTOM-01",
    name: "Custom Spacecraft Digital Twin",
    mission_type: "Earth Observation",
    orbit_type: "LEO",
    altitude_km: 550,
    inclination_deg: 53,
    eccentricity: 0.001,
    orbital_period_minutes: 95.6,
    mass_kg: 1200,
    cross_sectional_area_m2: 4.5,
    drag_coefficient_cd: 2.2,
    ballistic_coefficient: 121.2,
    shielding_thickness_mm_al: 2.5,
    radiation_hardening_level: "Rad-Tolerant",
    solar_panel_sensitivity: 7,
    communication_dependency: 8,
    navigation_dependency: 7,
    dielectric_coating_quality: "Standard",
    notes: "Custom mission configuration for space weather survivability analysis."
  });

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      try {
        const [sats, alertData] = await Promise.all([
          orbitalApi.getSatellites(),
          orbitalApi.getAlerts()
        ]);
        setSatellites(sats);
        setAlerts(alertData);
        const current = sats.find((s) => s.id === selectedSatId) || sats[0];
        if (current) setFormProfile(current);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleSelectPreset = (sat: SatelliteProfile) => {
    setSelectedSatId(sat.id);
    setFormProfile({ ...sat });
    setSavedSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await orbitalApi.saveSatellite(formProfile);
      setSavedSuccess(true);
      const updatedSats = await orbitalApi.getSatellites();
      setSatellites(updatedSats);
      setSelectedSatId(saved.id);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        satellites={satellites}
        selectedSatelliteId={selectedSatId}
        onSatelliteChange={(id) => {
          setSelectedSatId(id);
          const found = satellites.find((s) => s.id === id);
          if (found) setFormProfile(found);
        }}
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
                  SATELLITE DIGITAL TWIN ENGINE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SPACECRAFT SPECIFICATION
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-black text-slate-100 uppercase tracking-tight">
                MISSION PROFILE & HARDWARE VULNERABILITY MODEL
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Define orbital mechanics, ballistic parameters, aluminum radiation shielding, and subsystem sensitivities.
              </p>
            </div>
          </div>

          {/* Quick Preset Selector Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>LOAD PREDEFINED DEMONSTRATION SATELLITE PRESETS</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {satellites.map((sat) => (
                <button
                  key={sat.id}
                  onClick={() => handleSelectPreset(sat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    selectedSatId === sat.id
                      ? "bg-cyan-950 border border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-bold"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {sat.id} ({sat.mission_type} · {sat.orbit_type})
                </button>
              ))}
            </div>
          </div>

          {/* Form & 3D Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Specification Form */}
            <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
              {/* Card 1: General & Orbital Parameters */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase pb-2 border-b border-slate-800">
                  1. GENERAL & ORBITAL MECHANICS
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Spacecraft ID</label>
                    <input
                      type="text"
                      value={formProfile.id}
                      onChange={(e) => setFormProfile({ ...formProfile, id: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formProfile.name}
                      onChange={(e) => setFormProfile({ ...formProfile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Mission Type</label>
                    <select
                      value={formProfile.mission_type}
                      onChange={(e) => setFormProfile({ ...formProfile, mission_type: e.target.value as MissionType })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Earth Observation">Earth Observation</option>
                      <option value="Communication">Communication</option>
                      <option value="Navigation">Navigation</option>
                      <option value="Scientific">Scientific</option>
                      <option value="Weather">Weather</option>
                      <option value="Defense/Surveillance">Defense/Surveillance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Orbit Regime</label>
                    <select
                      value={formProfile.orbit_type}
                      onChange={(e) => setFormProfile({ ...formProfile, orbit_type: e.target.value as OrbitType })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="LEO">LEO (Low Earth Orbit)</option>
                      <option value="MEO">MEO (Medium Earth Orbit)</option>
                      <option value="GEO">GEO (Geostationary Orbit)</option>
                      <option value="HEO">HEO (Highly Elliptical)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Altitude (km): {formProfile.altitude_km}</label>
                    <input
                      type="number"
                      min={150}
                      max={40000}
                      step={10}
                      value={formProfile.altitude_km}
                      onChange={(e) => setFormProfile({ ...formProfile, altitude_km: parseFloat(e.target.value) || 550 })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Inclination (deg): {formProfile.inclination_deg}°</label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      step={0.5}
                      value={formProfile.inclination_deg}
                      onChange={(e) => setFormProfile({ ...formProfile, inclination_deg: parseFloat(e.target.value) || 53 })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Physical & Aerodynamic Drag Parameters */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-orange-400 uppercase pb-2 border-b border-slate-800">
                  2. PHYSICAL & BALLISTIC COEFFICIENT (DRAG DYNAMICS)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Spacecraft Mass (kg)</label>
                    <input
                      type="number"
                      min={10}
                      max={500000}
                      value={formProfile.mass_kg}
                      onChange={(e) => setFormProfile({ ...formProfile, mass_kg: parseFloat(e.target.value) || 1200 })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Cross-Section Area (m²)</label>
                    <input
                      type="number"
                      min={0.1}
                      max={2000}
                      step={0.1}
                      value={formProfile.cross_sectional_area_m2}
                      onChange={(e) => setFormProfile({ ...formProfile, cross_sectional_area_m2: parseFloat(e.target.value) || 4.5 })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Drag Coeff (Cd)</label>
                    <input
                      type="number"
                      min={1.5}
                      max={3.5}
                      step={0.1}
                      value={formProfile.drag_coefficient_cd}
                      onChange={(e) => setFormProfile({ ...formProfile, drag_coefficient_cd: parseFloat(e.target.value) || 2.2 })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Radiation Shielding & Subsystem Dependencies */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase pb-2 border-b border-slate-800">
                  3. RADIATION SHIELDING & SUBSYSTEM SENSITIVITIES
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">
                      Shielding Thickness: <span className="text-purple-300 font-bold">{formProfile.shielding_thickness_mm_al} mm Al Eq</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={20.0}
                      step={0.5}
                      value={formProfile.shielding_thickness_mm_al}
                      onChange={(e) => setFormProfile({ ...formProfile, shielding_thickness_mm_al: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Rad-Hardening Grade</label>
                    <select
                      value={formProfile.radiation_hardening_level}
                      onChange={(e) => setFormProfile({ ...formProfile, radiation_hardening_level: e.target.value as RadiationHardening })}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Commercial (COTS)">Commercial (COTS)</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Rad-Tolerant">Rad-Tolerant</option>
                      <option value="Rad-Hard (Mil/Space)">Rad-Hard (Mil/Space)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Comms Dependency: <span className="text-cyan-300 font-bold">{formProfile.communication_dependency} / 10</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={formProfile.communication_dependency}
                      onChange={(e) => setFormProfile({ ...formProfile, communication_dependency: parseInt(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">
                      Navigation Dependency: <span className="text-emerald-300 font-bold">{formProfile.navigation_dependency} / 10</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={formProfile.navigation_dependency}
                      onChange={(e) => setFormProfile({ ...formProfile, navigation_dependency: parseInt(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-300 font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Satellite Digital Twin</span>
                </button>

                {savedSuccess && (
                  <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-semibold animate-pulse">
                    <CheckCircle2 className="w-4 h-4" /> Profile Updated Successfully!
                  </span>
                )}
              </div>
            </form>

            {/* Right: Real-time 3D Globe & Dynamics Preview */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <div className="flex-1 min-h-[380px]">
                <ThreeGlobe
                  altitudeKm={formProfile.altitude_km}
                  inclinationDeg={formProfile.inclination_deg}
                  satelliteName={formProfile.name}
                  riskLevel="MODERATE"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Physical Dynamics Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
                  <div>Period: <span className="text-cyan-300 font-bold">{formProfile.orbital_period_minutes} min</span></div>
                  <div>Ballistic Coeff: <span className="text-cyan-300 font-bold">{formProfile.ballistic_coefficient} kg/m²</span></div>
                  <div>Area/Mass: <span className="text-cyan-300 font-bold">{((formProfile.cross_sectional_area_m2 / formProfile.mass_kg)*1000).toFixed(2)} m²/t</span></div>
                  <div>Hardening: <span className="text-cyan-300 font-bold">{formProfile.radiation_hardening_level}</span></div>
                </div>
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
