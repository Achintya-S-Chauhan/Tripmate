import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  X,
  LogIn,
  LogOut,
  Settings as SettingsIcon,
  Globe,
  Database,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function TopBar() {
  const {
    activePage,
    setActivePage,
    setIsMobileMenuOpen,
    setIsSearchOpen,
    activeJourney,
    checkInLogs,
    isAuthenticated,
    user,
    openAuthModal,
    logoutUser,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'landing':
        return 'Public Showcase';
      case 'overview':
        return 'Overview';
      case 'journeys':
        return 'My Journeys';
      case 'trip-details':
        return activeJourney ? activeJourney.title : 'Trip Details';
      case 'insights':
        return 'Travel Insights';
      case 'safety':
        return 'Safety Center';
      case 'saved-places':
        return 'Saved Places';
      case 'settings':
        return 'Settings';
      default:
        return 'Overview';
    }
  };

  return (
    <header className="h-16 bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Drawer Trigger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Smart Travel, Multi-Modal Mobility & Emergency Safety
          </p>
        </div>
      </div>

      {/* Right: Cloud Status, Search, Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud / Demo Mode Status Badge */}
        {isAuthenticated ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium"
            title={`Connected to MongoDB Atlas as ${user.email}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="hidden md:inline font-mono">Cloud Synced:</span>
            <span className="font-semibold truncate max-w-[120px]">
              {user.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-medium"
            title="Local demonstration sandbox mode. Sign in to sync data across devices."
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Demo Mode</span>
          </div>
        )}

        {/* Global Search trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-slate-200 text-xs transition"
          title="Search journeys, places & emergency hotlines (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline-block text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 transition relative"
            title="Transit & Safety Notifications"
            aria-label="View notifications"
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
                  type="button"
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
                    Kyoto municipal transit operating normally. Safety corridor active.
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">15m ago</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Altitude Advisory: Jungfrau
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    Winter snowpack watch active above 2,500m elevation.
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">3h ago</span>
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

        {/* Profile / Account Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 transition text-xs"
              title="Open account menu"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-teal-400/50"
              />
              <span className="hidden sm:inline font-bold text-white max-w-[90px] truncate">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition"
                title="Sign in or register for cloud sync"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 transition"
                title="Account & Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 animate-fade-in space-y-2">
              <div className="px-2 py-1.5 border-b border-slate-800">
                <div className="font-bold text-white text-xs truncate">
                  {isAuthenticated ? user.name : 'Guest Traveler'}
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono">
                  {isAuthenticated ? user.email : 'Local Demo Session'}
                </div>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Database className="w-2.5 h-2.5" />
                  {isAuthenticated ? 'MongoDB Atlas Connected' : 'Local Storage Only'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setActivePage('settings');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>Settings & Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setActivePage('landing');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2"
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>Public Landing Page</span>
              </button>

              <div className="pt-1 border-t border-slate-800">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      openAuthModal('login');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-teal-300 hover:bg-teal-500/10 transition flex items-center gap-2"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In to Cloud</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
