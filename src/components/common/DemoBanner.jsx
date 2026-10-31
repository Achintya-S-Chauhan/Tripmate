import React from 'react';
import {
  StopCircle,
  Radio,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DemoBanner() {
  const {
    emergencySession,
    endEmergencySession,
    setActivePage,
  } = useApp();

  const isEmergency = emergencySession?.isActive;

  // The permanent demo bar is removed in favor of TopBar status indicators.
  // DemoBanner renders exclusively when an active simulated emergency session is in progress.
  if (!isEmergency) {
    return null;
  }

  const deliveredCount = emergencySession.mockAlertDeliveries?.length || 0;
  const sampleLoc = emergencySession.sampleLocation;

  const formatElapsed = (totalSec = 0) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

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
            Safety Center
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

      {/* Transparent Disclaimer */}
      <div className="text-[10px] text-rose-300/80 text-center pt-1 font-mono tracking-tight hidden sm:block">
        * Demonstration Sandbox: Real emergency lines and live telecom carriers are NEVER contacted.
      </div>
    </div>
  );
}
