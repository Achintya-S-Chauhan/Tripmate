import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-3.5 border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-slide-up ${
              isSuccess
                ? 'bg-[#0f2420]/95 border-emerald-500/40 text-emerald-100'
                : isWarning
                ? 'bg-[#2a1715]/95 border-rose-500/50 text-rose-100'
                : isError
                ? 'bg-rose-950/95 border-rose-600/60 text-white'
                : 'bg-slate-900/95 border-slate-700/80 text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-500" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-teal-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold leading-tight">{toast.title}</h5>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white p-1 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
