import React, { useState } from 'react';
import {
  Menu,
  Search,
  ShieldAlert,
  Bell,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Sliders,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopBar() {
  const {
    activePage,
    setIsMobileMenuOpen,
    setIsSearchOpen,
    startSosSimulation,
    sendSafetyCheckInPing,
    activeJourney,
    settings,
    setSettings,
    checkInLogs,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getPageTitle = () => {
    switch (activePage) {
      case 'overview':
        return 'Overview Dashboard';
      case 'journeys':
        return 'My Journeys Library';
      case 'trip-details':
        return activeJourney ? activeJourney.title : 'Trip Details';
      case 'insights':
        return 'Travel Insights & Eco-Mobility';
      case 'safety':
        return 'Emergency Safety Center & ICE';
      case 'saved-places':
        return 'Saved Places & Bookmarks';
      case 'settings':
        return 'Companion Settings & Preferences';
      default:
        return 'TripMate';
    }
  };

  const toggleUnits = () => {
    setSettings((prev) => ({
      ...prev,
      distanceUnit: prev.distanceUnit === 'km' ? 'mi' : 'km',
    }));
  };

  return (
    <header className="h-16 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile hamburger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
              {getPageTitle()}
            </h1>
            {activeJourney && (
              <span className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                <MapPin className="w-3 h-3" />
                {activeJourney.destination}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Smart Travel, Mobility & Safety Companion
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search trigger button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition"
          title="Search anything (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden md:inline-block text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quick Check-in Button */}
        <button
          type="button"
          onClick={() => sendSafetyCheckInPing()}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition"
          title="Broadcast simulated safe status to emergency contacts"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>I'm Safe Ping</span>
        </button>

        {/* Unit preference fast toggle button */}
        <button
          type="button"
          onClick={toggleUnits}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono font-bold text-slate-300 transition"
          title="Toggle Distance Units (Kilometers / Miles)"
        >
          {settings.distanceUnit.toUpperCase()}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition relative"
            title="Safety & Transit Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400"></span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-teal-400" />
                  Travel & Safety Alerts
                </span>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kansai Region Safety Clear
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Kyoto municipal transport operating on time. Autumn weather index is optimal.
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">15m ago</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Swiss Alps Altitude Advisory
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Winter snowpack watch active above 2,500m on Jungfrau pass.
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">3h ago</span>
                </div>

                {checkInLogs[0] && (
                  <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-800/30 text-xs">
                    <div className="text-teal-300 font-semibold mb-0.5">
                      Last Check-in Recorded
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {checkInLogs[0].location} • {checkInLogs[0].timestamp}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Emergency SOS Simulator Quick Button */}
        <button
          type="button"
          onClick={startSosSimulation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition transform active:scale-95"
          title="Trigger Emergency SOS Simulator (Cancelable countdown)"
        >
          <ShieldAlert className="w-4 h-4 animate-pulse" />
          <span className="font-extrabold tracking-wide">SOS</span>
        </button>
      </div>
    </header>
  );
}
