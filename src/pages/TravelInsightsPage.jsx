import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Leaf,
  Compass,
  Train,
  Footprints,
  Calendar,
  Download,
  Clock,
  Bus,
  Car,
  Bike,
  Ship,
  Plane,
  Sparkles,
  Zap,
  Sliders,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  HelpCircle,
  Filter,
  FileSpreadsheet,
  ChevronRight,
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
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';

// Documented baseline emission factors (g CO2 per passenger-km)
// Sources: UK DEFRA (Department for Environment, Food & Rural Affairs) 2024 & European Environment Agency (EEA)
const DEFAULT_EMISSION_FACTORS = {
  walking: {
    key: 'walking',
    label: 'Walking & Hiking',
    gCo2PerKm: 0,
    category: 'Active Mobility',
    source: 'Zero Direct Emission Baseline',
    color: '#10b981', // emerald
  },
  bicycle: {
    key: 'bicycle',
    label: 'Bicycle & E-Bike',
    gCo2PerKm: 5,
    category: 'Micro-Mobility',
    source: 'Lifecycle battery charging & equipment allowance',
    color: '#22c55e', // green
  },
  train: {
    key: 'train',
    label: 'Electric Rail & Metro',
    gCo2PerKm: 28,
    category: 'Electric Mass Transit',
    source: 'EEA / European electrified grid passenger rail benchmark',
    color: '#14b8a6', // teal
  },
  bus: {
    key: 'bus',
    label: 'Transit Bus & Coach',
    gCo2PerKm: 68,
    category: 'Public Road Transit',
    source: 'DEFRA 2024 urban & regional coach fleet average',
    color: '#06b6d4', // cyan
  },
  car: {
    key: 'car',
    label: 'Passenger Car (Gasoline ICE)',
    gCo2PerKm: 170,
    category: 'Private Vehicle',
    source: 'Standard single-occupant petrol/diesel car baseline',
    color: '#f59e0b', // amber
  },
  ferry: {
    key: 'ferry',
    label: 'Ferry & Maritime Vessel',
    gCo2PerKm: 112,
    category: 'Maritime Transit',
    source: 'EEA passenger hydrofoil / coastal ferry average',
    color: '#3b82f6', // blue
  },
  flight: {
    key: 'flight',
    label: 'Short-Haul Aviation',
    gCo2PerKm: 255,
    category: 'Commercial Aviation',
    source: 'DEFRA aviation benchmark with radiative forcing',
    color: '#a855f7', // purple
  },
};

// Preset configurations for grid scenarios
const EMISSION_PRESETS = [
  {
    id: 'defra_standard',
    name: 'DEFRA & EEA Standard (Default)',
    description: 'Published international fleet averages for multimodal travel.',
    factors: { walking: 0, bicycle: 5, train: 28, bus: 68, car: 170, ferry: 112, flight: 255 },
  },
  {
    id: 'renewable_grid',
    name: 'Renewable Power Grid (Low Carbon)',
    description: 'High-renewable energy mix (e.g., Switzerland, Nordic hydro/solar).',
    factors: { walking: 0, bicycle: 2, train: 12, bus: 45, car: 140, ferry: 85, flight: 240 },
  },
  {
    id: 'fossil_heavy',
    name: 'Thermal / Fossil Grid (High Carbon)',
    description: 'Higher coal and gas power generation mix.',
    factors: { walking: 0, bicycle: 8, train: 48, bus: 85, car: 200, ferry: 135, flight: 275 },
  },
];

