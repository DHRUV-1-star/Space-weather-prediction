import React from "react";
import { getRiskColor, cn } from "@/lib/utils";

interface ThreatBadgeProps {
  level: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThreatBadge({ level, className, size = "md" }: ThreatBadgeProps) {
  const colors = getRiskColor(level);
  
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider",
    md: "px-2.5 py-1 text-xs tracking-widest font-semibold",
    lg: "px-3.5 py-1.5 text-sm tracking-widest font-bold"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border uppercase font-mono transition-all duration-300",
        colors.bg,
        colors.text,
        colors.border,
        colors.glow,
        sizeClasses[size],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.hex }} />
      {level || "UNKNOWN"}
    </span>
  );
}
