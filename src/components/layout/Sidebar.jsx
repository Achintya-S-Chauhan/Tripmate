import React from 'react';
import {
  Compass,
  Map,
  ShieldCheck,
  BarChart3,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Sparkles,
  User as UserIcon,
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
    isAuthenticated,
    openAuthModal,
    logoutUser,
  } = useApp();

  // 5 Core Navigation Pillars
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Compass,
      description: 'Active trip status & top metrics',
    },
    {
      id: 'journeys',
      label: 'My Journeys',
      icon: Map,
      badge: journeys.length,
      description: 'Trip collection & segment chains',
    },
    {
      id: 'insights',
      label: 'Travel Insights',
      icon: BarChart3,
      description: 'Distance, modality & eco analytics',
    },
    {
      id: 'safety',
      label: 'Safety Center',
      icon: ShieldCheck,
      badge: 'Protected',
      badgeColor: 'emerald',
      description: 'Emergency console & ICE contacts',
    },
    {
      id: 'saved-places',
      label: 'Saved Places',
      icon: Bookmark,
      badge: savedPlaces.length,
      description: 'Waypoints & safe geofences',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0b1222] border-r border-slate-800/80 transition-all duration-300 relative z-30 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 justify-between">
        <button
          type="button"
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-3 group overflow-hidden text-left"
          title="TripMate Overview"
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
                Smart Mobility
              </span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List - 5 Core Items */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
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
                        item.badgeColor === 'emerald'
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

      {/* User Footer Profile & Settings Access */}
      <div className="p-3 border-t border-slate-800 bg-[#090f1c]">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-teal-500/50 ring-2 ring-slate-800 shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                    {user.name}
                    <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                  </div>
                  <div className="text-[10px] text-teal-400/90 font-mono truncate">
                    {user.email || 'Cloud Account'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActivePage('settings')}
                className={`p-1.5 rounded-lg transition ${
                  activePage === 'settings'
                    ? 'text-teal-400 bg-teal-500/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Settings & Preferences"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={logoutUser}
                  className="p-1.5 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            {!isSidebarCollapsed ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Cloud Account</span>
                </button>
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                  <span>Local Demo Mode</span>
                  <button
                    type="button"
                    onClick={() => setActivePage('settings')}
                    className="text-slate-400 hover:text-teal-300 flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Settings</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-full p-2 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center hover:bg-teal-500/30 transition"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <LogIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('settings')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
