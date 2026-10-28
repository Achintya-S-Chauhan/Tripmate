import React, { useState, useMemo } from 'react';
import {
  Compass,
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Leaf,
  Navigation,
  Play,
  Square,
  Train,
  Footprints,
  Car,
  Ship,
  Zap,
  Check,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import InteractiveMap from '../components/map/InteractiveMap';
import Modal from '../components/common/Modal';
import {
  WEEKLY_TRAVEL_ACTIVITY,
  TRANSPORT_MODE_BREAKDOWN,
  TRAVEL_INSIGHTS_CARD,
  SUSTAINABLE_SUGGESTION,
} from '../data/mockData';

// Custom dark theme tooltip for charts
const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#0f172a] border border-slate-700/80 p-2.5 rounded-xl shadow-2xl text-xs space-y-1">
        <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
        <div className="flex items-center justify-between gap-3 text-slate-300">
          <span className="font-medium text-teal-400">{data.name}:</span>
          <span className="font-mono font-bold text-white">
            {data.value} {data.payload.unit || ''}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Transport mode icon helper
const getModeIcon = (mode) => {
  switch (mode) {
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

export default function OverviewPage() {
  const {
    user,
    activeJourney,
    setActivePage,
    navigateToJourney,
    settings,
    summaryStats,
    recentJourneys,
    journeyLiveState,
    startJourney,
    endJourney,
    advanceSegment,
    addToast,
  } = useApp();

  // Chart state & filters
  const [weeklyMetric, setWeeklyMetric] = useState('distance'); // 'distance' | 'hours' | 'co2'
  const [weeklyPeriod, setWeeklyPeriod] = useState('current'); // 'current' | 'previous'
  const [transportMetric, setTransportMetric] = useState('distance'); // 'distance' | 'trips' | 'co2'

  // Sustainable tip adoption state
  const [ecoTipAdopted, setEcoTipAdopted] = useState(false);

  // Detail Modals state
  const [selectedMetricModal, setSelectedMetricModal] = useState(null);
  const [selectedJourneyDetail, setSelectedJourneyDetail] = useState(null);

  // Personalized Greeting based on local time
  const [greetingText] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  // Distance formatting helper based on units
  const formatDistance = (km, mi) => {
    if (settings.distanceUnit === 'mi') {
      const val = mi !== undefined ? mi : Math.round(km * 0.621371);
      return `${val.toLocaleString()} mi`;
    }
    return `${km.toLocaleString()} km`;
  };

  // Weekly Chart Data computed from mockData based on active filters
  const weeklyChartData = useMemo(() => {
    const rawData =
      weeklyPeriod === 'current'
        ? WEEKLY_TRAVEL_ACTIVITY.currentWeek
        : WEEKLY_TRAVEL_ACTIVITY.previousWeek;

    return rawData.map((d) => {
      let val = d.distanceKm;
      let unit = 'km';

      if (weeklyMetric === 'distance') {
        val = settings.distanceUnit === 'mi' ? d.distanceMi : d.distanceKm;
        unit = settings.distanceUnit;
      } else if (weeklyMetric === 'hours') {
        val = d.hours;
        unit = 'hrs';
      } else if (weeklyMetric === 'co2') {
        val = d.co2SavedKg;
        unit = 'kg CO₂';
      }

      return {
        day: d.day,
        value: val,
        unit: unit,
      };
    });
  }, [weeklyPeriod, weeklyMetric, settings.distanceUnit]);

  // Transport Mode Breakdown Data based on active filter
  const transportModeData = useMemo(() => {
    if (transportMetric === 'trips') {
      return TRANSPORT_MODE_BREAKDOWN.byTrips;
    }
    if (transportMetric === 'co2') {
      return TRANSPORT_MODE_BREAKDOWN.byCo2;
    }
    return TRANSPORT_MODE_BREAKDOWN.byDistance.map((item) => ({
      ...item,
      value:
        settings.distanceUnit === 'mi'
          ? Math.round(item.value * 0.621371)
          : item.value,
      unit: settings.distanceUnit,
    }));
  }, [transportMetric, settings.distanceUnit]);

  // Waypoints for the route
  const waypoints = activeJourney?.waypoints || [];
  const originWaypoint = waypoints[0];
  const destinationWaypoint = waypoints[waypoints.length - 1];
  const intermediateWaypoints = waypoints.slice(1, -1);

  // Travel segments for active journey
  const travelSegments = activeJourney?.travelSegments || [];
  const currentSegmentIndex = journeyLiveState.activeSegmentIndex || 0;
  const isJourneyActive = journeyLiveState.status === 'in_progress';

  return (
    <div className="space-y-6">
      {/* 1. Header: Greeting & Prominent Start/End Journey Control */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#0d1c33] via-[#0f2442] to-[#0a182c] border border-slate-700/60 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm ${
                  isJourneyActive
                    ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isJourneyActive ? 'bg-teal-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {isJourneyActive ? 'Active Journey In Progress' : 'Journey Standby • Ready to Depart'}
              </span>

              <span className="text-xs text-slate-400 font-mono">
                {user.homeCity} → {activeJourney?.destination}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {greetingText}, {user.name} 👋
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {isJourneyActive ? (
                <>
                  Tracking live mobility for{' '}
                  <strong className="text-teal-300">{activeJourney?.title}</strong>. Started at{' '}
                  <span className="text-white font-mono font-semibold">{journeyLiveState.startTime}</span>.
                </>
              ) : (
                <>
                  Your next planned expedition is{' '}
                  <strong className="text-teal-300">{activeJourney?.title}</strong>. Tap "Start Journey" to initiate active route guidance.
                </>
              )}
            </p>
          </div>

          {/* Prominent Journey Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isJourneyActive ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={advanceSegment}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Mark current transit segment complete and advance to next stop"
                >
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>Advance Segment</span>
                </button>

                <button
                  type="button"
                  onClick={endJourney}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95"
                  title="Finalize demo journey and archive to recent journeys"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>End Journey</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startJourney(activeJourney?.id)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide transition flex items-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95"
                title="Start tracking this route and record departure time"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Journey</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Four Summary Cards (Clickable for Detailed Breakdown) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Journeys Completed */}
        <div
          onClick={() =>
            setSelectedMetricModal({
              title: 'Journeys Completed',
              metric: `${summaryStats.journeysCompleted} Journeys`,
              subtitle: 'Multi-modal expeditions successfully completed & archived',
              details: [
                { label: 'Completed Expeditions', value: summaryStats.journeysCompleted },
                { label: 'Completion Rate', value: '100%' },
                { label: 'This Month', value: '+3 journeys logged' },
                { label: 'Average Leg Duration', value: '3h 15m' },
              ],
              insight: 'Consistently maintaining safe transit logs across Japan, Switzerland, and Italy.',
            })
          }
          className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 hover:border-teal-500/50 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Journeys Completed</span>
            <Compass className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {summaryStats.journeysCompleted}
          </div>
          <div className="text-[11px] text-teal-400 mt-1 flex items-center justify-between">
            <span>+2 logged this month</span>
            <span className="text-slate-500 group-hover:text-teal-300 text-[10px]">Details →</span>
          </div>
        </div>

        {/* Card 2: Total Distance */}
        <div
          onClick={() =>
            setSelectedMetricModal({
              title: 'Total Tracked Distance',
              metric: formatDistance(summaryStats.totalDistanceKm),
              subtitle: 'Cumulative mobility distance recorded across all travel modes',
              details: [
                { label: 'High-Speed Rail', value: formatDistance(1280) },
                { label: 'Electric Metro & Tram', value: formatDistance(420) },
                { label: 'Walking & Hiking', value: formatDistance(142) },
                { label: 'Short Flight Relays', value: formatDistance(540) },
                { label: 'Ferry & Maritime', value: formatDistance(98) },
              ],
              insight: '84% of total distance achieved using low-emission rail transit.',
            })
          }
          className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 hover:border-teal-500/50 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Total Distance</span>
            <Navigation className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatDistance(summaryStats.totalDistanceKm)}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center justify-between">
            <span>84% low-emission rail</span>
            <span className="text-slate-500 group-hover:text-cyan-300 text-[10px]">Details →</span>
          </div>
        </div>

        {/* Card 3: Travel Time */}
        <div
          onClick={() =>
            setSelectedMetricModal({
              title: 'Total Travel & Transit Time',
              metric: `${Math.floor(summaryStats.totalTravelTimeHours)}h ${Math.round(
                (summaryStats.totalTravelTimeHours % 1) * 60
              )}m`,
              subtitle: 'Active transit and exploration duration across journeys',
              details: [
                { label: 'Transit / Motion Time', value: '44h 20m' },
                { label: 'Walking & Exploring', value: '24h 25m' },
                { label: 'Avg Expedition Time', value: '4h 12m' },
                { label: 'Off-Peak Time Savings', value: '5h 40m saved' },
              ],
              insight: 'Strategic off-peak departures reduced commuter transfer delays by 28%.',
            })
          }
          className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 hover:border-teal-500/50 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Travel Time</span>
            <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {Math.floor(summaryStats.totalTravelTimeHours)}h{' '}
            <span className="text-sm font-normal text-slate-400">
              {Math.round((summaryStats.totalTravelTimeHours % 1) * 60)}m
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-between">
            <span>Avg 4h 12m / journey</span>
            <span className="text-slate-500 group-hover:text-emerald-300 text-[10px]">Details →</span>
          </div>
        </div>

        {/* Card 4: Estimated CO2 Emissions */}
        <div
          onClick={() =>
            setSelectedMetricModal({
              title: 'Estimated CO₂ Emissions & Savings',
              metric: `${summaryStats.totalCo2SavedKg} kg CO₂ Saved`,
              subtitle: 'Emissions abated by substituting flights with electric rail',
              details: [
                { label: 'Emissions Abated', value: `${summaryStats.totalCo2SavedKg} kg CO₂` },
                { label: 'Gross Net Footprint', value: '64 kg CO₂' },
                { label: 'Equivalent Trees Planted', value: '18 trees' },
                { label: 'Eco Mobility Grade', value: 'Tier 1 Gold (A+)' },
              ],
              insight: 'Choosing Shinkansen bullet rail over domestic flights avoided 118 kg CO₂ on the Kansai route.',
            })
          }
          className="bg-[#0f172a] rounded-2xl p-4 border border-slate-800 hover:border-teal-500/50 shadow-md cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5 font-medium">
            <span>Estimated CO₂ Saved</span>
            <Leaf className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {summaryStats.totalCo2SavedKg}{' '}
            <span className="text-sm font-normal text-slate-400">kg CO₂</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center justify-between">
            <span>Eco Tier 1 Gold (A+)</span>
            <span className="text-slate-500 group-hover:text-emerald-300 text-[10px]">Details →</span>
          </div>
        </div>
      </div>

      {/* 3. Attractive Map Panel with Sample Route (Origin, Intermediate Stops, Destination) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-400" />
              Active Route Map: {activeJourney?.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sample route connecting Origin, intermediate stops, and final destination.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-teal-300 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              {formatDistance(38.9)} Total • {waypoints.length} Stops
            </span>
            <button
              onClick={() => navigateToJourney(activeJourney?.id)}
              className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
            >
              Full Details
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Origin / Intermediate / Destination Breadcrumb Header Strip */}
        <div className="bg-[#0f172a] px-4 py-2.5 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
            Origin
          </span>
          <span className="font-semibold text-white">{originWaypoint?.title || 'Kyoto Central'}</span>
          <span className="text-slate-500">➔</span>

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {intermediateWaypoints.length} Intermediate Stops
          </span>
          <span className="text-slate-400 text-[11px] hidden md:inline">
            ({intermediateWaypoints.map((w) => w.title).join(' • ')})
          </span>
          <span className="text-slate-500">➔</span>

          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Destination
          </span>
          <span className="font-semibold text-white">{destinationWaypoint?.title || 'Arashiyama'}</span>
        </div>

        {/* Embedded Leaflet Map with CartoDB/OpenStreetMap & Schematic Vector Fallback */}
        <InteractiveMap
          waypoints={waypoints}
          center={activeJourney?.center || [35.0116, 135.7681]}
          zoom={activeJourney?.zoom || 13}
          currentLocation={activeJourney?.currentLocation}
          height="400px"
          destinationTitle={`${originWaypoint?.title || 'Origin'} ➔ ${destinationWaypoint?.title || 'Destination'}`}
        />
      </div>

      {/* 4. Active Journey Panel (Demo Status & Travel Segments) */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Active Journey Panel
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isJourneyActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isJourneyActive ? `Segment ${currentSegmentIndex + 1} of ${travelSegments.length} In Transit` : 'Standby'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {activeJourney?.title}
            </h3>
            <p className="text-xs text-slate-400">
              {originWaypoint?.title} ➔ {destinationWaypoint?.title}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isJourneyActive ? (
              <button
                type="button"
                onClick={advanceSegment}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Complete Segment & Advance</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startJourney(activeJourney?.id)}
                className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Journey</span>
              </button>
            )}
          </div>
        </div>

        {/* Travel Segments Progress */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {travelSegments.map((segment, idx) => {
              const isPast = isJourneyActive ? idx < currentSegmentIndex : false;
              const isCurrent = isJourneyActive ? idx === currentSegmentIndex : false;

              return (
                <div
                  key={segment.id}
                  className={`rounded-xl p-4 border transition-all ${
                    isCurrent
                      ? 'bg-teal-950/30 border-teal-500/60 ring-2 ring-teal-500/20 shadow-lg'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-slate-900/40 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      Leg {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCurrent ? 'ACTIVE' : isPast ? 'COMPLETED' : 'SCHEDULED'}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white truncate mb-1">
                    {segment.from}
                  </div>
                  <div className="text-[11px] text-teal-300 truncate mb-2">
                    ➔ {segment.to}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-300">
                        {getModeIcon(segment.modeType)}
                        <span className="truncate max-w-[110px]">{segment.mode}</span>
                      </span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {formatDistance(segment.distanceKm, segment.distanceMi)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span>Duration: {segment.duration}</span>
                      <span className="text-emerald-400">-{segment.co2SavedKg} kg CO₂</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Recent Journeys List */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              Recent Journeys History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Archive of completed expedition legs with verified transport modalities and metrics.
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {recentJourneys.length} Completed Records
          </span>
        </div>

        {/* Recent Journeys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5 font-semibold">Date</th>
                <th className="pb-2.5 font-semibold">Destination / Route</th>
                <th className="pb-2.5 font-semibold">Distance</th>
                <th className="pb-2.5 font-semibold">Duration</th>
                <th className="pb-2.5 font-semibold">Transport Modes</th>
                <th className="pb-2.5 font-semibold">CO₂ Offset</th>
                <th className="pb-2.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentJourneys.map((rj) => (
                <tr
                  key={rj.id}
                  onClick={() => setSelectedJourneyDetail(rj)}
                  className="hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <td className="py-3 text-slate-300 font-mono text-[11px]">{rj.date}</td>
                  <td className="py-3">
                    <div className="font-bold text-white group-hover:text-teal-300 transition">
                      {rj.title}
                    </div>
                    <div className="text-[11px] text-slate-400">{rj.destination}</div>
                  </td>
                  <td className="py-3 font-mono font-semibold text-slate-200">
                    {formatDistance(rj.distanceKm, rj.distanceMi)}
                  </td>
                  <td className="py-3 text-slate-300 font-mono">{rj.duration}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      {rj.transportModes?.map((m, i) => (
                        <span
                          key={i}
                          className="p-1 rounded-md bg-slate-800 border border-slate-700/60"
                          title={m}
                        >
                          {getModeIcon(m)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 font-mono text-emerald-400">-{rj.co2SavedKg} kg</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {rj.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Recharts Row: Weekly Activity Chart & Transport Mode Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Travel Activity (2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Weekly Travel Activity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily mobility telemetry across current vs previous cycle.
              </p>
            </div>

            {/* Chart Control Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Metric filter */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                <button
                  type="button"
                  onClick={() => setWeeklyMetric('distance')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    weeklyMetric === 'distance'
                      ? 'bg-teal-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Distance
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyMetric('hours')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    weeklyMetric === 'hours'
                      ? 'bg-teal-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyMetric('co2')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    weeklyMetric === 'co2'
                      ? 'bg-teal-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CO₂ Saved
                </button>
              </div>

              {/* Period filter */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center">
                <button
                  type="button"
                  onClick={() => setWeeklyPeriod('current')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    weeklyPeriod === 'current'
                      ? 'bg-slate-800 text-teal-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyPeriod('previous')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    weeklyPeriod === 'previous'
                      ? 'bg-slate-800 text-teal-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Last Week
                </button>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="value"
                  name={
                    weeklyMetric === 'distance'
                      ? `Distance (${settings.distanceUnit})`
                      : weeklyMetric === 'hours'
                      ? 'Hours'
                      : 'CO₂ Saved (kg)'
                  }
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transport Mode Breakdown (1 col) */}
        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Transport Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">Mobility share by modality</p>
            </div>

            {/* Filter buttons */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setTransportMetric('distance')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  transportMetric === 'distance'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dist
              </button>
              <button
                type="button"
                onClick={() => setTransportMetric('trips')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  transportMetric === 'trips'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trips
              </button>
              <button
                type="button"
                onClick={() => setTransportMetric('co2')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  transportMetric === 'co2'
                    ? 'bg-teal-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CO₂
              </button>
            </div>
          </div>

          {/* Donut Pie Chart */}
          <div className="h-40 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transportModeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {transportModeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Items */}
          <div className="space-y-1.5 pt-1">
            {transportModeData.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 font-medium truncate max-w-[140px]">{cat.name}</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {cat.value} {cat.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Contextual Travel Insight Card & Sustainable Travel Suggestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contextual Travel Insight */}
        <div
          onClick={() => setActivePage('insights')}
          className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 cursor-pointer hover:border-teal-500/50 hover:bg-slate-900/60 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-teal-400" />
              {TRAVEL_INSIGHTS_CARD.title}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                {TRAVEL_INSIGHTS_CARD.stat}
              </span>
              <span className="text-[10px] text-teal-400 group-hover:translate-x-0.5 transition hidden sm:inline">
                Open Insights →
              </span>
            </div>
          </div>

          <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition">
            {TRAVEL_INSIGHTS_CARD.headline}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {TRAVEL_INSIGHTS_CARD.description}
          </p>

          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800 font-mono flex items-center justify-between">
            <span>Category: {TRAVEL_INSIGHTS_CARD.category}</span>
            <span className="text-teal-400">View Full Analytics</span>
          </div>
        </div>

        {/* Sustainable Travel Suggestion */}
        <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-400" />
              {SUSTAINABLE_SUGGESTION.title}
            </span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
              Avoids {SUSTAINABLE_SUGGESTION.co2Savings}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white">
            {SUSTAINABLE_SUGGESTION.headline}
          </h4>

          <p className="text-xs text-slate-300 leading-relaxed">
            {SUSTAINABLE_SUGGESTION.description}
          </p>

          <div className="pt-2 flex items-center justify-between">
            {ecoTipAdopted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                <Check className="w-4 h-4" />
                Suggestion Adopted ✓ Saved 4.6 kg CO₂
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEcoTipAdopted(true);
                  addToast('Eco Suggestion Adopted', 'Arashiyama leg route updated to Keifuku Randen Tramway. 4.6 kg CO₂ saved!', 'success');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>{SUSTAINABLE_SUGGESTION.recommendedAction}</span>
              </button>
            )}

            <span className="text-[10px] text-slate-500 font-mono">Verified Eco-Route</span>
          </div>
        </div>
      </div>

      {/* 8. Safety Status Indicator & Clear Route to Safety Center */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0d1e38] to-slate-900 rounded-2xl p-5 border border-slate-700/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Safety Corridor: Verified Safe
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Japan Kansai Transit Corridor (Level 1)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-snug">
            Emergency contacts verified. Local dispatch hotlines active: <strong>110 (Police)</strong> and <strong>119 (Ambulance)</strong>. ICE vault encrypted.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('safety')}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 shrink-0 active:scale-95"
        >
          <span>Open Safety Center & Emergency Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Card Detail Modal */}
      {selectedMetricModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMetricModal(null)}
          title={selectedMetricModal.title}
          subtitle={selectedMetricModal.subtitle}
        >
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                Metric Snapshot
              </span>
              <span className="text-3xl font-black text-teal-400 font-mono">
                {selectedMetricModal.metric}
              </span>
            </div>

            <div className="space-y-2">
              {selectedMetricModal.details.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs"
                >
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-mono font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs text-slate-300 leading-relaxed">
              <strong>Telemetry Context:</strong> {selectedMetricModal.insight}
            </div>

            <button
              type="button"
              onClick={() => setSelectedMetricModal(null)}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
            >
              Close Snapshot
            </button>
          </div>
        </Modal>
      )}

      {/* Recent Journey Detail Modal */}
      {selectedJourneyDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJourneyDetail(null)}
          title={selectedJourneyDetail.title}
          subtitle={`${selectedJourneyDetail.destination} • Logged on ${selectedJourneyDetail.date}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatDistance(selectedJourneyDetail.distanceKm, selectedJourneyDetail.distanceMi)}
                </span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
                <span className="font-mono font-bold text-teal-400 text-sm">
                  {selectedJourneyDetail.duration}
                </span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">CO₂ Abated</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  -{selectedJourneyDetail.co2SavedKg} kg
                </span>
              </div>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
              <span className="text-slate-400 font-semibold block">Expedition Route Notes</span>
              <p className="text-slate-300 leading-relaxed">
                {selectedJourneyDetail.notes}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400 font-mono text-[11px]">Status: Verified Completed</span>
              <button
                type="button"
                onClick={() => setSelectedJourneyDetail(null)}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
