"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { getRiskColor } from "@/lib/utils";

interface ThreeGlobeProps {
  altitudeKm?: number;
  inclinationDeg?: number;
  satelliteName?: string;
  riskLevel?: string;
  solarWindSpeed?: number;
  kpIndex?: number;
  className?: string;
}

export function ThreeGlobe({
  altitudeKm = 550,
  inclinationDeg = 53,
  satelliteName = "SAT-EO-01",
  riskLevel = "HIGH",
  solarWindSpeed = 580,
  kpIndex = 6.0,
  className = ""
}: ThreeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showOrbit, setShowOrbit] = useState(true);
  const [showAuroralOval, setShowAuroralOval] = useState(true);
  const [showRadiationBelt, setShowRadiationBelt] = useState(true);

  useEffect(() => {
    setMounted(true);
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 350;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 3.8);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 3. Earth Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Earth Sphere Geometry
    const earthRadius = 1.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 48, 48);

    // Procedural Earth Texture on Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Deep blue ocean
      ctx.fillStyle = "#04132b";
      ctx.fillRect(0, 0, 1024, 512);

      // Continents grid pattern simulation
      ctx.fillStyle = "#0c3258";
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 1024;
        const y = 80 + Math.random() * 350;
        const r = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Latitude / Longitude grid lines
      ctx.strokeStyle = "rgba(14, 165, 233, 0.15)";
      ctx.lineWidth = 1;
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }
      for (let x = 0; x <= 1024; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
    }

    const earthTexture = new THREE.CanvasTexture(canvas);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTexture,
      shininess: 15,
      specular: new THREE.Color(0x0ea5e9),
      emissive: new THREE.Color(0x020817),
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Atmosphere Glow
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.04, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    // Auroral Oval Ring (Expands with Kp)
    const auroraRadius = earthRadius * 0.98;
    const auroraGeo = new THREE.TorusGeometry(auroraRadius * 0.45, 0.04, 16, 64);
    const auroraMat = new THREE.MeshBasicMaterial({
      color: kpIndex > 5.0 ? 0xef4444 : 0x22c55e,
      transparent: true,
      opacity: 0.45
    });
    const auroraMesh = new THREE.Mesh(auroraGeo, auroraMat);
    auroraMesh.position.y = 0.88;
    auroraMesh.rotation.x = Math.PI / 2;
    earthGroup.add(auroraMesh);

    // Outer Van Allen Belt Torus (for high radiation visualization)
    const radBeltGeo = new THREE.TorusGeometry(earthRadius * 2.2, 0.12, 16, 64);
    const radBeltMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.25,
      wireframe: true
    });
    const radBeltMesh = new THREE.Mesh(radBeltGeo, radBeltMat);
    radBeltMesh.rotation.x = Math.PI / 2;
    scene.add(radBeltMesh);

    // 4. Satellite Orbit Calculation
    // Scale: Earth radius = 6378 km -> 1.0 unit. Altitude km -> alt / 6378
    const orbitRadius = earthRadius + Math.max(0.12, Math.min(2.5, altitudeKm / 6378.0));
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.z = THREE.MathUtils.degToRad(inclinationDeg);
    scene.add(orbitGroup);

    // Orbit Ring Path
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
      const theta = (i / 128) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, Math.sin(theta) * orbitRadius, 0));
    }
    const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.6
    });
    const orbitLine = new THREE.Line(orbitLineGeo, orbitLineMat);
    orbitGroup.add(orbitLine);

    // Orbiting Satellite Mesh & Beacon Glow
    const colors = getRiskColor(riskLevel);
    const satGeo = new THREE.BoxGeometry(0.06, 0.03, 0.04);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const satMesh = new THREE.Mesh(satGeo, satMat);

    // Solar panels on satellite
    const panelGeo = new THREE.PlaneGeometry(0.14, 0.03);
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    satMesh.add(panelMesh);

    // Pulsing Risk Glow Sphere around Satellite
    const glowGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.hex),
      transparent: true,
      opacity: 0.6
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    satMesh.add(glowMesh);
    orbitGroup.add(satMesh);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.5);
    sunLight.position.set(5, 2, 4);
    scene.add(sunLight);

    // 6. Interactive Mouse Dragging Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      earthGroup.rotation.y += deltaX * 0.006;
      earthGroup.rotation.x += deltaY * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 7. Animation Loop
    let animId: number;
    let orbitAngle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Earth self-rotation
      if (!isDragging) {
        earthGroup.rotation.y += 0.002;
      }

      // Satellite orbital movement
      orbitAngle += 0.015;
      satMesh.position.x = Math.cos(orbitAngle) * orbitRadius;
      satMesh.position.y = Math.sin(orbitAngle) * orbitRadius;
      satMesh.rotation.z = orbitAngle + Math.PI / 2;

      // Glow pulse animation
      const pulse = 0.5 + Math.sin(orbitAngle * 4) * 0.25;
      glowMat.opacity = pulse;

      // Aurora oval visibility toggle
      auroraMesh.visible = showAuroralOval;
      radBeltMesh.visible = showRadiationBelt;
      orbitLine.visible = showOrbit;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
    };
  }, [altitudeKm, inclinationDeg, riskLevel, kpIndex, showOrbit, showAuroralOval, showRadiationBelt]);

  return (
    <div className={`relative w-full h-full min-h-[320px] rounded-xl overflow-hidden bg-slate-950/80 border border-cyan-500/20 ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Aerospace Overlay HUD */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
            ORBITAL TRACKER 3D
          </span>
        </div>
        <div className="text-xs font-mono text-slate-300 font-semibold mt-0.5">
          {satelliteName}
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Alt: <span className="text-cyan-300">{altitudeKm} km</span> | Inc: <span className="text-cyan-300">{inclinationDeg}°</span>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
        <button
          onClick={() => setShowOrbit(!showOrbit)}
          className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
            showOrbit
              ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
              : "bg-slate-900/60 border-slate-700 text-slate-500"
          }`}
        >
          Orbit Path
        </button>
        <button
          onClick={() => setShowAuroralOval(!showAuroralOval)}
          className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
            showAuroralOval
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-slate-900/60 border-slate-700 text-slate-500"
          }`}
        >
          Auroral Zone
        </button>
        <button
          onClick={() => setShowRadiationBelt(!showRadiationBelt)}
          className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
            showRadiationBelt
              ? "bg-purple-950/80 border-purple-500/50 text-purple-300"
              : "bg-slate-900/60 border-slate-700 text-slate-500"
          }`}
        >
          Van Allen Belt
        </button>
      </div>

      {/* Rotation hint */}
      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 pointer-events-none">
        Drag to Rotate 3D View
      </div>
    </div>
  );
}
