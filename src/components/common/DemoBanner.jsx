import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  StopCircle,
  Radio,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DemoBanner() {
  const {
    startSosSimulation,
    sendSafetyCheckInPing,
    emergencySession,
    endEmergencySession,
    setActivePage,
  } = useApp();

  const isEmergency = emergencySession?.isActive;

  const formatElapsed = (totalSec = 0) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (isEmergency) {
    const deliveredCount = emergencySession.mockAlertDeliveries?.length || 0;
    const sampleLoc = emergencySession.sampleLocation;

    return (
      <div className="bg-gradient-to-r from-[#20080f] via-[#350b16] to-[#20080f] border-b-2 border-rose-500 text-rose-100 text-xs px-4 py-2.5 shadow-2xl relative z-40 animate-pulse-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Status & Location Details */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black tracking-wider text-[11px] uppercase shadow-md animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              SIMULATED EMERGENCY SESSION ACTIVE
            </span>

            <div className="flex items-center gap-1.5 text-rose-200 font-mono text-[11px] bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800/60">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>Elapsed: {formatElapsed(emergencySession.elapsedSeconds)}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-slate-300 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate max-w-xs font-medium">
                Sample: {sampleLoc?.name || 'Kyoto Safe Transit'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({sampleLoc?.coords ? sampleLoc.coords.join(', ') : '35.0037, 135.7770'})
              </span>
            </div>

            <span className="hidden sm:inline-block text-[11px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-semibold">
              {deliveredCount} Mock Alerts Simulated
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage('safety')}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-[11px] font-bold transition flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Safety Console
            </button>

            <button
              type="button"
              onClick={endEmergencySession}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] tracking-wide transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Emergency Session
            </button>
          </div>
        </div>

        {/* Disclaimer Bar */}
        <div className="text-[10px] text-rose-300/80 text-center pt-1 font-mono tracking-tight hidden sm:block">
          * Demonstration Sandbox: Real 911/112/110 lines and live telecom SMS carriers are NEVER contacted.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-[#0d1e38] to-slate-900 border-b border-slate-800 text-slate-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 font-semibold tracking-wide text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          DEMO MODE
        </span>
        <span className="text-slate-300 hidden sm:inline">
          Simulated traveler telemetry & safety records. No live emergency dispatch or real GPS tracking.
        </span>
        <span className="text-slate-300 sm:hidden">
          Simulated data only • No real dispatch
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => sendSafetyCheckInPing()}
          className="px-2.5 py-1 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-medium transition text-[11px] flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Simulate Check-in
        </button>

        <button
          onClick={startSosSimulation}
          className="px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition text-[11px] flex items-center gap-1"
        >
          <ShieldAlert className="w-3 h-3" />
          Test SOS Simulator
        </button>
      </div>
    </div>
  );
}
