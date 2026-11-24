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
  Bike,
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
    if (settings?.distanceUnit === 'mi') {
      const mi = (num * 0.621371).toFixed(1);
      return `${parseFloat(mi).toLocaleString()} mi`;
    }
    const cleanKm = Number.isInteger(num)
      ? num.toLocaleString()
      : num.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${cleanKm} km`;
  };

  // Transport mode icon helper with natural earthy tones
  const getModeIcon = (modeType) => {
    const m = (modeType || '').toLowerCase();
    if (m.includes('bullet') || m.includes('train') || m.includes('rail') || m.includes('metro')) {
      return <Train className="w-3.5 h-3.5 text-travel-accent" />;
    }
    if (m.includes('walk') || m.includes('foot') || m.includes('pedestrian')) {
      return <Footprints className="w-3.5 h-3.5 text-travel-accent" />;
    }
    if (m.includes('bike') || m.includes('bicycle')) {
      return <Bike className="w-3.5 h-3.5 text-travel-accent" />;
    }
    if (m.includes('ferry') || m.includes('boat') || m.includes('ship')) {
      return <Ship className="w-3.5 h-3.5 text-travel-terracotta" />;
    }
    return <Car className="w-3.5 h-3.5 text-travel-secondary" />;
  };

  // Derive aggregate metrics strictly from authenticated user's actual journey data and segments
  const calculatedMetrics = useMemo(() => {
    if (!journeys || journeys.length === 0) {
      return {
        totalDistanceKm: 0,
        totalHours: 0,
        totalCo2Saved: 0,
        completedCount: 0,
        inProgressCount: 0,
        upcomingCount: 0,
        draftCount: 0,
      };
    }

    let dist = 0;
    let durMinutes = 0;
    let co2 = 0;
    let completed = 0;
    let inProgress = 0;
    let upcoming = 0;
    let draft = 0;

    journeys.forEach((j) => {
      const segs = j.segments || j.travelSegments || [];
      const jDist =
        segs.length > 0
          ? segs.reduce((sum, s) => sum + (Number(s.distanceKm) || 0), 0)
          : Number(j.totalDistanceKm != null ? j.totalDistanceKm : j.distanceKm) || 0;

      const jDur =
        segs.length > 0
          ? segs.reduce((sum, s) => sum + (parseInt(s.durationMinutes, 10) || 0), 0)
          : Number(j.totalDurationMinutes != null ? j.totalDurationMinutes : j.durationMinutes) || 0;

      const jCo2 =
        segs.length > 0
          ? segs.reduce((sum, s) => sum + (Number(s.co2SavedKg) || 0), 0)
          : Number(j.estimatedCo2Kg != null ? j.estimatedCo2Kg : j.co2SavedKg) || jDist * 0.18;

      dist += jDist;
      durMinutes += jDur;
      co2 += jCo2;

      const status = (j.status || '').toLowerCase();
      if (status === 'completed') completed++;
      else if (status === 'in progress' || status === 'in_progress' || status === 'active')
        inProgress++;
      else if (status === 'draft') draft++;
      else upcoming++;
    });

    return {
      totalDistanceKm: parseFloat(dist.toFixed(1)),
      totalHours: parseFloat((durMinutes / 60).toFixed(1)),
      totalCo2Saved: parseFloat(co2.toFixed(1)),
      completedCount: completed,
      inProgressCount: inProgress,
      upcomingCount: upcoming,
      draftCount: draft,
    };
  }, [journeys]);

  const travelSegments = activeJourney?.segments || activeJourney?.travelSegments || [];
  const currentSegmentIndex = journeyLiveState?.activeSegmentIndex || 0;

  const isJourneyActive = Boolean(
    activeJourney &&
      (activeJourney.status === 'In Progress' ||
        activeJourney.status === 'in_progress' ||
        activeJourney.status === 'Active' ||
        (journeyLiveState?.status === 'in_progress' &&
          (journeyLiveState?.journeyId === activeJourney.id ||
            journeyLiveState?.journeyId === activeJourney._id)))
  );

  const isJourneyCompleted = Boolean(
    activeJourney &&
      !isJourneyActive &&
      (activeJourney.status === 'Completed' || activeJourney.status === 'completed')
  );

  const currentLeg = travelSegments[currentSegmentIndex] || travelSegments[0];

  // Derive total distance strictly from active journey's segments (or fallback totalDistanceKm)
  const activeJourneyTotalDist = useMemo(() => {
    if (!activeJourney) return 0;
    if (travelSegments.length > 0) {
      return parseFloat(
        travelSegments.reduce((sum, s) => sum + (Number(s.distanceKm) || 0), 0).toFixed(1)
      );
    }
    return Number(
      activeJourney.totalDistanceKm != null
        ? activeJourney.totalDistanceKm
        : activeJourney.distanceKm || 0
    );
  }, [activeJourney, travelSegments]);

  // Derive progress strictly from completed segments count vs total segments
  const { completedSegmentsCount, progressPercent } = useMemo(() => {
    if (!travelSegments.length) return { completedSegmentsCount: 0, progressPercent: 0 };
    if (isJourneyCompleted) {
      return { completedSegmentsCount: travelSegments.length, progressPercent: 100 };
    }
    if (!isJourneyActive) {
      return { completedSegmentsCount: 0, progressPercent: 0 }; // Standby journeys show 0%
    }
    const completedCount = Math.min(travelSegments.length, Math.max(0, currentSegmentIndex));
    const percent = Math.round((completedCount / travelSegments.length) * 100);
    return { completedSegmentsCount: completedCount, progressPercent: percent };
  }, [travelSegments, currentSegmentIndex, isJourneyActive, isJourneyCompleted]);

  // Upcoming and recent journeys preview (up to 3 items)
  const recentList = useMemo(() => {
    if (!journeys || journeys.length === 0) return [];
    return journeys.slice(0, 3);
  }, [journeys]);

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* 1. Greeting & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-travel">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-travel-primary tracking-tight">
            {greetingText}, {user?.name ? user.name.split(' ')[0] : 'Traveler'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-travel-secondary mt-1">
            Welcome to your travel planning command center.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {activeJourney && isJourneyActive ? (
            <>
              <button
                type="button"
                onClick={advanceSegment}
                className="px-4 py-2 rounded-xl bg-travel-card hover:bg-travel-card-hover text-travel-accent border border-travel font-semibold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Mark active leg complete and move to next waypoint"
              >
                <Check className="w-3.5 h-3.5 text-travel-accent" />
                <span>Next Stop</span>
              </button>
              <button
                type="button"
                onClick={endJourney}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="End current tracking session"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Journey</span>
              </button>
            </>
          ) : activeJourney && isJourneyCompleted ? (
            <button
              type="button"
              onClick={() => navigateToJourney(activeJourney.id || activeJourney._id)}
              className="px-4 py-2 rounded-xl bg-travel-card hover:bg-travel-card-hover text-travel-accent border border-travel font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-travel-accent" />
              <span>Completed Expedition</span>
            </button>
          ) : activeJourney ? (
            <button
              type="button"
              onClick={() => startJourney(activeJourney.id || activeJourney._id)}
              className="px-5 py-2.5 rounded-xl btn-travel-primary text-xs sm:text-sm tracking-wide transition flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Journey</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActivePage('journeys')}
              className="px-4 py-2 rounded-xl btn-travel-primary text-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Journey</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Journey Spotlight Card */}
      {activeJourney ? (
        <div className="rounded-3xl bg-travel-card border border-travel p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <div className="space-y-5">
            {/* Spotlight Header: Status Badge & Route Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-travel pb-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    isJourneyActive
                      ? 'bg-travel-accent-soft border-travel text-travel-accent shadow-sm'
                      : isJourneyCompleted
                      ? 'bg-travel-subtle border-travel text-travel-secondary'
                      : 'bg-travel-subtle text-travel-secondary border-travel'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isJourneyActive
                        ? 'bg-[var(--accent-primary)] animate-pulse'
                        : isJourneyCompleted
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-travel-secondary'
                    }`}
                  />
                  {isJourneyActive ? 'Live In Progress' : isJourneyCompleted ? 'Completed' : 'Ready to Depart'}
                </span>

                <span className="text-xs text-travel-secondary font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-travel-accent" />
                  {activeJourney.destination}
                </span>

                {activeJourney.travelDate && (
                  <span className="text-xs text-travel-muted font-mono hidden md:inline">
                    • {activeJourney.travelDate}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigateToJourney(activeJourney.id || activeJourney._id)}
                className="text-xs font-bold text-travel-accent hover:underline transition flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Route & Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Spotlight Content: Trip Title & Origin ➔ Destination */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-travel-primary tracking-tight">
                  {activeJourney.title}
                </h3>
                <p className="text-xs sm:text-sm text-travel-secondary">
                  {activeJourney.origin || activeJourney.waypoints?.[0]?.title || 'Origin'} ➔{' '}
                  {activeJourney.destination}
                  <span className="text-travel-muted ml-2 font-mono">
                    ({formatDistance(activeJourneyTotalDist)} total)
                  </span>
                </p>
              </div>

              {/* Progress metric label */}
              {travelSegments.length > 0 && (
                <div className="text-right">
                  <span className="text-xs text-travel-secondary block font-medium">Trip Progress</span>
                  <span className="text-lg font-mono font-bold text-travel-accent">
                    {isJourneyActive
                      ? `${progressPercent}%`
                      : isJourneyCompleted
                      ? '100%'
                      : 'Standby (0%)'}
                  </span>
                </div>
              )}
            </div>

            {/* Visual Progress Bar across trip segments */}
            {travelSegments.length > 0 && (
              <div className="space-y-2">
                <div className="w-full h-2 rounded-full bg-travel-subtle overflow-hidden p-0.5 border border-travel">
                  <div
                    className="h-full rounded-full bg-travel-accent transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Current Active Leg Description */}
                {currentLeg && (
                  <div className="flex items-center justify-between text-xs text-travel-secondary">
                    <span className="flex items-center gap-1.5">
                      {getModeIcon(currentLeg.modeType || currentLeg.type)}
                      <strong className="text-travel-primary">
                        {isJourneyCompleted
                          ? `All ${travelSegments.length} legs finalized`
                          : `Leg ${currentSegmentIndex + 1} of ${travelSegments.length}:`}
                      </strong>
                      <span>
                        {currentLeg.from || currentLeg.origin} ➔{' '}
                        {currentLeg.to || currentLeg.destination}
                      </span>
                    </span>

                    <span className="font-mono text-travel-muted text-[11px] hidden sm:inline">
                      {currentLeg.duration} • {formatDistance(currentLeg.distanceKm)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-travel-card border border-travel p-8 text-center space-y-3 shadow-sm">
          <Compass className="w-10 h-10 text-travel-accent mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-travel-primary">No active journeys</h3>
          <p className="text-xs sm:text-sm text-travel-secondary max-w-md mx-auto">
            You don't have an active trip planned yet. Create an expedition in My Journeys to start
            planning multi-modal routes, stays, and expenses.
          </p>
          <button
            type="button"
            onClick={() => setActivePage('journeys')}
            className="px-4 py-2 rounded-xl btn-travel-primary text-xs transition inline-flex items-center gap-1.5 mt-2 active:scale-95"
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
          className="bg-travel-card rounded-2xl p-5 border border-travel hover:border-travel-strong shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-travel-secondary text-xs mb-2 font-medium">
            <span>Total Tracked Distance</span>
            <Navigation2 className="w-4 h-4 text-travel-accent group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-travel-primary font-mono tracking-tight">
            {formatDistance(calculatedMetrics.totalDistanceKm)}
          </div>
          <div className="text-[11px] text-travel-secondary mt-2 flex items-center justify-between">
            <span>
              {calculatedMetrics.inProgressCount} in progress • {calculatedMetrics.completedCount} completed
            </span>
            <span className="text-travel-accent font-semibold group-hover:underline transition">Insights →</span>
          </div>
        </div>

        {/* Metric 2: Total Transit Time */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-travel-card rounded-2xl p-5 border border-travel hover:border-travel-strong shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-travel-secondary text-xs mb-2 font-medium">
            <span>Total Travel Duration</span>
            <Clock className="w-4 h-4 text-travel-terracotta group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-travel-primary font-mono tracking-tight">
            {Math.floor(calculatedMetrics.totalHours)}h{' '}
            <span className="text-base font-normal text-travel-secondary">
              {Math.round((calculatedMetrics.totalHours % 1) * 60)}m
            </span>
          </div>
          <div className="text-[11px] text-travel-secondary mt-2 flex items-center justify-between">
            <span>
              {journeys.length} total expedition{journeys.length === 1 ? '' : 's'}
            </span>
            <span className="text-travel-terracotta font-semibold group-hover:underline transition">Insights →</span>
          </div>
        </div>

        {/* Metric 3: Estimated CO2 Avoided */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-travel-card rounded-2xl p-5 border border-travel hover:border-travel-strong shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-travel-secondary text-xs mb-2 font-medium">
            <span>Estimated CO₂ Avoided</span>
            <Leaf className="w-4 h-4 text-travel-accent group-hover:scale-105 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-travel-primary font-mono tracking-tight">
            {calculatedMetrics.totalCo2Saved.toFixed(1)}{' '}
            <span className="text-base font-normal text-travel-secondary">kg CO₂</span>
          </div>
          <div className="text-[11px] text-travel-secondary mt-2 flex items-center justify-between">
            <span>Calculated vs. car baseline</span>
            <span className="text-travel-accent font-semibold group-hover:underline transition">Details →</span>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Lower Section: Recent Journeys + Safety Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left (3 cols): Recent & Upcoming Journeys */}
        <div className="lg:col-span-3 bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-travel pb-3">
            <div>
              <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-travel-accent" />
                <span>Recent & Upcoming Journeys</span>
              </h3>
              <p className="text-xs text-travel-secondary mt-0.5">
                Quick access to your planned and active expeditions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActivePage('journeys')}
              className="text-xs font-bold text-travel-accent hover:underline transition flex items-center gap-1"
            >
              <span>View All ({journeys.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentList.length > 0 ? (
            <div className="space-y-2.5">
              {recentList.map((j) => {
                const segs = j.segments || j.travelSegments || [];
                const legsCount = segs.length;
                const staysCount = j.stays?.length || 0;
                const placesCount = j.places?.length || 0;
                const jDist =
                  segs.length > 0
                    ? segs.reduce((sum, s) => sum + (Number(s.distanceKm) || 0), 0)
                    : Number(j.totalDistanceKm != null ? j.totalDistanceKm : j.distanceKm) || 0;
                const jCo2 = Number(j.estimatedCo2Kg != null ? j.estimatedCo2Kg : j.co2SavedKg);
                const isCurrentLive =
                  (activeJourney?.id === j.id || activeJourney?._id === j._id) && isJourneyActive;

                return (
                  <div
                    key={j.id || j._id}
                    onClick={() => navigateToJourney(j.id || j._id)}
                    className="p-3.5 rounded-xl bg-travel-subtle hover:bg-travel-card-hover border border-travel transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-travel-primary text-xs sm:text-sm group-hover:text-travel-accent transition truncate">
                          {j.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCurrentLive || j.status === 'In Progress' || j.status === 'Active'
                              ? 'bg-travel-accent-soft text-travel-accent border border-travel'
                              : j.status === 'Completed' || j.status === 'completed'
                              ? 'bg-travel-card text-travel-secondary border border-travel'
                              : 'bg-travel-accent-soft text-travel-accent border border-travel'
                          }`}
                        >
                          {j.status || 'Planned'}
                        </span>
                      </div>

                      <div className="text-[11px] text-travel-secondary flex items-center gap-2 flex-wrap">
                        <span>{j.destination}</span>
                        <span>•</span>
                        <span className="font-mono">{formatDistance(jDist)}</span>
                        {legsCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{legsCount} leg{legsCount === 1 ? '' : 's'}</span>
                          </>
                        )}
                        {staysCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{staysCount} stay{staysCount === 1 ? '' : 's'}</span>
                          </>
                        )}
                        {placesCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{placesCount} place{placesCount === 1 ? '' : 's'}</span>
                          </>
                        )}
                        {jCo2 != null && !isNaN(jCo2) && jCo2 > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-travel-accent font-mono">
                              -{jCo2.toFixed(1)} kg CO₂
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-travel-secondary group-hover:text-travel-accent group-hover:translate-x-0.5 transition shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-travel-secondary text-xs">
              No journeys available. Click "New Journey" above to create one.
            </div>
          )}
        </div>

        {/* Right (2 cols): Safety & Readiness Summary */}
        <div className="lg:col-span-2 bg-travel-card rounded-2xl p-6 border border-travel shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-travel pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-travel-accent-soft text-travel-accent border border-travel text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-travel-accent" />
                Safety & Readiness Hub
              </span>
              <h3 className="text-sm font-bold text-travel-primary">Emergency Readiness</h3>
              <p className="text-xs text-travel-secondary mt-0.5">
                Simulated emergency readiness tools, emergency reference, and trusted contacts.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-travel-subtle border border-travel">
                <span className="text-travel-secondary">Trusted ICE Contacts</span>
                <span className="font-mono font-bold text-travel-accent">
                  {trustedContacts?.length || 0} Synced
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-travel-subtle border border-travel">
                <span className="text-travel-secondary">Saved Safe Places</span>
                <span className="font-mono font-bold text-travel-accent">
                  {savedPlaces?.length || 0} Bookmarks
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-travel-subtle border border-travel">
                <span className="text-travel-secondary">Unified Emergency Line</span>
                <span className="font-mono font-bold text-travel-primary">
                  112 (National Unified)
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivePage('safety')}
            className="w-full py-2.5 px-3 rounded-xl btn-travel-secondary text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Open Safety Center & SOS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
