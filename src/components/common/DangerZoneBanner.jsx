import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Radio,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DangerZoneBanner() {
  const {
    activeDangerBreach,
    confirmDangerZoneSafe,
    dismissDangerBreach,
    setActivePage,
  } = useApp();

  if (!activeDangerBreach) {
    return null;
  }

  const { zone, remainingSeconds, status } = activeDangerBreach;
  const isEscalated = status === 'escalated';

  return (
    <aside
      role="alert"
      aria-live="assertive"
      className={`border-b text-white text-xs px-4 py-2.5 shadow-lg relative z-50 transition-colors animate-slide-down ${
        isEscalated
          ? 'bg-rose-950 border-rose-700/80 shadow-rose-950/50'
          : 'bg-amber-950 border-amber-600/70 shadow-amber-950/50'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Hazard Title & Countdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold tracking-wider text-[10px] uppercase font-mono ${
              isEscalated
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-amber-500 text-black'
            }`}
          >
            {isEscalated ? (
              <Radio className="w-3 h-3 animate-spin" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {isEscalated ? 'ESCALATION ACTIVE' : 'DANGER ZONE BREACH'}
          </span>

          <div className="flex items-center gap-1.5 font-bold text-sm text-white">
            <span>{zone.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/20 text-amber-200 uppercase font-mono">
              {zone.hazardType || 'Hazard'}
            </span>
          </div>

          {!isEscalated ? (
            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-black/40 px-2.5 py-0.5 rounded-md border border-amber-500/40 text-amber-100">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Safety Timer: <strong>{remainingSeconds}s</strong> remaining</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-rose-900/80 px-2.5 py-0.5 rounded-md border border-rose-500/50 text-rose-100">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>60s Expired: Simulated Distress Packet Dispatched</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-white/80 font-mono">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>Perimeter: {zone.radiusMeters}m radius</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={confirmDangerZoneSafe}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>I'm Safe</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActivePage('saved-places');
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1"
          >
            <span>Leave Zone</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={dismissDangerBreach}
            className="text-white/70 hover:text-white p-1 rounded-lg transition"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-[10px] text-white/60 text-center pt-1 font-mono">
        * Proactive Hazard Geofencing: Emergency contacts receive simulated dispatch if 60s timer expires without confirmation. Real 112 emergency services are not dialed.
      </div>
    </aside>
  );
}
