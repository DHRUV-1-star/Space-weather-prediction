import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (val === undefined || val === null || isNaN(val)) return "--";
  return val.toFixed(decimals);
}

export function getRiskColor(level: string): { text: string; bg: string; border: string; glow: string; hex: string } {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return {
        text: "text-red-400",
        bg: "bg-red-950/40",
        border: "border-red-500/50",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
        hex: "#ef4444"
      };
    case "HIGH":
      return {
        text: "text-orange-400",
        bg: "bg-orange-950/40",
        border: "border-orange-500/50",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]",
        hex: "#f97316"
      };
    case "MODERATE":
      return {
        text: "text-amber-400",
        bg: "bg-amber-950/40",
        border: "border-amber-500/50",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
        hex: "#f59e0b"
      };
    default:
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-950/40",
        border: "border-emerald-500/50",
        glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        hex: "#10b981"
      };
  }
}
