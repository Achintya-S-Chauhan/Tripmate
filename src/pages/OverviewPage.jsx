import React, { useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  Leaf,
  Navigation2,
  Play,
  Square,
  Check,
  Plus,
  Train,
  Footprints,
  Car,
  Ship,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function OverviewPage() {
  const {
    user,
    activeJourney,
    journeys,
    setActivePage,
    navigateToJourney,
    settings,
    summaryStats,
    journeyLiveState,
    startJourney,
    endJourney,
    advanceSegment,
    trustedContacts,
    savedPlaces,
  } = useApp();

  // Greeting based on client local time
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Distance formatting helper honoring distance unit preference
  const formatDistance = (km) => {
    const num = Number(km) || 0;
    if (settings.distanceUnit === 'mi') {
      const mi = Math.round(num * 0.621371);
      return `${mi.toLocaleString()} mi`;
    }
    return `${num.toLocaleString()} km`;
  };

  // Transport mode icon helper
  const getModeIcon = (modeType) => {
    switch (modeType) {
      case 'bullet_train':
      case 'train':
        return <Train className="w-3.5 h-3.5 text-teal-400" />;
      case 'walking':
        return <Footprints className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ferry':
        return <Ship className="w-3.5 h-3.5 text-amber-400" />;
      case 'car':
      case 'bus':
      default:
        return <Car className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Derive aggregate metrics from real journeys data or summaryStats fallback
  const calculatedMetrics = useMemo(() => {
    if (!journeys || journeys.length === 0) {
      return {
        totalDistanceKm: summaryStats?.totalDistanceKm || 0,
        totalHours: summaryStats?.totalTravelTimeHours || 0,
        totalCo2Saved: summaryStats?.totalCo2SavedKg || 0,
      };
    }

    let dist = 0;
    let co2 = 0;
    journeys.forEach((j) => {
      dist += Number(j.distanceKm) || 0;
      co2 += Number(j.co2SavedKg) || 0;
    });

    // If journey list has non-zero sums, use them; otherwise fall back to summaryStats
    const finalDist = dist > 0 ? dist : summaryStats?.totalDistanceKm || 0;
    const finalCo2 = co2 > 0 ? co2 : summaryStats?.totalCo2SavedKg || 0;
    const finalHours = summaryStats?.totalTravelTimeHours || 48.7;

    return {
      totalDistanceKm: finalDist,
      totalHours: finalHours,
      totalCo2Saved: finalCo2,
    };
  }, [journeys, summaryStats]);

  const travelSegments = activeJourney?.travelSegments || [];
  const currentSegmentIndex = journeyLiveState?.activeSegmentIndex || 0;
  const isJourneyActive = journeyLiveState?.status === 'in_progress';
  const currentLeg = travelSegments[currentSegmentIndex] || travelSegments[0];

  // Calculate percentage of journey completed
  const progressPercent = useMemo(() => {
    if (!travelSegments.length) return 0;
    if (!isJourneyActive) return 0;
    const completedFraction = (currentSegmentIndex + 0.5) / travelSegments.length;
    return Math.min(100, Math.round(completedFraction * 100));
  }, [travelSegments, currentSegmentIndex, isJourneyActive]);

  // Upcoming and recent journeys preview (up to 3 items)
  const recentList = useMemo(() => {
    if (!journeys || journeys.length === 0) return [];
    return journeys.slice(0, 3);
  }, [journeys]);

  return (
    <div className="space-y-6">
      {/* 1. Greeting & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {greetingText}, {user.name.split(' ')[0]} 👋
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Welcome to your travel command center. Here is your current mobility status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeJourney && isJourneyActive ? (
            <>
              <button
                type="button"
                onClick={advanceSegment}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Mark active leg complete and move to next waypoint"
              >
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Next Stop</span>
              </button>
              <button
                type="button"
                onClick={endJourney}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-600/25 active:scale-95"
                title="End current tracking session"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Journey</span>
              </button>
            </>
          ) : activeJourney ? (
            <button
              type="button"
              onClick={() => startJourney(activeJourney.id)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm tracking-wide transition flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Journey</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePage('journeys')}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>New Journey</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Active / Upcoming Journey Spotlight Card */}
      {activeJourney ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#0e1a2f] via-[#0b1626] to-[#08101d] border border-slate-700/70 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Spotlight Header: Status Badge & Route Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    isJourneyActive
                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isJourneyActive ? 'bg-teal-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {isJourneyActive ? 'Live In Progress' : 'Ready to Depart'}
                </span>

                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  {activeJourney.destination}
                </span>

                {activeJourney.dates && (
                  <span className="text-xs text-slate-500 font-mono hidden md:inline">
                    • {activeJourney.dates}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateToJourney(activeJourney.id)}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Route & Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spotlight Content: Trip Title & Origin ➔ Destination */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {activeJourney.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {user.homeCity || 'Origin'} ➔ {activeJourney.destination}
                  <span className="text-slate-500 ml-2 font-mono">
                    ({formatDistance(activeJourney.distanceKm || 38.9)} total)
                  </span>
                </p>
              </div>

              {/* Progress metric label */}
              {travelSegments.length > 0 && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Trip Chain Progress</span>
                  <span className="text-lg font-mono font-bold text-teal-400">
                    {isJourneyActive ? `${progressPercent}%` : 'Standby'}
                  </span>
                </div>
              )}
            </div>

            {/* Visual Progress Bar across trip segments */}
            {travelSegments.length > 0 && (
              <div className="space-y-2">
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Current Active Leg Description */}
                {currentLeg && (
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      {getModeIcon(currentLeg.modeType)}
                      <strong className="text-white">
                        Leg {currentSegmentIndex + 1} of {travelSegments.length}:
                      </strong>
                      <span>
                        {currentLeg.from} ➔ {currentLeg.to}
                      </span>
                    </span>

                    <span className="font-mono text-slate-400 text-[11px] hidden sm:inline">
                      {currentLeg.duration} • {formatDistance(currentLeg.distanceKm)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-3">
          <Compass className="w-10 h-10 text-teal-400 mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-white">No active journeys</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            You don't have an active trip planned yet. Create an expedition in My Journeys to start tracking multi-modal routes and carbon savings.
          </p>
          <button
            type="button"
            onClick={() => setActivePage('journeys')}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Your First Trip</span>
          </button>
        </div>
      )}

      {/* 3. Three Mint-Style Meaningful Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Distance */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
            <span>Total Tracked Distance</span>
            <Navigation2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatDistance(calculatedMetrics.totalDistanceKm)}
          </div>
          <div className="text-[11px] text-cyan-400/90 mt-2 flex items-center justify-between">
            <span>84% low-emission rail transit</span>
            <span className="text-slate-500 group-hover:text-cyan-300 transition">Insights →</span>
          </div>
        </div>

        {/* Metric 2: Total Transit Time */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
            <span>Total Travel Duration</span>
            <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {Math.floor(calculatedMetrics.totalHours)}h{' '}
            <span className="text-base font-normal text-slate-400">
              {Math.round((calculatedMetrics.totalHours % 1) * 60)}m
            </span>
          </div>
          <div className="text-[11px] text-emerald-400/90 mt-2 flex items-center justify-between">
            <span>Avg 3h 45m per journey</span>
            <span className="text-slate-500 group-hover:text-emerald-300 transition">Insights →</span>
          </div>
        </div>

        {/* Metric 3: Estimated CO2 Avoided */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 hover:border-teal-500/40 shadow-lg cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
            <span>Estimated CO₂ Avoided</span>
            <Leaf className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {calculatedMetrics.totalCo2Saved}{' '}
            <span className="text-base font-normal text-slate-400">kg CO₂</span>
          </div>
          <div className="text-[11px] text-teal-400/90 mt-2 flex items-center justify-between">
            <span>Calculated vs. short flights</span>
            <span className="text-slate-500 group-hover:text-teal-300 transition">Details →</span>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Lower Section: Recent Journeys + Safety Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left (3 cols): Recent & Upcoming Journeys */}
        <div className="lg:col-span-3 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                <span>Recent & Upcoming Journeys</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick access to your planned and active expeditions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActivePage('journeys')}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1"
            >
              <span>View All ({journeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentList.length > 0 ? (
            <div className="space-y-2.5">
              {recentList.map((j) => (
                <div
                  key={j.id || j._id}
                  onClick={() => navigateToJourney(j.id || j._id)}
                  className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-teal-500/30 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm group-hover:text-teal-300 transition truncate">
                        {j.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          j.status === 'active' || (activeJourney?.id === j.id && isJourneyActive)
                            ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                            : j.status === 'completed'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {j.status || 'Planned'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{j.destination}</span>
                      <span>•</span>
                      <span className="font-mono">{formatDistance(j.distanceKm || 38.9)}</span>
                      {j.co2SavedKg && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono">
                            -{j.co2SavedKg} kg CO₂
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              No journeys available. Click "New Journey" above to create one.
            </div>
          )}
        </div>

        {/* Right (2 cols): Safety & Corridor Summary */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Safety Hub Active
              </span>
              <h3 className="text-sm font-bold text-white">Emergency Readiness</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified travel safety protections and emergency channels.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">Trusted ICE Contacts</span>
                <span className="font-mono font-bold text-teal-300">
                  {trustedContacts?.length || 0} Synced
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">Saved Safe Places</span>
                <span className="font-mono font-bold text-teal-300">
                  {savedPlaces?.length || 0} Bookmarks
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-300">Local Emergency Numbers</span>
                <span className="font-mono font-bold text-white">
                  110 (Police) • 119 (Medical)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage('safety')}
            className="w-full py-2.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span>Open Safety Center & SOS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
