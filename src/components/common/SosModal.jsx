import React from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  MapPin,
  Share2,
  Radio,
  Clock,
  StopCircle,
  AlertTriangle,
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
    isDemoMode,
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
      <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-md bg-travel-card border border-travel rounded-2xl shadow-elevated overflow-hidden z-10 flex flex-col text-travel-primary">
          {/* Header */}
          <div className="p-5 text-center border-b border-travel bg-travel-subtle relative">
            <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-2.5">
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider mb-1">
              Accidental Activation Guard
            </span>

            <h2 className="text-base sm:text-lg font-bold text-travel-primary tracking-tight">
              Confirm Emergency SOS Simulator
            </h2>

            <p className="text-xs text-travel-secondary mt-0.5 max-w-sm mx-auto">
              Please verify that you intend to initiate a simulated emergency distress routine.
            </p>
          </div>

          {/* Body */}
          <div className="p-5 space-y-3.5 text-xs">
            {/* Simulation Disclosure Alert */}
            <div className="p-3 rounded-xl bg-travel-subtle border border-travel space-y-1">
              <div className="flex items-center gap-2 text-travel-primary font-bold text-xs uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-travel-accent shrink-0" />
                Demonstration Sandbox Notice
              </div>
              <p className="text-travel-secondary text-[11px] leading-relaxed">
                This triggers a <strong>simulated emergency session</strong>. Real emergency lines (112 / 911 / 110) and live telecom SMS networks are <strong>never contacted</strong>.
              </p>
            </div>

            {/* Target Contacts to Alert */}
            <div className="bg-travel-subtle rounded-xl p-3 border border-travel space-y-2">
              <div className="text-[11px] font-bold text-travel-primary uppercase tracking-wider flex items-center justify-between">
                <span>Designated Mock Recipients:</span>
                <span className="text-travel-accent font-mono">{notifyContacts.length} contacts</span>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto custom-scrollbar">
                {notifyContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-travel-card px-2.5 py-1.5 rounded-lg border border-travel text-[11px]">
                    <span className="font-semibold text-travel-primary truncate">{c.name} ({c.relation})</span>
                    <span className="font-mono text-travel-muted text-[10px]">{c.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => startEmergencySession(true)}
                className="w-full btn-travel-emergency py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Activate Simulated SOS Now</span>
              </button>

              <button
                type="button"
                onClick={() => startEmergencySession(false)}
                className="w-full btn-travel-secondary py-2 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Start 5-Second Cancelable Countdown</span>
              </button>

              <button
                type="button"
                onClick={closeSosConfirmation}
                className="w-full py-1.5 text-center text-xs font-medium text-travel-muted hover:text-travel-primary transition"
              >
                Cancel / Return to Safety
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
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-travel-card border border-travel rounded-2xl shadow-elevated overflow-hidden z-10 flex flex-col text-travel-primary">
        {/* Header */}
        <div className="p-5 text-center border-b border-travel bg-travel-subtle relative">
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-2.5">
            {isEmergency ? (
              <AlertOctagon className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
            ) : (
              <Radio className="w-6 h-6 text-red-600 dark:text-red-400 animate-spin" />
            )}
          </div>

          <div className="inline-block px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider mb-1">
            Simulated Emergency Routine
          </div>

          <h2 className="text-base sm:text-lg font-bold text-travel-primary">
            {isEmergency ? 'Simulated Emergency Session Active' : 'Initiating Simulated Distress Beacon...'}
          </h2>

          <p className="text-xs text-travel-secondary mt-0.5 max-w-sm mx-auto">
            {isEmergency
              ? 'Distress telemetry and medical ICE disclosures are active in simulation mode.'
              : 'Cancel before countdown reaches zero if this was triggered accidentally.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Countdown State */}
          {!isEmergency && sosCountdown !== null && (
            <div className="text-center py-4">
              <div className="text-5xl font-mono font-bold text-red-600 dark:text-red-400 tracking-tight animate-pulse">
                00:0{sosCountdown}
              </div>
              <p className="text-xs text-travel-secondary mt-2">
                Simulated emergency beacon activating in {sosCountdown}s
              </p>

              <button
                type="button"
                onClick={cancelSosSimulation}
                className="mt-5 w-full btn-travel-secondary py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel Emergency Broadcast
              </button>
            </div>
          )}

          {/* Triggered Active Emergency Session State */}
          {isEmergency && (
            <div className="space-y-3.5 text-xs">
              {/* Session Metrics Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-travel-subtle p-3 rounded-xl border border-travel">
                  <span className="text-[10px] text-travel-muted uppercase font-bold block">Session Timer</span>
                  <span className="font-mono font-bold text-travel-primary text-base block mt-0.5">
                    {formatElapsed(emergencySession.elapsedSeconds)}
                  </span>
                  <span className="text-[10px] text-travel-muted font-mono">Started: {emergencySession.startedAt}</span>
                </div>

                <div className="bg-travel-subtle p-3 rounded-xl border border-travel">
                  <span className="text-[10px] text-travel-muted uppercase font-bold block">Dispatch Status</span>
                  {isDemoMode ? (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base block mt-0.5">
                      {emergencySession.mockAlertDeliveries?.length || 0} Simulated
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs block mt-1">
                      0 Sent • Service Unavailable
                    </span>
                  )}
                  <span className="text-[10px] text-travel-muted">
                    {isDemoMode ? 'Demo Sandbox Active' : 'No External Gateway'}
                  </span>
                </div>
              </div>

              {/* Sample Location */}
              <div className="bg-travel-subtle rounded-xl p-3 border border-travel space-y-1">
                <div className="flex items-center justify-between text-travel-muted text-[10px] uppercase font-bold">
                  <span className="flex items-center gap-1 text-travel-accent">
                    <MapPin className="w-3 h-3" /> Location Telemetry
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{emergencySession.sampleLocation?.accuracy}</span>
                </div>
                <div className="text-travel-primary font-bold text-xs truncate">
                  {emergencySession.sampleLocation?.name}
                </div>
                <div className="text-travel-muted text-[11px] font-mono">
                  Coords: {emergencySession.sampleLocation?.coords ? emergencySession.sampleLocation.coords.join(', ') : '23.5350, 77.8150'}
                </div>
              </div>

              {/* Alert Deliveries List */}
              <div className="bg-travel-subtle rounded-xl p-3 border border-travel space-y-2">
                <div className="text-[10px] font-bold text-travel-muted uppercase tracking-wider flex items-center justify-between">
                  <span>Emergency Alert Recipients</span>
                  <span className={isDemoMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                    {isDemoMode ? 'Simulation Active' : 'Gateway Unavailable'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {emergencySession.mockAlertDeliveries?.map((item, idx) => (
                    <div key={idx} className="bg-travel-card p-2 rounded-lg border border-travel space-y-1">
                      <div className="flex items-center justify-between font-semibold text-travel-primary text-[11px]">
                        <span>{item.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                            item.status.includes('Not sent')
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-travel-muted font-mono flex items-center justify-between">
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
                  className="flex-1 py-2.5 px-4 rounded-xl btn-travel-emergency text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>End Emergency Session</span>
                </button>

                <button
                  type="button"
                  onClick={closeSosModal}
                  className="py-2.5 px-4 rounded-xl btn-travel-secondary text-xs font-semibold transition"
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
