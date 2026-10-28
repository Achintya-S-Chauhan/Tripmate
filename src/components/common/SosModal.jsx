import React from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  PhoneCall,
  CheckCircle2,
  XCircle,
  MapPin,
  HeartPulse,
  Share2,
  Radio,
  Clock,
  StopCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SosModal() {
  const {
    isSosConfirmOpen,
    closeSosConfirmation,
    isSosModalOpen,
    sosCountdown,
    cancelSosSimulation,
    closeSosModal,
    startEmergencySession,
    endEmergencySession,
    emergencySession,
    trustedContacts,
    activeJourney,
  } = useApp();

  const isEmergency = emergencySession?.isActive;

  const formatElapsed = (sec = 0) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 1. Accidental Activation Prevention Confirmation Step
  if (isSosConfirmOpen) {
    const notifyContacts = trustedContacts.filter((c) => c.notifyOnSos !== false);

    return (
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="relative w-full max-w-lg bg-[#140b0e] border-2 border-rose-600/70 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 p-6 text-center border-b border-rose-800/60 relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mb-3 shadow-lg shadow-rose-900/50">
              <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest mb-1.5">
              Accidental Activation Guard
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Confirm Emergency SOS Beacon
            </h2>

            <p className="text-xs text-rose-200/80 mt-1 max-w-md mx-auto">
              Please verify that you intend to initiate a high-priority simulated distress broadcast.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 bg-[#0f111a] text-xs">
            {/* Simulation Disclosure Alert */}
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 space-y-1">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Demonstration Sandbox Notice
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                This triggers a <strong>SIMULATED EMERGENCY SESSION</strong>. Real 911, 112, 110 dispatch lines and live telecom SMS networks are <strong>NEVER contacted</strong>. All telemetry and delivery records are client-side demo simulations.
              </p>
            </div>

            {/* Target Contacts to Alert */}
            <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Contacts Designated for Simulated Alert:</span>
                <span className="text-rose-400 font-mono">{notifyContacts.length} contacts</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                {notifyContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/50 text-[11px]">
                    <span className="font-semibold text-white truncate">{c.name} ({c.relation})</span>
                    <span className="font-mono text-slate-400 text-[10px]">{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => startEmergencySession(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-600/40 transition transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-spin" />
                <span>Activate Simulated SOS Session Now</span>
              </button>

              <button
                type="button"
                onClick={() => startEmergencySession(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Start 5-Second Cancelable Countdown</span>
              </button>

              <button
                type="button"
                onClick={closeSosConfirmation}
                className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel / Stand Down (Return to Safety)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If modal is not open and not confirming, return null
  if (!isSosModalOpen && !isEmergency) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#140b0e] border-2 border-rose-600/70 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Glow Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 p-6 text-center border-b border-rose-800/60 relative">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center mb-3">
            {isEmergency ? (
              <AlertOctagon className="w-8 h-8 text-rose-400 animate-pulse" />
            ) : (
              <Radio className="w-8 h-8 text-rose-400 animate-spin" />
            )}
          </div>

          <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold tracking-wider uppercase mb-1">
            Simulated Emergency Distress Protocol
          </div>

          <h2 className="text-xl font-extrabold text-white">
            {isEmergency ? 'SIMULATED EMERGENCY SESSION ACTIVE' : 'Initiating Simulated Distress Beacon...'}
          </h2>

          <p className="text-xs text-rose-200/80 mt-1 max-w-sm mx-auto">
            {isEmergency
              ? 'Distress telemetry and medical ICE disclosures are active in simulation mode.'
              : 'Cancel before countdown reaches zero if this was triggered accidentally.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 bg-[#0f111a]">
          {/* Countdown State */}
          {!isEmergency && sosCountdown !== null && (
            <div className="text-center py-4">
              <div className="text-6xl font-black text-rose-500 font-mono tracking-tighter animate-pulse">
                00:0{sosCountdown}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Simulated emergency beacon activating in {sosCountdown}s
              </p>

              <button
                type="button"
                onClick={cancelSosSimulation}
                className="mt-6 w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 transition flex items-center justify-center gap-2 shadow-lg"
              >
                <XCircle className="w-5 h-5 text-rose-400" />
                Cancel Emergency Broadcast
              </button>
            </div>
          )}

          {/* Triggered Active Emergency Session State */}
          {isEmergency && (
            <div className="space-y-4 text-xs">
              {/* Session Metrics Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-rose-950/40 p-3 rounded-xl border border-rose-800/50">
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">Session Timer</span>
                  <span className="font-mono font-black text-white text-lg block mt-0.5">
                    {formatElapsed(emergencySession.elapsedSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Started: {emergencySession.startedAt}</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Mock Dispatch</span>
                  <span className="font-mono font-black text-emerald-400 text-lg block mt-0.5">
                    {emergencySession.mockAlertDeliveries?.length || 0} Delivered
                  </span>
                  <span className="text-[10px] text-teal-400 font-semibold">Simulated Channels Active</span>
                </div>
              </div>

              {/* Sample Location */}
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                  <span className="flex items-center gap-1 text-rose-400">
                    <MapPin className="w-3.5 h-3.5" /> Sample Location Telemetry
                  </span>
                  <span className="font-mono text-emerald-400">{emergencySession.sampleLocation?.accuracy}</span>
                </div>
                <div className="text-white font-bold text-xs truncate">
                  {emergencySession.sampleLocation?.name}
                </div>
                <div className="text-slate-400 text-[11px] font-mono">
                  Coords: {emergencySession.sampleLocation?.coords ? emergencySession.sampleLocation.coords.join(', ') : '35.0037, 135.7770'}
                </div>
              </div>

              {/* Mock Alert Deliveries List */}
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Mock Alert Delivery Status</span>
                  <span className="text-emerald-400">Simulation Complete</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {emergencySession.mockAlertDeliveries?.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-white text-[11px]">
                        <span>{item.name}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                        <span>{item.channel} • {item.phone}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* End Emergency Session Action Button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={endEmergencySession}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-600/40 transition flex items-center justify-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>End Emergency Session</span>
                </button>

                <button
                  type="button"
                  onClick={closeSosModal}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Minimize
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
