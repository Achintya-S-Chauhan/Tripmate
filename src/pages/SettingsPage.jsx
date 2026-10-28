import React, { useState } from 'react';
import {
  Settings,
  Globe,
  ShieldCheck,
  Download,
  RotateCcw,
  Sliders,
  Bell,
  Map,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';


export default function SettingsPage() {
  const {
    settings,
    setSettings,
    resetAllDemoData,
    exportJourneyData,
    user,
    addToast,
  } = useApp();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    addToast('Preference Saved', `Updated ${key} to ${value}.`, 'info');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-teal-400" />
          Settings & Companion Preferences
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure mobility units, safety beacon sensitivity, map styling, and demo data portability.
        </p>
      </div>

      {/* Section 1: Units & Regional Preferences */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-400" />
            Units & Regional Formatting
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select standard measurements for transit metrics and expenses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Distance */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Distance Units
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('distanceUnit', 'km')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  settings.distanceUnit === 'km'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Kilometers (km)
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('distanceUnit', 'mi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  settings.distanceUnit === 'mi'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Miles (mi)
              </button>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Temperature
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('tempUnit', 'C')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  settings.tempUnit === 'C'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Celsius (°C)
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('tempUnit', 'F')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  settings.tempUnit === 'F'
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Safety & Emergency Protocol Controls */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Safety & Emergency Protocol Parameters
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure simulated beacon timings and auto-reminder frequencies.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Distress Beacon Sensitivity
            </label>
            <select
              value={settings.safetySensitivity}
              onChange={(e) => handleSettingChange('safetySensitivity', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Standard">Standard (5s Cancel Window)</option>
              <option value="High Alert">High Alert (3s Cancel Window)</option>
              <option value="Discreet">Discreet (Silent Visual Relay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Scheduled Safety Check-In Prompt
            </label>
            <select
              value={settings.autoCheckinInterval}
              onChange={(e) => handleSettingChange('autoCheckinInterval', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Off">Disabled (Manual Only)</option>
              <option value="4h">Every 4 Hours</option>
              <option value="8h">Every 8 Hours (Recommended)</option>
              <option value="24h">Daily Morning Check-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Data Management & Backup Portability */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-teal-400" />
            Data Management & Portability
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export your saved expeditions or reset demo seed state anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white">Export Traveler Data</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Download a clean JSON archive containing all journeys, waypoints, saved places, and check-in logs.
              </p>
            </div>
            <button
              onClick={exportJourneyData}
              className="w-full py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download JSON Backup
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-rose-300">Reset Demo Seed Data</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Restore initial demonstration trips (Kyoto, Swiss Alps, Amalfi Coast) and clear custom modifications.
              </p>
            </div>
            <button
              onClick={() => setConfirmResetOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Demo Data Reset */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-rose-600/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Reset Demo Records?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will restore the initial demonstration journeys, saved places, and clear browser local storage session state.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllDemoData();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparent Disclaimer & Safety Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Info className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Product Transparency & Compliance Disclaimer</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          TripMate is an interactive frontend demonstration of a modern travel-tech mobility and emergency companion interface. All telemetry, GPS waypoints, weather readings, and SOS countdown features are client-side simulated workflows. TripMate does NOT connect to live police dispatch (911/110/112), send actual SMS text messages, or collect persistent real-world hardware satellite telemetry without explicit user authorization.
        </p>
      </div>
    </div>
  );
}
