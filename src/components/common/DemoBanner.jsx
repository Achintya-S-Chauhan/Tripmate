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
    <div className="bg-red-800 dark:bg-red-950 border-b border-red-700/60 text-white text-xs px-4 py-2 shadow-md relative z-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Status & Location Details */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold tracking-wider text-[10px] uppercase">
            <Radio className="w-3 h-3 animate-spin" />
            Simulated Emergency Session Active
          </span>

          <div className="flex items-center gap-1.5 text-white/90 font-mono text-[11px] bg-black/20 px-2 py-0.5 rounded-md border border-white/10">
            <Clock className="w-3 h-3" />
            <span>Elapsed: {formatElapsed(emergencySession.elapsedSeconds)}</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-white/80 text-[11px]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-xs font-medium">
              Sample: {sampleLoc?.name || 'Kyoto Safe Transit'}
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] bg-white/10 text-white px-2 py-0.5 rounded font-mono">
            {deliveredCount} Mock Alerts Simulated
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActivePage('safety')}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Safety Center
          </button>

          <button
            type="button"
            onClick={endEmergencySession}
            className="px-3 py-1 rounded-lg bg-white text-red-900 font-bold text-[11px] transition flex items-center gap-1 shadow-sm active:scale-95"
          >
            <StopCircle className="w-3 h-3" />
            End Session
          </button>
        </div>
      </div>

      {/* Transparent Disclaimer */}
      <div className="text-[10px] text-white/70 text-center pt-0.5 font-mono hidden sm:block">
        * Demonstration Sandbox: Real emergency dispatch lines (112 / 911 / 110) are never contacted.
      </div>
    </div>
  );
}
