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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[80vw] bg-[#0b1222] border-r border-slate-800 flex flex-col h-full z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black">
                  <Compass className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base block leading-tight">
                    Trip<span className="text-teal-400">Mate</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate max-w-[130px] block">
                    {isAuthenticated ? user.name : 'Guest Traveler'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
                  ? [{ id: 'trip-details', label: 'Active Trip Details', icon: Navigation2 }]
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
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logoutUser();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/60 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition"
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
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 bg-[#0c1424]/95 backdrop-blur-lg border border-slate-700/80 rounded-2xl shadow-2xl px-2 py-1.5 flex items-center justify-around">
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
                  ? 'text-teal-400 font-bold bg-teal-500/10'
                  : 'text-slate-400 hover:text-slate-200'
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
              ? 'text-teal-400 font-bold bg-teal-500/10'
              : 'text-slate-400 hover:text-slate-200'
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
