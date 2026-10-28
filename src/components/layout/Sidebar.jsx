import React from 'react';
import {
  Compass,
  Map,
  Navigation2,
  ShieldCheck,
  BarChart3,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const {
    activePage,
    setActivePage,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    journeys,
    savedPlaces,
    user,
    startSosSimulation,
  } = useApp();

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Compass,
      description: 'Command Center & Live Telemetry',
    },
    {
      id: 'journeys',
      label: 'My Journeys',
      icon: Map,
      badge: journeys.length,
      description: 'Itinerary & Trip Collection',
    },
    {
      id: 'trip-details',
      label: 'Trip Details',
      icon: Navigation2,
      badge: 'Active',
      badgeColor: 'teal',
      description: 'Waypoints, Map & Expenses',
    },
    {
      id: 'insights',
      label: 'Travel Insights',
      icon: BarChart3,
      description: 'Spend, Carbon & Mobility Analytics',
    },
    {
      id: 'safety',
      label: 'Safety Center',
      icon: ShieldCheck,
      badge: 'Protected',
      badgeColor: 'emerald',
      description: 'ICE Vault, Embassies & SOS',
    },
    {
      id: 'saved-places',
      label: 'Saved Places',
      icon: Bookmark,
      badge: savedPlaces.length,
      description: 'Bookmarked Sights & Stays',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences & Demo Reset',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0b1222] border-r border-slate-800 transition-all duration-300 relative z-30 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between">
        <div
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0 group-hover:scale-105 transition">
            <Compass className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-extrabold tracking-tight text-white block truncate">
                Trip<span className="text-teal-400">Mate</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                Mobility & Safety
              </span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="truncate text-sm">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        item.badgeColor === 'teal'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : item.badgeColor === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-400 rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick SOS Simulation Card in Sidebar */}
      {!isSidebarCollapsed && (
        <div className="p-3 mx-3 mb-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Emergency Quick SOS
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mb-2">
            Simulate satellite distress packet and ICE notify.
          </p>
          <button
            onClick={startSosSimulation}
            className="w-full py-1.5 px-2.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/50 text-rose-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            Launch SOS Test
          </button>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-[#090f1c]">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-teal-500/50 ring-2 ring-slate-800 shrink-0"
          />
          {!isSidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                {user.name}
                <Sparkles className="w-3 h-3 text-teal-400" />
              </div>
              <div className="text-[11px] text-teal-400/90 font-mono truncate">
                Safety Score: {user.safeTravelScore}/100
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
