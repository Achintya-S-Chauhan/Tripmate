import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Compass,
  ShieldAlert,
  BarChart2,
  Bookmark,
  Settings,
  ArrowRight,
  PhoneCall,
  Calendar,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EMBASSIES_DIRECTORY, TRAVEL_ADVISORIES } from '../../data/mockData';

export default function QuickSearchModal() {
  const {
    isSearchOpen,
    setIsSearchOpen,
    journeys,
    savedPlaces,
    setActivePage,
    navigateToJourney,
    startSosSimulation,
  } = useApp();

  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default recommended quick jumps
      return [
        { type: 'page', title: 'Overview Dashboard', subtitle: 'Live telemetry, active trip status, metrics', icon: Compass, action: () => { setActivePage('overview'); setIsSearchOpen(false); } },
        { type: 'page', title: 'My Journeys', subtitle: 'View all active, upcoming and past trips', icon: Calendar, action: () => { setActivePage('journeys'); setIsSearchOpen(false); } },
        { type: 'page', title: 'Safety Center & SOS', subtitle: 'Emergency ICE vault, embassy contacts, safety checklists', icon: ShieldAlert, action: () => { setActivePage('safety'); setIsSearchOpen(false); } },
        { type: 'page', title: 'Travel Insights', subtitle: 'Spending trends, carbon analytics, mobility mix', icon: BarChart2, action: () => { setActivePage('insights'); setIsSearchOpen(false); } },
        { type: 'page', title: 'Saved Places & Sights', subtitle: 'Bookmarked restaurants, viewpoints, transit hubs', icon: Bookmark, action: () => { setActivePage('saved-places'); setIsSearchOpen(false); } },
      ];
    }

    const results = [];

    // Search Journeys
    journeys.forEach((j) => {
      if (
        j.title.toLowerCase().includes(q) ||
        j.destination.toLowerCase().includes(q) ||
        j.summary.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'journey',
          title: j.title,
          subtitle: `${j.destination} • ${j.status} • ${j.totalDays} Days`,
          icon: Compass,
          action: () => {
            navigateToJourney(j.id);
            setIsSearchOpen(false);
          },
        });
      }
    });

    // Search Saved Places
    savedPlaces.forEach((sp) => {
      if (
        sp.name.toLowerCase().includes(q) ||
        sp.city.toLowerCase().includes(q) ||
        sp.category.toLowerCase().includes(q) ||
        sp.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        results.push({
          type: 'place',
          title: sp.name,
          subtitle: `${sp.city}, ${sp.country} • ${sp.category} • ⭐ ${sp.rating}`,
          icon: MapPin,
          action: () => {
            setActivePage('saved-places');
            setIsSearchOpen(false);
          },
        });
      }
    });

    // Search Embassies
    EMBASSIES_DIRECTORY.forEach((emb) => {
      if (
        emb.country.toLowerCase().includes(q) ||
        emb.city.toLowerCase().includes(q) ||
        emb.representation.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'embassy',
          title: `${emb.representation} (${emb.country})`,
          subtitle: `24/7 Hotline: ${emb.hotline24h}`,
          icon: PhoneCall,
          action: () => {
            setActivePage('safety');
            setIsSearchOpen(false);
          },
        });
      }
    });

    // Quick Action matches
    if ('sos emergency alert simulator'.includes(q)) {
      results.push({
        type: 'action',
        title: 'Trigger Emergency SOS Simulator',
        subtitle: 'Initiate 5-second cancelable emergency broadcast demo',
        icon: ShieldAlert,
        action: () => {
          setIsSearchOpen(false);
          startSosSimulation();
        },
      });
    }

    return results;
  }, [query, journeys, savedPlaces, setActivePage, navigateToJourney, startSosSimulation, setIsSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={() => setIsSearchOpen(false)}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <Search className="w-5 h-5 text-teal-400 shrink-0 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journeys, places, embassy hotlines, or safety vault... (Ctrl+K)"
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching journeys, places, or safety entries found for "{query}".
            </div>
          ) : (
            searchResults.map((item, idx) => {
              const Icon = item.icon || Compass;
              return (
                <div
                  key={idx}
                  onClick={item.action}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition group border border-transparent hover:border-slate-700/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-teal-400 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 shrink-0 ml-3 transition transform group-hover:translate-x-1" />
                </div>
              );
            })
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with click • Press ESC to close</span>
          <span className="text-teal-400">TripMate Search</span>
        </div>
      </div>
    </div>
  );
}