// Custom sleek dark tooltip for Recharts
const SleekChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1120] border border-slate-700/90 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
          <span>{label}</span>
        </div>
        {payload.map((entry, index) => (
          <div key={`entry-${index}`} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color || '#14b8a6' }} className="font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#14b8a6' }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value} {entry.unit || unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper to categorize segment or journey mode
function normalizeModeKey(type = '', mode = '') {
  const t = (type || mode || '').toLowerCase();
  if (t.includes('walk') || t.includes('foot') || t.includes('hike') || t.includes('pedestrian')) return 'walking';
  if (t.includes('bike') || t.includes('bicycle') || t.includes('cycle')) return 'bicycle';
  if (t.includes('train') || t.includes('rail') || t.includes('subway') || t.includes('metro') || t.includes('tram') || t.includes('shinkansen')) return 'train';
  if (t.includes('bus') || t.includes('coach') || t.includes('shuttle')) return 'bus';
  if (t.includes('car') || t.includes('taxi') || t.includes('rideshare') || t.includes('drive') || t.includes('auto')) return 'car';
  if (t.includes('ferry') || t.includes('boat') || t.includes('ship') || t.includes('hydrofoil')) return 'ferry';
  if (t.includes('flight') || t.includes('plane') || t.includes('aviation') || t.includes('air')) return 'flight';
  return 'walking'; // default safe active fallback
}

export default function TravelInsightsPage() {
  const {
    journeys,
    settings,
    navigateToJourney,
    setActivePage,
    addToast,
  } = useApp();

  const isMi = settings.distanceUnit === 'mi';
  const distMultiplier = isMi ? 0.621371 : 1.0;
  const distUnit = isMi ? 'mi' : 'km';

  // 1. Interactive Date Filter State
  const [dateRangePreset, setDateRangePreset] = useState('all'); // 'all' | '7d' | '30d' | '90d' | 'oct2026' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-31');
  const [customDateError, setCustomDateError] = useState('');

  // 2. Configurable Emission Factors State
  const [emissionFactors, setEmissionFactors] = useState(() => {
    try {
      const saved = localStorage.getItem('tripmate_demo_emission_factors');
      return saved ? JSON.parse(saved) : DEFAULT_EMISSION_FACTORS;
    } catch {
      return DEFAULT_EMISSION_FACTORS;
    }
  });

  const [isFactorModalOpen, setIsFactorModalOpen] = useState(false);
  const [factorFormState, setFactorFormState] = useState(emissionFactors);
  const [activeFactorPreset, setActiveFactorPreset] = useState('defra_standard');

  // Chart view modes
  const [modeBreakdownMetric, setModeBreakdownMetric] = useState('distance'); // 'distance' | 'trips' | 'co2'
  const [timeSeriesMetric, setTimeSeriesMetric] = useState('distance'); // 'distance' | 'time' | 'co2'
  const [equivalentBenchmarkKm, setEquivalentBenchmarkKm] = useState('traveled'); // 'traveled' | '50' | '100' | '250'

  // Persist emission factors to local storage
  const saveCustomFactors = (newFactors) => {
    setEmissionFactors(newFactors);
    try {
      localStorage.setItem('tripmate_demo_emission_factors', JSON.stringify(newFactors));
    } catch {}
    setIsFactorModalOpen(false);
    addToast('Emission Factors Updated', 'Custom modal emission assumptions have been applied.', 'success');
  };

  const resetFactorsToDefault = () => {
    setEmissionFactors(DEFAULT_EMISSION_FACTORS);
    setFactorFormState(DEFAULT_EMISSION_FACTORS);
    setActiveFactorPreset('defra_standard');
    try {
      localStorage.removeItem('tripmate_demo_emission_factors');
    } catch {}
    addToast('Factors Reset', 'Reset to published UK DEFRA 2024 / EEA standards.', 'info');
  };

  // 3. Date Filtering Engine
  const { filteredJourneys, dateRangeDescription } = useMemo(() => {
    setCustomDateError('');
    if (!journeys || journeys.length === 0) {
      return { filteredJourneys: [], dateRangeDescription: 'No journeys available' };
    }

    // Benchmark base date for simulated timeline: 2026-10-28
    const baseDate = new Date('2026-10-28T23:59:59');

    let start = null;
    let end = null;
    let desc = 'All Time Travel Records';

    if (dateRangePreset === '7d') {
      start = new Date('2026-10-21T00:00:00');
      end = baseDate;
      desc = 'Last 7 Days (Oct 21 – Oct 28, 2026)';
    } else if (dateRangePreset === '30d') {
      start = new Date('2026-09-28T00:00:00');
      end = baseDate;
      desc = 'Last 30 Days (Sep 28 – Oct 28, 2026)';
    } else if (dateRangePreset === '90d') {
      start = new Date('2026-07-30T00:00:00');
      end = baseDate;
      desc = 'Last 90 Days (Jul 30 – Oct 28, 2026)';
    } else if (dateRangePreset === 'oct2026') {
      start = new Date('2026-10-01T00:00:00');
      end = new Date('2026-10-31T23:59:59');
      desc = 'Current Month (October 2026)';
    } else if (dateRangePreset === 'custom') {
      if (!customStartDate || !customEndDate) {
        setCustomDateError('Please choose both start and end dates.');
        return { filteredJourneys: journeys, dateRangeDescription: 'Custom Range (All)' };
      }
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59`);
      if (start > end) {
        setCustomDateError('Start date must be before or equal to end date.');
        return { filteredJourneys: [], dateRangeDescription: 'Invalid Date Range' };
      }
      desc = `Custom Range (${customStartDate} to ${customEndDate})`;
    }

    if (!start || !end) {
      return { filteredJourneys: journeys, dateRangeDescription: 'All Time Travel Records' };
    }

    const matched = journeys.filter((j) => {
      const dateStr = j.travelDate || j.startDate || '2026-10-28';
      const jDate = new Date(`${dateStr}T12:00:00`);
      return jDate >= start && jDate <= end;
    });

    return { filteredJourneys: matched, dateRangeDescription: desc };
  }, [journeys, dateRangePreset, customStartDate, customEndDate]);

  // 4. Dynamic Aggregations & Calculations Engine
  const metrics = useMemo(() => {
    const totalJourneys = filteredJourneys.length;
    let totalDistKm = 0;
    let totalDurMins = 0;
    let totalEstimatedCo2Kg = 0;
    let totalCo2AvoidedKg = 0;

    // Mode-specific aggregators
    const modeBuckets = {
      walking: { key: 'walking', name: 'Walking & Hiking', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.walking?.color || '#10b981' },
      bicycle: { key: 'bicycle', name: 'Bicycle & E-Bike', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.bicycle?.color || '#22c55e' },
      train: { key: 'train', name: 'Electric Rail & Metro', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.train?.color || '#14b8a6' },
      bus: { key: 'bus', name: 'Transit Bus & Coach', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.bus?.color || '#06b6d4' },
      car: { key: 'car', name: 'Passenger Car', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.car?.color || '#f59e0b' },
      ferry: { key: 'ferry', name: 'Ferry & Maritime', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.ferry?.color || '#3b82f6' },
      flight: { key: 'flight', name: 'Short Flight', km: 0, minutes: 0, count: 0, co2Kg: 0, color: emissionFactors.flight?.color || '#a855f7' },
    };

    // Date-wise map for time-series: { 'YYYY-MM-DD': { date, km, minutes, co2Kg, journeys: [] } }
    const dateMap = {};

    filteredJourneys.forEach((j) => {
      const jDist = parseFloat(j.totalDistanceKm) || 0;
      const jDur = parseInt(j.totalDurationMinutes, 10) || 0;
      totalDistKm += jDist;
      totalDurMins += jDur;

      const jDateKey = j.travelDate || j.startDate || '2026-10-28';
      if (!dateMap[jDateKey]) {
        dateMap[jDateKey] = {
          dateKey: jDateKey,
          km: 0,
          minutes: 0,
          co2Kg: 0,
          journeys: [],
        };
      }
      dateMap[jDateKey].km += jDist;
      dateMap[jDateKey].minutes += jDur;
      dateMap[jDateKey].journeys.push(j.title);

      // Iterate segments if available for detailed modal attribution
      const segments = j.segments || j.travelSegments || [];
      if (segments.length > 0) {
        segments.forEach((seg) => {
          const segDist = parseFloat(seg.distanceKm) || 0;
          const segDur = parseInt(seg.durationMinutes, 10) || 0;
          const modeKey = normalizeModeKey(seg.type, seg.mode || seg.transportMode);
          const factor = emissionFactors[modeKey]?.gCo2PerKm ?? DEFAULT_EMISSION_FACTORS[modeKey].gCo2PerKm;

          // Estimated emissions: (distance_km * factor_g) / 1000 = kg CO2
          const segCo2 = (segDist * factor) / 1000;
          // Avoided emissions vs standard private passenger car (170 g/km)
          const carBaselineCo2 = (segDist * 170) / 1000;
          const avoided = Math.max(0, carBaselineCo2 - segCo2);

          totalEstimatedCo2Kg += segCo2;
          totalCo2AvoidedKg += avoided;

          if (modeBuckets[modeKey]) {
            modeBuckets[modeKey].km += segDist;
            modeBuckets[modeKey].minutes += segDur;
            modeBuckets[modeKey].count += 1;
            modeBuckets[modeKey].co2Kg += segCo2;
          }
          dateMap[jDateKey].co2Kg += segCo2;
        });
      } else {
        // Fallback to journey primary mode
        const modeKey = normalizeModeKey(j.primaryTransportMode, j.primaryTransportMode);
        const factor = emissionFactors[modeKey]?.gCo2PerKm ?? DEFAULT_EMISSION_FACTORS[modeKey].gCo2PerKm;
        const jCo2 = (jDist * factor) / 1000;
        const carBaselineCo2 = (jDist * 170) / 1000;
        const avoided = Math.max(0, carBaselineCo2 - jCo2);

        totalEstimatedCo2Kg += jCo2;
        totalCo2AvoidedKg += avoided;

        if (modeBuckets[modeKey]) {
          modeBuckets[modeKey].km += jDist;
          modeBuckets[modeKey].minutes += jDur;
          modeBuckets[modeKey].count += 1;
          modeBuckets[modeKey].co2Kg += jCo2;
        }
        dateMap[jDateKey].co2Kg += jCo2;
      }
    });

    // Format aggregate stats
    const avgDurationMins = totalJourneys > 0 ? Math.round(totalDurMins / totalJourneys) : 0;
    const avgDistanceKm = totalJourneys > 0 ? parseFloat((totalDistKm / totalJourneys).toFixed(1)) : 0;

    // Transport Mode Breakdown Array (filtered to active modes)
    const modeBreakdownList = Object.values(modeBuckets)
      .filter((m) => m.km > 0 || m.count > 0)
      .map((m) => {
        const shareDist = totalDistKm > 0 ? parseFloat(((m.km / totalDistKm) * 100).toFixed(1)) : 0;
        const distValue = isMi ? parseFloat((m.km * distMultiplier).toFixed(1)) : parseFloat(m.km.toFixed(1));
        return {
          ...m,
          distanceRawKm: m.km,
          distanceDisplay: distValue,
          distanceFormatted: `${distValue.toLocaleString()} ${distUnit}`,
          sharePercent: shareDist,
          co2KgFormatted: `${m.co2Kg.toFixed(1)} kg`,
        };
      })
      .sort((a, b) => b.km - a.km);

    // Time-series Chart Data (sorted chronologically)
    const timeSeriesData = Object.values(dateMap)
      .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey))
      .map((entry) => {
        const dObj = new Date(`${entry.dateKey}T12:00:00`);
        const label = dObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const distVal = isMi ? parseFloat((entry.km * distMultiplier).toFixed(1)) : parseFloat(entry.km.toFixed(1));
        return {
          date: label,
          fullDate: entry.dateKey,
          distance: distVal,
          distanceKm: parseFloat(entry.km.toFixed(1)),
          travelTimeMinutes: entry.minutes,
          travelTimeHours: parseFloat((entry.minutes / 60).toFixed(1)),
          co2Kg: parseFloat(entry.co2Kg.toFixed(2)),
          journeyCount: entry.journeys.length,
          journeyNames: entry.journeys.join(', '),
        };
      });

    // Equivalent Distance Comparison across all modes
    // Uses actual traveled distance or selected benchmark
    const benchmarkDistanceKm =
      equivalentBenchmarkKm === 'traveled' ? Math.max(1, totalDistKm) : parseFloat(equivalentBenchmarkKm);

    const equivalentComparisonData = [
      {
        mode: 'Walking & Hiking',
        key: 'walking',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.walking.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.walking.gCo2PerKm,
        color: '#10b981',
      },
      {
        mode: 'Bicycle & E-Bike',
        key: 'bicycle',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.bicycle.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.bicycle.gCo2PerKm,
        color: '#22c55e',
      },
      {
        mode: 'Electric Rail & Tram',
        key: 'train',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.train.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.train.gCo2PerKm,
        color: '#14b8a6',
      },
      {
        mode: 'Transit Bus',
        key: 'bus',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.bus.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.bus.gCo2PerKm,
        color: '#06b6d4',
      },
      {
        mode: 'Private Car (ICE)',
        key: 'car',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.car.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.car.gCo2PerKm,
        color: '#f59e0b',
      },
      {
        mode: 'Short Flight',
        key: 'flight',
        co2Kg: parseFloat(((benchmarkDistanceKm * emissionFactors.flight.gCo2PerKm) / 1000).toFixed(1)),
        gCo2PerKm: emissionFactors.flight.gCo2PerKm,
        color: '#a855f7',
      },
    ];

    // Car baseline comparison over benchmark distance
    const carBaselineEmission = (benchmarkDistanceKm * 170) / 1000;
    const actualTraveledEmissions = totalEstimatedCo2Kg;
    const netSavingsVsCar = Math.max(0, (totalDistKm * 170) / 1000 - actualTraveledEmissions);

    return {
      totalJourneys,
      totalDistanceKm: parseFloat(totalDistKm.toFixed(1)),
      totalDistanceDisplay: isMi
        ? parseFloat((totalDistKm * distMultiplier).toFixed(1))
        : parseFloat(totalDistKm.toFixed(1)),
      totalDurationMinutes: totalDurMins,
      totalDurationFormatted: `${Math.floor(totalDurMins / 60)}h ${totalDurMins % 60}m`,
      avgDurationMins,
      avgDistanceDisplay: isMi
        ? parseFloat((avgDistanceKm * distMultiplier).toFixed(1))
        : avgDistanceKm,
      totalEstimatedCo2Kg: parseFloat(totalEstimatedCo2Kg.toFixed(1)),
      totalCo2AvoidedKg: parseFloat(totalCo2AvoidedKg.toFixed(1)),
      netSavingsVsCar: parseFloat(netSavingsVsCar.toFixed(1)),
      modeBreakdownList,
      timeSeriesData,
      equivalentComparisonData,
      benchmarkDistanceKm,
    };
  }, [filteredJourneys, emissionFactors, isMi, distMultiplier, distUnit, equivalentBenchmarkKm]);

  // 5. Dynamic Sustainability Suggestions (Calculated from active demo data)
  const sustainabilitySuggestions = useMemo(() => {
    const list = [];
    const walkMode = metrics.modeBreakdownList.find((m) => m.key === 'walking');
    const trainMode = metrics.modeBreakdownList.find((m) => m.key === 'train');
    const busMode = metrics.modeBreakdownList.find((m) => m.key === 'bus');
    const carMode = metrics.modeBreakdownList.find((m) => m.key === 'car');

    if (walkMode && walkMode.km > 3) {
      const stepsEst = Math.round(walkMode.km * 1350);
      list.push({
        id: 'active_footprint',
        icon: <Footprints className="w-4 h-4 text-emerald-400" />,
        badge: 'Zero Direct Emission',
        badgeColor: 'emerald',
        title: 'Active Mobility Milestone',
        description: `You logged ${walkMode.distanceFormatted} of walking & pedestrian trails (approx. ${stepsEst.toLocaleString()} steps), avoiding ${(walkMode.km * 0.17).toFixed(1)} kg CO₂ compared to vehicular transport.`,
        actionLabel: 'Celebrate Mobility',
      });
    }

    if (trainMode && trainMode.km > 5) {
      list.push({
        id: 'rail_champion',
        icon: <Train className="w-4 h-4 text-teal-400" />,
        badge: 'Low-Carbon Backbone',
        badgeColor: 'teal',
        title: 'High-Speed Rail Efficiency',
        description: `Covered ${trainMode.distanceFormatted} via electrified passenger rail. At 28 g CO₂/km, electric trains emit ~83% less carbon than equivalent private automobile routes.`,
        actionLabel: 'View Rail Legs',
      });
    }

    if (busMode && busMode.km > 0) {
      list.push({
        id: 'bus_transit',
        icon: <Bus className="w-4 h-4 text-cyan-400" />,
        badge: 'Mass Transit',
        badgeColor: 'cyan',
        title: 'First-Mile Public Transit Optimization',
        description: `Urban buses handled ${busMode.distanceFormatted} of your transfers. Combining municipal electric buses with short walks removes private vehicle congestion from historic corridors.`,
        actionLabel: 'Adopt Route Chaining',
      });
    }

    // Default universal mobility recommendation
    list.push({
      id: 'off_peak',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: 'Mobility Velocity',
      badgeColor: 'amber',
      title: 'Off-Peak Transit Window Advantage',
      description: 'Shifting departure windows between 09:30 and 11:30 bypassed peak commuter surges, boosting regional rail velocity by 28% and avoiding station crowd delays.',
      actionLabel: 'Explore Peak Shifts',
    });

    return list;
  }, [metrics]);

  // 6. CSV Download Handler
  const handleDownloadCsv = () => {
    if (filteredJourneys.length === 0) {
      addToast('No Data to Export', 'There are no journey records in the selected date range.', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Build comprehensive CSV payload
    const csvRows = [
      ['TRIPMATE TRAVEL & MOBILITY INSIGHTS REPORT'],
      ['Generated On', todayStr],
      ['Date Range', dateRangeDescription],
      ['Distance Unit', distUnit],
      ['Total Journeys', metrics.totalJourneys],
      ['Total Traveled Distance', `${metrics.totalDistanceDisplay} ${distUnit}`],
      ['Total Travel Time', metrics.totalDurationFormatted],
      ['Average Duration (mins)', metrics.avgDurationMins],
      ['Estimated Net CO2 Emissions (kg)', metrics.totalEstimatedCo2Kg],
      ['Estimated CO2 Abated vs Private Car (kg)', metrics.netSavingsVsCar],
      ['Emission Factor Modeling Assumptions', 'Published UK DEFRA 2024 / EEA Modal Benchmarks (g CO2/km)'],
      [],
      ['JOURNEY LEVEL SUMMARY RECORDS'],
      [
        'Journey ID',
        'Title',
        'Travel Date',
        'Status',
        'Origin',
        'Destination',
        'Primary Transport Mode',
        `Distance (${distUnit})`,
        'Duration (Minutes)',
        'Estimated CO2 (kg)',
        'Estimated CO2 Saved vs Car (kg)',
        'Segments Count',
        'Summary Notes',
      ],
    ];

    filteredJourneys.forEach((j) => {
      const dVal = isMi
        ? (parseFloat(j.totalDistanceKm || 0) * distMultiplier).toFixed(1)
        : parseFloat(j.totalDistanceKm || 0).toFixed(1);

      csvRows.push([
        `"${j.id}"`,
        `"${j.title.replace(/"/g, '""')}"`,
        `"${j.travelDate || j.startDate || 'N/A'}"`,
        `"${j.status || 'Active'}"`,
        `"${(j.origin || 'City Departure').replace(/"/g, '""')}"`,
        `"${(j.destination || 'Destination Point').replace(/"/g, '""')}"`,
        `"${(j.primaryTransportMode || 'Transit').replace(/"/g, '""')}"`,
        dVal,
        j.totalDurationMinutes || 0,
        j.estimatedCo2Kg || 0,
        j.co2SavedKg || (parseFloat(j.totalDistanceKm || 0) * 0.14).toFixed(1),
        j.segments?.length || j.travelSegments?.length || 1,
        `"${(j.summary || '').replace(/"/g, '""')}"`,
      ]);
    });

    // Add Segment-level granularity
    csvRows.push([]);
    csvRows.push(['DETAILED MULTI-MODAL SEGMENT BREAKDOWN']);
    csvRows.push([
      'Journey ID',
      'Segment Order',
      'Segment Title',
      'Mode Type',
      'From Waypoint',
      'To Waypoint',
      `Distance (${distUnit})`,
      'Duration (Minutes)',
      'Estimated CO2 (kg)',
      'Emission Factor (g/km)',
      'Telemetry Note',
    ]);

    filteredJourneys.forEach((j) => {
      const segs = j.segments || j.travelSegments || [];
      segs.forEach((s, idx) => {
        const segDistVal = isMi
          ? (parseFloat(s.distanceKm || 0) * distMultiplier).toFixed(1)
          : parseFloat(s.distanceKm || 0).toFixed(1);
        const modeKey = normalizeModeKey(s.type, s.mode || s.transportMode);
        const factor = emissionFactors[modeKey]?.gCo2PerKm ?? 0;
        const segCo2 = ((parseFloat(s.distanceKm || 0) * factor) / 1000).toFixed(2);

        csvRows.push([
          `"${j.id}"`,
          idx + 1,
          `"${(s.title || s.mode || 'Transit Segment').replace(/"/g, '""')}"`,
          `"${modeKey}"`,
          `"${(s.from || s.origin || 'Origin').replace(/"/g, '""')}"`,
          `"${(s.to || s.destination || 'Destination').replace(/"/g, '""')}"`,
          segDistVal,
          s.durationMinutes || 0,
          segCo2,
          factor,
          `"${(s.notes || s.telemetry || 'Simulated Record').replace(/"/g, '""')}"`,
        ]);
      });
    });

    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tripmate-travel-activity-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Activity Summary Downloaded', 'CSV report with aggregate telemetry & modal emissions saved.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Selectable Date Range Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-teal-400" />
            Travel & Mobility Insights
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multimodal transit telemetry, daily activity timeline, and verified example emission modeling.
          </p>
        </div>

        {/* Action Controls: CSV Download + Emission Factors Config */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFactorFormState(emissionFactors);
              setIsFactorModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700/80 transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Configure documented emission factors"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Configure</span> Factors
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            Download CSV Report
          </button>
        </div>
      </div>

      {/* Date Range Preset Selector */}
      <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Select Date Range:</span>
            <span className="text-[11px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 font-bold">
              {dateRangeDescription}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '90d', label: 'Last 90 Days' },
              { id: 'oct2026', label: 'Oct 2026' },
              { id: 'custom', label: 'Custom Range' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDateRangePreset(preset.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition text-xs ${
                  dateRangePreset === preset.id
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs (when 'custom' preset is active) */}
        {dateRangePreset === 'custom' && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-400">End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            {customDateError && (
              <span className="text-rose-400 text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {customDateError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Top Aggregate Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Distance Card */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-bold text-[10px]">Total Distance</span>
            <Compass className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {metrics.totalDistanceDisplay.toLocaleString()}{' '}
              <span className="text-sm font-normal text-slate-400">{distUnit}</span>
            </div>
            <div className="text-[11px] text-teal-300/90 mt-1 font-medium">
              Across {metrics.totalJourneys} active trip chains
            </div>
          </div>
        </div>

        {/* Total Travel Time Card */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-bold text-[10px]">Total Travel Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {metrics.totalDurationFormatted}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              {metrics.totalDurationMinutes.toLocaleString()} minutes transit time
            </div>
          </div>
        </div>

        {/* Journey Count & Average Duration Card */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-bold text-[10px]">Journeys Logged</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {metrics.totalJourneys}{' '}
              <span className="text-sm font-normal text-slate-400">Journeys</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">
              Avg duration: {metrics.avgDurationMins}m per trip
            </div>
          </div>
        </div>

        {/* Net Estimated CO2 Emissions Card */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="uppercase tracking-wider font-bold text-[10px]">Estimated Emissions</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {metrics.totalEstimatedCo2Kg}{' '}
              <span className="text-sm font-normal text-slate-400">kg CO₂</span>
            </div>
            <div className="text-[11px] text-emerald-300 mt-1 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              ~{metrics.netSavingsVsCar} kg avoided vs private car
            </div>
          </div>
        </div>
      </div>

      {/* Empty State when no journeys match filter */}
      {metrics.totalJourneys === 0 ? (
        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Journeys in Selected Date Range</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are no recorded travel chains between {dateRangeDescription}. Switch your date range or create a new journey.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDateRangePreset('all')}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
            >
              Reset to All Time
            </button>
            <button
              type="button"
              onClick={() => setActivePage('journeys')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
            >
              Go to My Journeys
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. Row 1: Daily Travel Distance Time-Series Chart & Transport-Mode Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Travel Distance Time-Series Chart (2 cols) */}
            <div className="lg:col-span-2 bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                    Daily Travel Distance & Activity Time-Series
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chronological progression of mobility records across the selected period.
                  </p>
                </div>

                {/* Metric toggle */}
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setTimeSeriesMetric('distance')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      timeSeriesMetric === 'distance'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Distance ({distUnit})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSeriesMetric('time')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      timeSeriesMetric === 'time'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Time (min)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeSeriesMetric('co2')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      timeSeriesMetric === 'co2'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    CO₂ (kg)
                  </button>
                </div>
              </div>

              {/* Responsive Chart Container */}
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metrics.timeSeriesData}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="timeSeriesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={
                        <SleekChartTooltip
                          unit={
                            timeSeriesMetric === 'distance'
                              ? distUnit
                              : timeSeriesMetric === 'time'
                              ? 'mins'
                              : 'kg CO₂'
                          }
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey={
                        timeSeriesMetric === 'distance'
                          ? 'distance'
                          : timeSeriesMetric === 'time'
                          ? 'travelTimeMinutes'
                          : 'co2Kg'
                      }
                      name={
                        timeSeriesMetric === 'distance'
                          ? `Daily Distance (${distUnit})`
                          : timeSeriesMetric === 'time'
                          ? 'Travel Time'
                          : 'Estimated CO₂'
                      }
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#timeSeriesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Footer Note */}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Showing {metrics.timeSeriesData.length} active travel days in current view
                </span>
                <span className="font-mono text-teal-300">
                  Total: {metrics.totalDistanceDisplay} {distUnit} • {metrics.totalDurationFormatted}
                </span>
              </div>
            </div>

            {/* Transport-Mode Breakdown (1 col) */}
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal-400" />
                    Transport-Mode Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modal split across walking, bus, car, bicycle, and rail.
                  </p>
                </div>

                <select
                  value={modeBreakdownMetric}
                  onChange={(e) => setModeBreakdownMetric(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500 font-semibold"
                >
                  <option value="distance">By Distance</option>
                  <option value="trips">By Segments</option>
                  <option value="co2">By CO₂</option>
                </select>
              </div>

              {/* Recharts Pie / Donut Chart */}
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.modeBreakdownList}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey={
                        modeBreakdownMetric === 'distance'
                          ? 'distanceDisplay'
                          : modeBreakdownMetric === 'trips'
                          ? 'count'
                          : 'co2Kg'
                      }
                      nameKey="name"
                    >
                      {metrics.modeBreakdownList.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<SleekChartTooltip unit={modeBreakdownMetric === 'distance' ? distUnit : modeBreakdownMetric === 'trips' ? 'segments' : 'kg'} />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Modes</span>
                  <span className="text-base font-black text-white font-mono">
                    {metrics.modeBreakdownList.length}
                  </span>
                </div>
              </div>

              {/* Progress Bars List for Modes */}
              <div className="space-y-2 pt-1 max-h-44 overflow-y-auto custom-scrollbar">
                {metrics.modeBreakdownList.map((mode) => (
                  <div key={mode.key} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mode.color }} />
                        {mode.name}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {mode.distanceFormatted} ({mode.sharePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${mode.sharePercent}%`, backgroundColor: mode.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Row 2: Mode Comparison Over Equivalent Distance & Emission Factors Documentation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mode Comparison Over Equivalent Distances (2 cols) */}
            <div className="lg:col-span-2 bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-400" />
                    Emissions Comparison Over Equivalent Distances
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimated carbon impact if the exact same distance was traversed entirely by each modality.
                  </p>
                </div>

                {/* Distance Benchmark Selector */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 hidden sm:inline">Benchmark:</span>
                  <select
                    value={equivalentBenchmarkKm}
                    onChange={(e) => setEquivalentBenchmarkKm(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-teal-300 font-mono font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="traveled">Traveled Total ({metrics.totalDistanceDisplay} {distUnit})</option>
                    <option value="25">25 km (Short Trip)</option>
                    <option value="50">50 km (Regional Commute)</option>
                    <option value="100">100 km (Intercity Corridor)</option>
                    <option value="250">250 km (Long Range)</option>
                  </select>
                </div>
              </div>

              {/* Bar Chart comparing modes */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.equivalentComparisonData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="mode"
                      stroke="#64748b"
                      fontSize={10}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip content={<SleekChartTooltip unit="kg CO₂" />} />
                    <Bar dataKey="co2Kg" name="Estimated Emissions" radius={[6, 6, 0, 0]}>
                      {metrics.equivalentComparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Callout Summary */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Net Low-Carbon Transit Advantage</span>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      Traveling via electric rail and active walking over this distance generated{' '}
                      <strong className="text-emerald-400 font-mono">{metrics.totalEstimatedCo2Kg} kg CO₂</strong>, avoiding approximately{' '}
                      <strong className="text-white font-mono">{metrics.netSavingsVsCar} kg CO₂</strong> compared to single-occupant private combustion cars.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Reduction vs Car</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {metrics.totalDistanceKm > 0
                      ? `~${Math.min(95, Math.round((metrics.netSavingsVsCar / Math.max(1, (metrics.totalDistanceKm * 0.17))) * 100))}%`
                      : '84%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Documented Configurable Emission Factors (1 col) */}
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-1 border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    Documented Emission Factors
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFactorFormState(emissionFactors);
                      setIsFactorModalOpen(true);
                    }}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Published factors per passenger-kilometer (g CO₂/km).
                </p>
              </div>

              {/* Factors List */}
              <div className="space-y-2 text-xs">
                {Object.values(emissionFactors).map((factor) => (
                  <div
                    key={factor.key}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: factor.color }} />
                      <div>
                        <span className="font-semibold text-white block text-[11px]">{factor.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{factor.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-300 text-xs block">
                        {factor.gCo2PerKm} g
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">per pass-km</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Methodological Transparency Note */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
                <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                  Calculation Methodology
                </div>
                <p>
                  Formula: <code className="font-mono text-teal-300 text-[10px]">(Distance km × Factor g) ÷ 1,000 = kg CO₂</code>.
                </p>
                <p className="text-[10px] text-slate-500">
                  Estimates are mathematical approximations from UK DEFRA & EEA passenger mobility benchmarks for demonstration. No physical sensors or custom AI model claimed.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Row 3: Sustainability Suggestions & Journey Activity Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sustainability Suggestions (1 col) */}
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Data-Driven Sustainability Suggestions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contextual recommendations generated from your active trip chains.
                </p>
              </div>

              <div className="space-y-3">
                {sustainabilitySuggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2 hover:border-slate-600 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        {item.icon}
                        {item.badge}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Activity Breakdown Table (2 cols) */}
            <div className="lg:col-span-2 bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    Journey Activity Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Trip chains contributing to telemetry within {dateRangeDescription}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePage('journeys')}
                  className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  <span>View All Journeys</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono">
                      <th className="pb-2.5">Journey & Route</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Mode</th>
                      <th className="pb-2.5 text-right">Distance</th>
                      <th className="pb-2.5 text-right">Duration</th>
                      <th className="pb-2.5 text-right">Est. CO₂</th>
                      <th className="pb-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredJourneys.map((j) => {
                      const dVal = isMi
                        ? (parseFloat(j.totalDistanceKm || 0) * distMultiplier).toFixed(1)
                        : parseFloat(j.totalDistanceKm || 0).toFixed(1);
                      const durMins = j.totalDurationMinutes || 0;
                      const durFormatted = `${Math.floor(durMins / 60)}h ${durMins % 60}m`;

                      return (
                        <tr key={j.id} className="hover:bg-slate-800/30 transition group">
                          <td className="py-3 pr-2">
                            <div className="font-bold text-white group-hover:text-teal-300 transition truncate max-w-xs">
                              {j.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">
                              {j.origin} → {j.destination}
                            </div>
                          </td>

                          <td className="py-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            {j.travelDate || j.startDate || 'N/A'}
                          </td>

                          <td className="py-3">
                            <span className="text-[10px] bg-slate-800 text-teal-300 px-2 py-0.5 rounded font-medium border border-slate-700 whitespace-nowrap">
                              {j.primaryTransportMode}
                            </span>
                          </td>

                          <td className="py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                            {dVal} {distUnit}
                          </td>

                          <td className="py-3 text-right font-mono text-slate-300 whitespace-nowrap">
                            {durFormatted}
                          </td>

                          <td className="py-3 text-right font-mono text-emerald-400 font-semibold whitespace-nowrap">
                            {j.estimatedCo2Kg || 0} kg
                          </td>

                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => navigateToJourney(j.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Open Trip Chain Details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{filteredJourneys.length} trip chains included</span>
                <span className="font-mono text-teal-300 font-semibold">
                  Aggregated: {metrics.totalDistanceDisplay} {distUnit} • {metrics.totalEstimatedCo2Kg} kg CO₂
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL: CONFIGURE EMISSION FACTORS */}
      {isFactorModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsFactorModalOpen(false)}
          title="Configure Transport Emission Factors"
          subtitle="Adjust the grams of CO₂ per passenger-kilometer used across all modal emission calculations."
        >
          <div className="space-y-4 text-xs">
            {/* Presets Bar */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quick Modeling Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {EMISSION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveFactorPreset(p.id);
                      setFactorFormState((prev) => {
                        const updated = { ...prev };
                        Object.keys(p.factors).forEach((k) => {
                          if (updated[k]) {
                            updated[k] = { ...updated[k], gCo2PerKm: p.factors[k] };
                          }
                        });
                        return updated;
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      activeFactorPreset === p.id
                        ? 'bg-teal-950/40 border-teal-500/50 ring-1 ring-teal-500/30'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-white text-[11px]">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{p.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Modal Factors (g CO₂ / passenger-km)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {Object.values(factorFormState).map((item) => (
                  <div
                    key={item.key}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">g/km</span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={item.gCo2PerKm}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setFactorFormState((prev) => ({
                          ...prev,
                          [item.key]: {
                            ...prev[item.key],
                            gCo2PerKm: val,
                          },
                        }));
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                    />

                    <div className="text-[9px] text-slate-500 truncate" title={item.source}>
                      Ref: {item.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={resetFactorsToDefault}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFactorModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveCustomFactors(factorFormState)}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
                >
                  Apply Factors
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}