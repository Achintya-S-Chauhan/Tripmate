import React from 'react';
import {
  Compass,
  Map,
  Navigation2,
  ShieldCheck,
  Bookmark,
  BarChart3,
  Settings,
  X,
  Globe,
  LogIn,
  LogOut,
  Menu,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function MobileNav() {
  const {
    activePage,
    setActivePage,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeJourney,
    isAuthenticated,
    user,
    openAuthModal,
    logoutUser,
  } = useApp();

  const primaryMobileNav = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'journeys', label: 'Journeys', icon: Map },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'safety', label: 'Safety', icon: ShieldCheck },
  ];

  return (
    <>
      {/* Sliding Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1500] md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-travel-card border-r border-travel flex flex-col h-full z-10 p-4 text-travel-primary">
            <div className="flex items-center justify-between pb-4 border-b border-travel">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-travel-accent flex items-center justify-center text-[var(--accent-primary-fg)] font-black">
                  <Compass className="w-4 h-4 text-[var(--accent-primary-fg)]" />
                </div>
                <div>
                  <span className="font-extrabold text-travel-primary text-base block leading-tight">
                    Trip<span className="text-travel-accent">Mate</span>
                  </span>
                  <span className="text-[10px] text-travel-secondary font-mono truncate max-w-[130px] block">
                    {isAuthenticated ? user.name : 'Guest Traveler'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: Compass },
                { id: 'journeys', label: 'My Journeys', icon: Map },
                ...(activeJourney
                  ? [{ id: 'trip-details', label: 'Active Trip Workspace', icon: Navigation2 }]
                  : []),
                { id: 'insights', label: 'Travel Insights', icon: BarChart3 },
                { id: 'safety', label: 'Safety Center', icon: ShieldCheck },
                { id: 'saved-places', label: 'Saved Places', icon: Bookmark },
                { id: 'settings', label: 'Settings & Preferences', icon: Settings },
                { id: 'landing', label: 'Public Showcase', icon: Globe },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActivePage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition font-medium ${
                      isActive
                        ? 'bg-travel-accent-soft text-travel-accent font-bold border border-travel'
                        : 'text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-travel-accent' : 'text-travel-secondary'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-travel space-y-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logoutUser();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-travel-subtle hover:bg-rose-500/10 border border-travel text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl btn-travel-primary text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In for Cloud Sync</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 bg-travel-card/95 backdrop-blur-lg border border-travel rounded-2xl shadow-elevated px-2 py-1.5 flex items-center justify-around text-travel-primary">
        {primaryMobileNav.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-travel-accent font-bold bg-travel-accent-soft'
                  : 'text-travel-secondary hover:text-travel-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* More Drawer Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            isMobileMenuOpen || activePage === 'saved-places' || activePage === 'settings'
              ? 'text-travel-accent font-bold bg-travel-accent-soft'
              : 'text-travel-secondary hover:text-travel-primary'
          }`}
          title="More options"
          aria-label="More options"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
}
