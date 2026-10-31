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
  Ship,
  Bike,
  X,
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
    settings,
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
            (j.segments || j.travelSegments || []).map((s) => s.type || s.mode).join(' ')
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
          if (activeModeFilter === 'Multimodal' && (j.segments?.length || j.travelSegments?.length || 0) < 2) return false;
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
          const segs = j.segments || j.travelSegments || [];
          const matchSegments = segs.some(
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
          return (b.totalDistanceKm || b.distanceKm || 0) - (a.totalDistanceKm || a.distanceKm || 0);
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

  const formatDist = (km) => {
    const num = Number(km) || 0;
    if (settings?.distanceUnit === 'mi') {
      return `${Math.round(num * 0.621371)} mi`;
    }
    return `${num} km`;
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
              {journeys.length} Planned
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Explore and manage your multi-modal itineraries, ordered segment chains, and travel legs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Journey</span>
        </button>
      </div>

      {/* Streamlined Single Filter & Search Toolbar */}
      <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, origin, destination, or transit line..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Draft">Draft</option>
          </select>

          {/* Mode Dropdown */}
          <select
            value={activeModeFilter}
            onChange={(e) => setActiveModeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500"
          >
            <option value="All">All Modes</option>
            <option value="Walking">Walking</option>
            <option value="Bus">Bus</option>
            <option value="Train">Electric Rail</option>
            <option value="Multimodal">Multimodal</option>
            <option value="Ferry">Ferry</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-teal-500"
          >
            <option value="date">Date (Newest)</option>
            <option value="distance">Distance (High to Low)</option>
            <option value="duration">Duration (High to Low)</option>
            <option value="name">Title (A-Z)</option>
          </select>

          {(searchQuery || activeStatus !== 'All' || activeModeFilter !== 'All') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-teal-400 hover:underline font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Journeys Cards Grid or Empty State */}
      {filteredJourneys.length === 0 ? (
        <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Compass className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Matching Journeys Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              We couldn't find any trips matching your current search or filters. Try adjusting your query.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create Journey</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJourneys.map((journey) => {
            const segments = journey.segments || journey.travelSegments || [];
            const originTitle = journey.origin || journey.waypoints?.[0]?.title || 'Origin';
            const destTitle = journey.destination || journey.waypoints?.[journey.waypoints.length - 1]?.title || 'Destination';
            const dist = journey.totalDistanceKm || journey.distanceKm || 0;

            return (
              <div
                key={journey.id || journey._id}
                onClick={() => navigateToJourney(journey.id || journey._id)}
                className="group relative bg-[#0f172a] rounded-2xl border border-slate-800 hover:border-teal-500/40 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/5 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Status & Controls */}
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
                        {journey.status || 'Planned'}
                      </span>

                      {journey.travelDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                          {journey.travelDate}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(journey, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit journey details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteModal(journey, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete journey"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* High-Contrast Title & Route */}
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
                    {journey.summary || `Multi-modal structured journey connecting ${originTitle} to ${destTitle}.`}
                  </p>
                </div>

                {/* Card Footer: Metrics & Leg Mini-Chain */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="text-slate-200 font-semibold">{formatDist(dist)}</span>
                    <span>•</span>
                    <span>{segments.length} {segments.length === 1 ? 'Leg' : 'Legs'}</span>
                    {journey.co2SavedKg && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">-{journey.co2SavedKg} kg CO₂</span>
                      </>
                    )}
                  </div>

                  <span className="text-teal-400 text-xs font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Journey Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Journey Chain"
          subtitle="Define origin, destination, and baseline travel attributes."
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Journey Title</label>
              <input
                type="text"
                placeholder="e.g. Kyoto Cultural Odyssey"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origin *</label>
                <input
                  type="text"
                  placeholder="e.g. Kyoto Central Station"
                  value={createForm.origin}
                  onChange={(e) => setCreateForm({ ...createForm, origin: e.target.value })}
                  className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500 ${
                    createErrors.origin ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {createErrors.origin && (
                  <span className="text-rose-400 text-[10px] mt-0.5 block">{createErrors.origin}</span>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination *</label>
                <input
                  type="text"
                  placeholder="e.g. Arashiyama Bamboo Grove"
                  value={createForm.destination}
                  onChange={(e) => setCreateForm({ ...createForm, destination: e.target.value })}
                  className={`w-full bg-slate-900 border rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500 ${
                    createErrors.destination ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
                {createErrors.destination && (
                  <span className="text-rose-400 text-[10px] mt-0.5 block">{createErrors.destination}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date *</label>
                <input
                  type="date"
                  value={createForm.travelDate}
                  onChange={(e) => setCreateForm({ ...createForm, travelDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.totalDistanceKm}
                  onChange={(e) => setCreateForm({ ...createForm, totalDistanceKm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Duration (min)</label>
                <input
                  type="number"
                  value={createForm.totalDurationMinutes}
                  onChange={(e) => setCreateForm({ ...createForm, totalDurationMinutes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Primary Mode</label>
                <select
                  value={createForm.primaryTransportMode}
                  onChange={(e) => setCreateForm({ ...createForm, primaryTransportMode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Walking">Walking</option>
                  <option value="Bus">Bus</option>
                  <option value="Train">Electric Rail</option>
                  <option value="Bus + Walking">Bus + Walking</option>
                  <option value="Train + Walking">Train + Walking</option>
                  <option value="Ferry">Ferry</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Summary / Notes</label>
              <textarea
                rows={2}
                placeholder="Brief description of route goals and waypoints..."
                value={createForm.summary}
                onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
              >
                Create Journey
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Journey Modal */}
      {editingJourney && (
        <Modal
          isOpen={true}
          onClose={() => setEditingJourney(null)}
          title={`Edit "${editingJourney.title}"`}
          subtitle="Update route properties, status, or date."
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origin *</label>
                <input
                  type="text"
                  value={editForm.origin}
                  onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination *</label>
                <input
                  type="text"
                  value={editForm.destination}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date *</label>
                <input
                  type="date"
                  value={editForm.travelDate}
                  onChange={(e) => setEditForm({ ...editForm, travelDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Summary</label>
              <textarea
                rows={2}
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingJourney(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingJourney && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingJourney(null)}
          title="Delete Journey Chain"
          subtitle={`Are you sure you want to remove "${deletingJourney.title}"?`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              This action will remove the journey and its associated segment legs from your collection.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingJourney(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
              >
                Delete Journey
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
