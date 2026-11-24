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
      badge: journeys?.length || 0,
      description: 'Trip collection & multi-leg itineraries',
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
      badgeColor: 'sage',
      description: 'Emergency console & ICE contacts',
    },
    {
      id: 'saved-places',
      label: 'Saved Places',
      icon: Bookmark,
      badge: savedPlaces?.length || 0,
      description: 'Waypoints & safe geofences',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-travel-card border-r border-travel transition-all duration-300 relative z-30 select-none shrink-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-travel justify-between">
        <button
          type="button"
          onClick={() => setActivePage('overview')}
          className="flex items-center gap-3 group overflow-hidden text-left"
          title="TripMate Overview"
        >
          <div className="w-10 h-10 rounded-xl bg-travel-accent flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
            <Compass className="w-5 h-5 text-[var(--accent-primary-fg)] stroke-[2.2]" />
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-extrabold tracking-tight text-travel-primary block truncate">
                Trip<span className="text-travel-accent">Mate</span>
              </span>
              <span className="text-[10px] text-travel-secondary uppercase tracking-widest font-semibold block">
                Travel Planner
              </span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1.5 rounded-lg text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle transition shrink-0"
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
      <div className="flex-1 py-4 px-3 space-y-1.5">
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
                  ? 'bg-travel-accent-soft text-travel-accent font-bold shadow-sm'
                  : 'text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle font-medium'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-travel-accent' : 'text-travel-secondary group-hover:text-travel-primary'
                }`}
              />

              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="truncate text-sm">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                        isActive
                          ? 'bg-travel-card text-travel-accent border border-travel'
                          : 'bg-travel-subtle text-travel-secondary border border-travel'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Restrained Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-travel-accent rounded-r" />
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer Profile & Settings Access */}
      <div className="p-3 border-t border-travel bg-travel-subtle">
        {isAuthenticated ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-travel ring-1 ring-travel shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-travel-primary truncate flex items-center gap-1">
                    {user?.name || 'Traveler'}
                    <Sparkles className="w-3 h-3 text-travel-accent shrink-0" />
                  </div>
                  <div className="text-[10px] text-travel-secondary font-mono truncate">
                    {user?.email || 'Cloud Account'}
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
                    ? 'text-travel-accent bg-travel-accent-soft'
                    : 'text-travel-secondary hover:text-travel-primary hover:bg-travel-card'
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
                  className="p-1.5 text-travel-secondary hover:text-rose-400 rounded-lg hover:bg-travel-card transition"
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
                  className="w-full py-2 px-3 rounded-xl bg-travel-accent-soft hover:bg-travel-accent hover:text-[var(--accent-primary-fg)] text-travel-accent border border-travel font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Cloud Account</span>
                </button>
                <div className="flex items-center justify-between px-1 text-[11px] text-travel-secondary">
                  <span>Guest Session</span>
                  <button
                    type="button"
                    onClick={() => setActivePage('settings')}
                    className="text-travel-secondary hover:text-travel-accent flex items-center gap-1"
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
                  className="w-full p-2 rounded-xl bg-travel-accent-soft text-travel-accent flex items-center justify-center hover:bg-travel-accent hover:text-[var(--accent-primary-fg)] transition"
                  title="Sign In"
                  aria-label="Sign In"
                >
                  <LogIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('settings')}
                  className="p-1.5 text-travel-secondary hover:text-travel-primary rounded-lg transition"
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
