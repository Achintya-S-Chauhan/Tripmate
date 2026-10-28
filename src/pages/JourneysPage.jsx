import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Compass,
  ArrowRight,
  Footprints,
  Bus,
  Train,
  Coffee,
  Sparkles,
  Trash2,
  Edit3,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Ship,
  Bike,
  X,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';

// Helper to get transport mode icon
function getSegmentIcon(type, mode) {
  const t = (type || mode || '').toLowerCase();
  if (t.includes('walk') || t.includes('foot') || t.includes('pedestrian') || t.includes('hike')) {
    return <Footprints className="w-3.5 h-3.5 text-teal-400" />;
  }
  if (t.includes('bus')) {
    return <Bus className="w-3.5 h-3.5 text-sky-400" />;
  }
  if (t.includes('train') || t.includes('rail') || t.includes('tram') || t.includes('shinkansen')) {
    return <Train className="w-3.5 h-3.5 text-indigo-400" />;
  }
  if (t.includes('cafe') || t.includes('coffee') || t.includes('dining') || t.includes('rest')) {
    return <Coffee className="w-3.5 h-3.5 text-amber-400" />;
  }
  if (t.includes('ferry') || t.includes('boat') || t.includes('ship')) {
    return <Ship className="w-3.5 h-3.5 text-cyan-400" />;
  }
  if (t.includes('bike') || t.includes('bicycle')) {
    return <Bike className="w-3.5 h-3.5 text-emerald-400" />;
  }
  return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
}

