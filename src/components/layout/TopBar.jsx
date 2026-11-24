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
  Sun,
  Moon,
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
    settings,
    toggleTheme,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const isDarkMode = settings?.appearance === 'dark' || (settings?.appearance !== 'light' && settings?.theme !== 'light');

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
        return activeJourney ? activeJourney.title : 'Trip Workspace';
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
    <header className="h-16 bg-travel-card/95 backdrop-blur-md border-b border-travel px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Drawer Trigger & Page Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-xl text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle transition"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-travel-primary tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-travel-secondary hidden sm:block">
            Personal Multi-Modal Travel & Safety Companion
          </p>
        </div>
      </div>

      {/* Right: Cloud Status, Search, Theme Toggle, Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Cloud / Demo Mode Status Badge */}
        {isAuthenticated ? (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-travel-accent-soft border border-travel text-travel-accent text-xs font-medium"
            title={`Connected to MongoDB as ${user.email}`}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
            <span className="hidden md:inline font-mono">Cloud Synced:</span>
            <span className="font-semibold truncate max-w-[120px]">
              {user.name.split(' ')[0]}
            </span>
          </div>
        ) : (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-travel-subtle border border-travel text-travel-secondary text-xs font-medium"
            title="Local demonstration sandbox mode. Sign in to sync data across devices."
          >
            <span className="w-2 h-2 rounded-full bg-travel-secondary"></span>
            <span>Guest Mode</span>
          </div>
        )}

        {/* Global Search trigger */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel text-travel-secondary hover:text-travel-primary text-xs transition"
          title="Search journeys, places & emergency hotlines (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-travel-accent" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden lg:inline-block text-[10px] bg-travel-card text-travel-secondary px-1.5 py-0.5 rounded border border-travel font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Theme Mode Toggle (Warm Ivory Light / Deep Charcoal-Green Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel text-travel-secondary hover:text-travel-primary transition"
          title={isDarkMode ? 'Switch to Warm Ivory Light theme' : 'Switch to Natural Forest Dark theme'}
          aria-label="Toggle color theme"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-travel-accent" />
          ) : (
            <Moon className="w-4 h-4 text-travel-accent" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel text-travel-secondary hover:text-travel-primary transition relative"
            title="Transit & Safety Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-travel-terracotta"></span>
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-travel-card border border-travel rounded-2xl shadow-2xl z-50 p-4 animate-fade-in text-travel-primary">
              <div className="flex items-center justify-between pb-3 border-b border-travel">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-travel-primary">
                  <Bell className="w-3.5 h-3.5 text-travel-accent" />
                  Travel & Safety Alerts
                </span>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-travel-secondary hover:text-travel-primary p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-2 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="p-2.5 rounded-xl bg-travel-subtle border border-travel text-xs">
                  <div className="flex items-center gap-1.5 text-travel-accent font-semibold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Corridor Status Clear
                  </div>
                  <p className="text-[11px] text-travel-secondary leading-snug">
                    Regional transit networks operating normally along planned route.
                  </p>
                  <span className="text-[10px] text-travel-muted mt-1 block font-mono">15m ago</span>
                </div>

                <div className="p-2.5 rounded-xl bg-travel-subtle border border-travel text-xs">
                  <div className="flex items-center gap-1.5 text-travel-terracotta font-semibold mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Elevation & Weather Advisory
                  </div>
                  <p className="text-[11px] text-travel-secondary leading-snug">
                    Check local forecast before embarking on alpine or outdoor trail segments.
                  </p>
                  <span className="text-[10px] text-travel-muted mt-1 block font-mono">2h ago</span>
                </div>

                {checkInLogs?.[0] && (
                  <div className="p-2.5 rounded-xl bg-travel-accent-soft border border-travel text-xs">
                    <div className="text-travel-accent font-semibold mb-0.5">
                      Last Check-in Recorded
                    </div>
                    <p className="text-[11px] text-travel-secondary leading-snug">
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
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel transition text-xs"
              title="Open account menu"
            >
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-travel"
              />
              <span className="hidden sm:inline font-bold text-travel-primary max-w-[90px] truncate">
                {user?.name ? user.name.split(' ')[0] : 'Traveler'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-travel-primary text-xs transition"
                title="Sign in or register for cloud sync"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="p-2 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel text-travel-secondary hover:text-travel-primary transition"
                title="Account & Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-travel-card border border-travel rounded-2xl shadow-2xl z-50 p-3 animate-fade-in space-y-2 text-travel-primary">
              <div className="px-2 py-1.5 border-b border-travel">
                <div className="font-bold text-travel-primary text-xs truncate">
                  {isAuthenticated ? user.name : 'Guest Traveler'}
                </div>
                <div className="text-[10px] text-travel-secondary truncate font-mono">
                  {isAuthenticated ? user.email : 'Local Demo Session'}
                </div>
                <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-bold text-travel-accent bg-travel-accent-soft px-2 py-0.5 rounded-full border border-travel">
                  <Database className="w-2.5 h-2.5" />
                  {isAuthenticated ? 'MongoDB Connected' : 'Local Storage Only'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setActivePage('settings');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-travel-secondary hover:bg-travel-subtle hover:text-travel-primary transition flex items-center gap-2"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-travel-accent" />
                <span>Settings & Preferences</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setActivePage('landing');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-travel-secondary hover:bg-travel-subtle hover:text-travel-primary transition flex items-center gap-2"
              >
                <Globe className="w-3.5 h-3.5 text-travel-accent" />
                <span>Public Landing Page</span>
              </button>

              <div className="pt-1 border-t border-travel">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logoutUser();
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
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
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-travel-accent hover:bg-travel-accent-soft transition flex items-center gap-2 font-semibold"
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
