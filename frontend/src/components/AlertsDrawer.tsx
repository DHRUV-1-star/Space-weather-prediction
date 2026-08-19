"use client";

import React from "react";
import { AlertItem } from "@/types/events";
import { X, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { ThreatBadge } from "./ThreatBadge";

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
}

export function AlertsDrawer({ isOpen, onClose, alerts }: AlertsDrawerProps) {
  if (!isOpen) return null;

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case "WATCH":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-cyan-500/30 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono font-bold tracking-wider text-sm text-slate-100 uppercase">
                SPACE WEATHER ALERTS & WARNINGS
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs font-mono text-slate-400">
            Active operational watches, geomagnetic storm alerts, and satellite threat advisories:
          </p>

          {/* Alerts List */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.level)}
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {alert.title}
                    </span>
                  </div>
                  <ThreatBadge level={alert.level} size="sm" />
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {alert.message}
                </p>

                {alert.affected_systems && alert.affected_systems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Potentially Impacted Systems:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {alert.affected_systems.map((sys, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-mono text-cyan-300 border border-cyan-900/40"
                        >
                          {sys}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold hover:bg-cyan-900/60 transition-all"
          >
            Acknowledge & Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