export default function JourneysPage() {
  const {
    journeys,
    navigateToJourney,
    createJourney,
    editJourney,
    deleteJourney,
    resetAllDemoData,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All'); // 'All' | 'In Progress' | 'Completed' | 'Upcoming' | 'Draft'
  const [activeModeFilter, setActiveModeFilter] = useState('All'); // 'All' | 'Walking' | 'Bus' | 'Train' | 'Multimodal'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'distance' | 'duration' | 'name'

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState(null);
  const [deletingJourney, setDeletingJourney] = useState(null);

  // Form State for Create
  const [createForm, setCreateForm] = useState(() => ({
    title: '',
    origin: '',
    destination: '',
    travelDate: new Date().toISOString().split('T')[0],
    primaryTransportMode: 'Bus + Walking',
    status: 'In Progress',
    totalDistanceKm: '7.3',
    totalDurationMinutes: '55',
    summary: '',
    transitLine: '',
  }));

  const [createErrors, setCreateErrors] = useState({});

  // Form State for Edit
  const [editForm, setEditForm] = useState({
    title: '',
    origin: '',
    destination: '',
    travelDate: '',
    primaryTransportMode: '',
    status: '',
    summary: '',
  });

  const [editErrors, setEditErrors] = useState({});

  // Filtered and Sorted Journeys
  const filteredJourneys = useMemo(() => {
    return journeys
      .filter((j) => {
        // Status filter
        if (activeStatus !== 'All') {
          const statusMatch =
            activeStatus === 'In Progress'
              ? j.status === 'In Progress' || j.status === 'Active'
              : j.status === activeStatus;
          if (!statusMatch) return false;
        }

        // Mode filter
        if (activeModeFilter !== 'All') {
          const modeStr = (
            (j.primaryTransportMode || '') +
            ' ' +
            (j.transitTypes || []).join(' ') +
            ' ' +
            (j.segments || []).map((s) => s.type).join(' ')
          ).toLowerCase();

          if (activeModeFilter === 'Walking' && !modeStr.includes('walk')) return false;
          if (activeModeFilter === 'Bus' && !modeStr.includes('bus')) return false;
          if (
            activeModeFilter === 'Train' &&
            !modeStr.includes('train') &&
            !modeStr.includes('rail') &&
            !modeStr.includes('tram')
          )
            return false;
          if (activeModeFilter === 'Multimodal' && (j.segments?.length || 0) < 2) return false;
          if (activeModeFilter === 'Ferry' && !modeStr.includes('ferry') && !modeStr.includes('boat'))
            return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (j.title || '').toLowerCase().includes(q);
          const matchOrigin = (j.origin || '').toLowerCase().includes(q);
          const matchDest = (j.destination || '').toLowerCase().includes(q);
          const matchSummary = (j.summary || '').toLowerCase().includes(q);
          const matchMode = (j.primaryTransportMode || '').toLowerCase().includes(q);
          const matchSegments = (j.segments || []).some(
            (s) =>
              (s.title || '').toLowerCase().includes(q) ||
              (s.origin || s.from || '').toLowerCase().includes(q) ||
              (s.destination || s.to || '').toLowerCase().includes(q) ||
              (s.transitLine || '').toLowerCase().includes(q)
          );

          return (
            matchTitle ||
            matchOrigin ||
            matchDest ||
            matchSummary ||
            matchMode ||
            matchSegments
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') {
          return (b.totalDistanceKm || 0) - (a.totalDistanceKm || 0);
        }
        if (sortBy === 'duration') {
          return (b.totalDurationMinutes || 0) - (a.totalDurationMinutes || 0);
        }
        if (sortBy === 'name') {
          return (a.title || '').localeCompare(b.title || '');
        }
        // default: date newest first
        const dateA = new Date(a.travelDate || a.startDate || '1970-01-01');
        const dateB = new Date(b.travelDate || b.startDate || '1970-01-01');
        return dateB - dateA;
      });
  }, [journeys, activeStatus, activeModeFilter, searchQuery, sortBy]);

  // Validation for Create Form
  const validateCreate = () => {
    const errors = {};
    if (!createForm.origin.trim()) errors.origin = 'Origin location is required';
    if (!createForm.destination.trim()) errors.destination = 'Destination location is required';
    if (!createForm.travelDate) errors.travelDate = 'Travel date is required';
    if (isNaN(parseFloat(createForm.totalDistanceKm)) || parseFloat(createForm.totalDistanceKm) < 0) {
      errors.totalDistanceKm = 'Must be a positive number';
    }
    if (isNaN(parseInt(createForm.totalDurationMinutes, 10)) || parseInt(createForm.totalDurationMinutes, 10) < 0) {
      errors.totalDurationMinutes = 'Must be a positive number';
    }
    setCreateErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!validateCreate()) return;

    createJourney({
      title: createForm.title.trim() || `${createForm.origin} ➔ ${createForm.destination}`,
      origin: createForm.origin.trim(),
      destination: createForm.destination.trim(),
      travelDate: createForm.travelDate,
      primaryTransportMode: createForm.primaryTransportMode,
      status: createForm.status,
      totalDistanceKm: parseFloat(createForm.totalDistanceKm) || 0,
      totalDurationMinutes: parseInt(createForm.totalDurationMinutes, 10) || 0,
      summary: createForm.summary.trim() || `Multi-modal structured trip chain from ${createForm.origin} to ${createForm.destination}.`,
      transitLine: createForm.transitLine.trim() || null,
    });

    setIsCreateOpen(false);
    setCreateForm({
      title: '',
      origin: '',
      destination: '',
      travelDate: new Date().toISOString().split('T')[0],
      primaryTransportMode: 'Bus + Walking',
      status: 'In Progress',
      totalDistanceKm: '7.3',
      totalDurationMinutes: '55',
      summary: '',
      transitLine: '',
    });
    setCreateErrors({});
  };

  // Open Edit Modal
  const openEditModal = (journey, e) => {
    e.stopPropagation();
    setEditingJourney(journey);
    setEditForm({
      title: journey.title || '',
      origin: journey.origin || journey.waypoints?.[0]?.title || '',
      destination: journey.destination || '',
      travelDate: journey.travelDate || journey.startDate || '',
      primaryTransportMode: journey.primaryTransportMode || 'Walking + Transit',
      status: journey.status || 'In Progress',
      summary: journey.summary || '',
    });
    setEditErrors({});
  };

  const validateEdit = () => {
    const errors = {};
    if (!editForm.origin.trim()) errors.origin = 'Origin location is required';
    if (!editForm.destination.trim()) errors.destination = 'Destination location is required';
    if (!editForm.travelDate) errors.travelDate = 'Travel date is required';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateEdit() || !editingJourney) return;

    editJourney(editingJourney.id, {
      title: editForm.title.trim() || `${editForm.origin} ➔ ${editForm.destination}`,
      origin: editForm.origin.trim(),
      destination: editForm.destination.trim(),
      travelDate: editForm.travelDate,
      primaryTransportMode: editForm.primaryTransportMode,
      status: editForm.status,
      summary: editForm.summary.trim(),
    });

    setEditingJourney(null);
  };

  // Open Delete Modal
  const openDeleteModal = (journey, e) => {
    e.stopPropagation();
    setDeletingJourney(journey);
  };

  const handleDeleteConfirm = () => {
    if (deletingJourney) {
      deleteJourney(deletingJourney.id);
      setDeletingJourney(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveStatus('All');
    setActiveModeFilter('All');
    setSortBy('date');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-teal-400" />
              My Journeys
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              Trip Chain Library
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Inspect, plan, and analyze ordered mobility sequences. Every journey is modeled as an
            interconnected chain of walking, public transit legs, and intermediate rest stops.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create Trip Chain
        </button>
      </div>

      {/* Prominent Demo Notice Banner */}
      <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-teal-300 block">
              Simulated Demonstration Telemetry & Structured Trip Chains
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ordered segments (e.g. <em>Home → Walking → Bus → Cafe Stop → Walking → College</em>) and timestamps are modeled demonstration data, not harvested from device sensors or live hardware GPS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <button
            onClick={resetAllDemoData}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center gap-1.5 border border-slate-700"
            title="Reset to default initial demonstration journeys"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, origin, destination, intermediate stop, or transit line (e.g. Line 206)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-teal-500"
            >
              <option value="date">Date (Newest First)</option>
              <option value="distance">Total Distance (High to Low)</option>
              <option value="duration">Total Duration (High to Low)</option>
              <option value="name">Title (Alphabetical)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-teal-400" /> Status:
            </span>
            {['All', 'In Progress', 'Completed', 'Upcoming', 'Draft'].map((status) => {
              const isSelected = activeStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* Transport Mode Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Mode:</span>
            {['All', 'Walking', 'Bus', 'Train', 'Multimodal', 'Ferry'].map((m) => {
              const isSelected = activeModeFilter === m;
              return (
                <button
                  key={m}
                  onClick={() => setActiveModeFilter(m)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition ${
                    isSelected
                      ? 'bg-slate-700 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}

            {(searchQuery || activeStatus !== 'All' || activeModeFilter !== 'All') && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-teal-400 hover:underline font-semibold ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Journeys Grid or Empty State */}
      {filteredJourneys.length === 0 ? (
        <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Compass className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Matching Trip Chains Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              We couldn't find any journeys matching your current filters or query. Try adjusting your search or reset the filters.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Create Trip Chain
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJourneys.map((journey) => {
            const segments = journey.segments || journey.travelSegments || [];
            const originTitle = journey.origin || journey.waypoints?.[0]?.title || 'Origin';
            const destTitle = journey.destination || journey.waypoints?.[journey.waypoints.length - 1]?.title || 'Destination';

            return (
              <div
                key={journey.id}
                onClick={() => navigateToJourney(journey.id)}
                className="group relative bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-teal-500/40 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/5 cursor-pointer flex flex-col justify-between"
              >
                {/* Top status bar */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 ${
                          journey.status === 'In Progress' || journey.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : journey.status === 'Completed'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : journey.status === 'Draft'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {(journey.status === 'In Progress' || journey.status === 'Active') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                        {journey.status}
                      </span>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                        Demo Chain
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => openEditModal(journey, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit journey details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => openDeleteModal(journey, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete journey"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Origin ➔ Destination */}
                  <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors line-clamp-1">
                    {journey.title}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <span className="truncate max-w-[150px] sm:max-w-[180px] text-teal-400">
                      {originTitle}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[180px] text-slate-200">
                      {destTitle}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {journey.summary}
                  </p>
                </div>

                {/* Structured Trip Chain Mini Ribbon */}
                <div className="my-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-teal-400" />
                      Trip Chain ({segments.length} Ordered Legs)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {journey.primaryTransportMode || 'Multimodal'}
                    </span>
                  </div>

                  {/* Horizontal visual chain */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                    {segments.slice(0, 5).map((seg, idx) => (
                      <React.Fragment key={seg.id || idx}>
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold shrink-0 border ${
                            seg.isStop
                              ? 'bg-amber-950/30 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800/70 text-slate-200 border-slate-700/60'
                          }`}
                          title={`${seg.order || idx + 1}. ${seg.title || seg.origin} (${seg.distanceKm} km, ${seg.durationMinutes || seg.duration} min)`}
                        >
                          {getSegmentIcon(seg.type, seg.modeType || seg.mode)}
                          <span>
                            {seg.isStop
                              ? 'Stop'
                              : `${seg.distanceKm}km`}
                          </span>
                        </div>
                        {idx < Math.min(segments.length - 1, 4) && (
                          <span className="text-slate-600 text-xs shrink-0 font-bold">➔</span>
                        )}
                      </React.Fragment>
                    ))}
                    {segments.length > 5 && (
                      <span className="text-[10px] text-slate-400 px-1 font-bold shrink-0">
                        +{segments.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics strip */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Distance</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {journey.totalDistanceKm || 0} km
                    </span>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Duration</span>
                    <span className="font-mono font-bold text-teal-400 text-xs">
                      {journey.totalDurationMinutes || 0} min
                    </span>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-medium">Travel Date</span>
                    <span className="font-semibold text-slate-200 text-xs truncate block">
                      {journey.travelDate || journey.startDate}
                    </span>
                  </div>
                </div>

                {/* Footer action trigger */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    -{journey.estimatedCo2Kg || 0} kg CO₂ vs Solo Car
                  </span>

                  <span className="text-teal-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect Trip Chain
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE JOURNEY DIALOG */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateErrors({});
        }}
        title="Create New Trip Chain"
        subtitle="Establish an interconnected multi-modal route with origin, destination, and transport modes."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Journey Title</label>
            <input
              type="text"
              placeholder="e.g. Morning Campus & Research Commute"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Origin Point <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Home (Kitayama Residence)"
                value={createForm.origin}
                onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  createErrors.origin ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500`}
              />
              {createErrors.origin && (
                <p className="text-[10px] text-rose-400">{createErrors.origin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Final Destination <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Kyoto University - Yoshida Campus"
                value={createForm.destination}
                onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  createErrors.destination ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500`}
              />
              {createErrors.destination && (
                <p className="text-[10px] text-rose-400">{createErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Travel Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={createForm.travelDate}
                onChange={(e) => setCreateForm({ ...createForm, travelDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              {createErrors.travelDate && (
                <p className="text-[10px] text-rose-400">{createErrors.travelDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Primary Transport</label>
              <select
                value={createForm.primaryTransportMode}
                onChange={(e) => setCreateForm({ ...createForm, primaryTransportMode: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Bus + Walking">Bus + Walking</option>
                <option value="Train + Walking">Train + Walking</option>
                <option value="Walking">Walking / Pedestrian</option>
                <option value="City Bus">City Bus</option>
                <option value="Rail / Shinkansen">Rail / Shinkansen</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Ferry">Maritime Ferry</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="In Progress">In Progress</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estimated Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={createForm.totalDistanceKm}
                onChange={(e) => setCreateForm({ ...createForm, totalDistanceKm: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  createErrors.totalDistanceKm ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500`}
              />
              {createErrors.totalDistanceKm && (
                <p className="text-[10px] text-rose-400">{createErrors.totalDistanceKm}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estimated Duration (mins)</label>
              <input
                type="number"
                min="0"
                value={createForm.totalDurationMinutes}
                onChange={(e) => setCreateForm({ ...createForm, totalDurationMinutes: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  createErrors.totalDurationMinutes ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500`}
              />
              {createErrors.totalDurationMinutes && (
                <p className="text-[10px] text-rose-400">{createErrors.totalDurationMinutes}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Transit Line / Route</label>
              <input
                type="text"
                placeholder="e.g. Line 206"
                value={createForm.transitLine}
                onChange={(e) => setCreateForm({ ...createForm, transitLine: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Journey Summary / Notes</label>
            <textarea
              rows={2}
              placeholder="Brief description of the journey, purpose, and planned stops..."
              value={createForm.summary}
              onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-teal-400" />
            <span>
              An initial leg will be initialized. You can append additional walking legs, transit routes, and cafe stops in the Trip Details page.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-500/20"
            >
              Save & Open Journey
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT JOURNEY DIALOG */}
      <Modal
        isOpen={Boolean(editingJourney)}
        onClose={() => setEditingJourney(null)}
        title="Edit Journey Details"
        subtitle="Modify destination, route names, or travel dates."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Journey Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Origin Point <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editForm.origin}
                onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              {editErrors.origin && (
                <p className="text-[10px] text-rose-400">{editErrors.origin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Final Destination <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={editForm.destination}
                onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              {editErrors.destination && (
                <p className="text-[10px] text-rose-400">{editErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Travel Date</label>
              <input
                type="date"
                value={editForm.travelDate}
                onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Primary Mode</label>
              <input
                type="text"
                value={editForm.primaryTransportMode}
                onChange={(e) => setEditForm({ ...editForm, primaryTransportMode: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="In Progress">In Progress</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Summary</label>
            <textarea
              rows={2}
              value={editForm.summary}
              onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingJourney(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Modal
        isOpen={Boolean(deletingJourney)}
        onClose={() => setDeletingJourney(null)}
        title="Delete Trip Chain"
        subtitle="This action will remove this journey and its segments from local storage."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300">
                Are you sure you want to delete this trip chain?
              </span>
              <p className="text-xs text-slate-300">
                "{deletingJourney?.title}" connecting {deletingJourney?.origin} to {deletingJourney?.destination} will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeletingJourney(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Keep Journey
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
            >
              Delete Trip Chain
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
