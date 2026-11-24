import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Compass,
  ArrowRight,
  Sparkles,
  Trash2,
  Edit3,
  X,
  MapPin,
  Calendar,
  Layers,
  Copy,
  Hotel,
  Route,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import { searchLocation } from '../services/geocoding';
import { formatCurrency } from '../services/currency';

export default function JourneysPage() {
  const {
    journeys,
    navigateToJourney,
    createJourney,
    editJourney,
    duplicateJourney,
    deleteJourney,
    settings,
  } = useApp();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('All'); // 'All' | 'In Progress' | 'Completed' | 'Upcoming' | 'Draft'
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'distance' | 'name'

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState(null);
  const [deletingJourney, setDeletingJourney] = useState(null);

  // Form State for Simplified Create Trip
  const [createForm, setCreateForm] = useState({
    title: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
  });

  const [originLocation, setOriginLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [createErrors, setCreateErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Edit
  const [editForm, setEditForm] = useState({
    title: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    status: '',
    notes: '',
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

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (j.title || '').toLowerCase().includes(q);
          const matchOrigin = (j.origin || '').toLowerCase().includes(q);
          const matchDest = (j.destination || '').toLowerCase().includes(q);
          const matchNotes = (j.notes || j.summary || '').toLowerCase().includes(q);
          const segs = j.segments || j.travelSegments || [];
          const matchSegments = segs.some(
            (s) =>
              (s.title || '').toLowerCase().includes(q) ||
              (s.origin || s.from || '').toLowerCase().includes(q) ||
              (s.destination || s.to || '').toLowerCase().includes(q)
          );

          return matchTitle || matchOrigin || matchDest || matchNotes || matchSegments;
        }

        return true;
      })
      .sort((a, b) => {
        const distA = Number(a.totalDistanceKm != null ? a.totalDistanceKm : a.distanceKm) || 0;
        const distB = Number(b.totalDistanceKm != null ? b.totalDistanceKm : b.distanceKm) || 0;
        if (sortBy === 'distance') {
          return distB - distA;
        }
        if (sortBy === 'name') {
          return (a.title || '').localeCompare(b.title || '');
        }
        // default: date newest first
        const dateA = new Date(a.startDate || a.travelDate || '1970-01-01');
        const dateB = new Date(b.startDate || b.travelDate || '1970-01-01');
        return dateB - dateA;
      });
  }, [journeys, activeStatus, searchQuery, sortBy]);

  // Handle Lightweight Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const rawOrigin = createForm.origin.trim();
    const rawDest = createForm.destination.trim();

    if (!rawOrigin) {
      errors.origin = 'Origin location is required';
    }
    if (!rawDest) {
      errors.destination = 'Destination location is required';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsSubmitting(true);

    // Resolve coordinates if typed without clicking autocomplete suggestion
    let resolvedOrigin = originLocation;
    let resolvedDest = destinationLocation;

    try {
      if (!resolvedOrigin?.lat && rawOrigin) {
        const matches = await searchLocation(rawOrigin, 1);
        if (matches && matches.length > 0) {
          resolvedOrigin = matches[0];
        }
      }
      if (!resolvedDest?.lat && rawDest) {
        const matches = await searchLocation(rawDest, 1);
        if (matches && matches.length > 0) {
          resolvedDest = matches[0];
        }
      }

      const generatedTitle =
        createForm.title.trim() || `${rawOrigin} ➔ ${rawDest}`;

      const waypoints = [];
      if (resolvedOrigin?.lat && resolvedOrigin?.lng) {
        waypoints.push({
          id: `wp-${Date.now()}-origin`,
          title: resolvedOrigin.name || rawOrigin,
          coords: [resolvedOrigin.lat, resolvedOrigin.lng],
          category: 'origin',
          isOrigin: true,
          completed: false,
        });
      }
      if (resolvedDest?.lat && resolvedDest?.lng) {
        waypoints.push({
          id: `wp-${Date.now()}-dest`,
          title: resolvedDest.name || rawDest,
          coords: [resolvedDest.lat, resolvedDest.lng],
          category: 'destination',
          isDestination: true,
          completed: false,
        });
      }

      const newTripData = {
        title: generatedTitle,
        origin: rawOrigin,
        destination: rawDest,
        startDate: createForm.startDate || '',
        endDate: createForm.endDate || '',
        travelDate: createForm.startDate || '',
        isUndated: !createForm.startDate && !createForm.endDate,
        status: 'Upcoming',
        waypoints: waypoints,
        segments: [], // Starts completely clean: no fake legs
        stays: [],
        places: [],
        expenses: [],
        center: resolvedDest?.lat ? [resolvedDest.lat, resolvedDest.lng] : [35.0, 135.0],
        zoom: 12,
        notes: '',
      };

      const created = await createJourney(newTripData);
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        origin: '',
        destination: '',
        startDate: '',
        endDate: '',
      });
      setOriginLocation(null);
      setDestinationLocation(null);
      setCreateErrors({});
    } catch (err) {
      console.error('Failed to create trip:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (journey, e) => {
    e.stopPropagation();
    setEditingJourney(journey);
    setEditForm({
      title: journey.title || '',
      origin: journey.origin || '',
      destination: journey.destination || '',
      startDate: journey.startDate || journey.travelDate || '',
      endDate: journey.endDate || '',
      status: journey.status || 'Upcoming',
      notes: journey.notes || journey.summary || '',
    });
    setEditErrors({});
  };

  const validateEdit = () => {
    const errors = {};
    if (!editForm.origin.trim()) errors.origin = 'Origin location is required';
    if (!editForm.destination.trim()) errors.destination = 'Destination location is required';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateEdit() || !editingJourney) return;

    editJourney(editingJourney.id || editingJourney._id, {
      title: editForm.title.trim() || `${editForm.origin} ➔ ${editForm.destination}`,
      origin: editForm.origin.trim(),
      destination: editForm.destination.trim(),
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      travelDate: editForm.startDate,
      isUndated: !editForm.startDate && !editForm.endDate,
      status: editForm.status,
      notes: editForm.notes.trim(),
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
      deleteJourney(deletingJourney.id || deletingJourney._id);
      setDeletingJourney(null);
    }
  };

  const handleDuplicate = async (journey, e) => {
    e.stopPropagation();
    await duplicateJourney(journey.id || journey._id);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveStatus('All');
    setSortBy('date');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-travel-primary tracking-tight flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-travel-accent" />
              My Trips & Itineraries
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-travel-subtle text-travel-secondary border border-travel font-mono">
              {journeys.length} {journeys.length === 1 ? 'Trip' : 'Trips'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-travel-secondary mt-1 max-w-2xl">
            Create new trips, plan multi-leg transport routes, manage stays, and track travel expenses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setCreateErrors({});
          }}
          className="px-5 py-2.5 rounded-xl btn-travel-primary text-xs sm:text-sm transition flex items-center gap-2 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Trip</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-travel-card p-3.5 rounded-2xl border border-travel shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-travel-primary">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-travel-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by trip name, origin, destination, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-travel-subtle border border-travel rounded-xl pl-9 pr-9 py-2 text-xs font-medium text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-travel-secondary hover:text-travel-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-semibold text-travel-primary focus:outline-none focus:border-travel-accent"
          >
            <option value="All">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-semibold text-travel-primary focus:outline-none focus:border-travel-accent"
          >
            <option value="date">Date (Newest)</option>
            <option value="distance">Distance</option>
            <option value="name">Title (A-Z)</option>
          </select>

          {(searchQuery || activeStatus !== 'All') && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-travel-accent hover:underline font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Trips Cards Grid or Empty State */}
      {filteredJourneys.length === 0 ? (
        <div className="bg-travel-card rounded-3xl border border-travel p-12 text-center space-y-4 shadow-sm text-travel-primary">
          <div className="w-16 h-16 rounded-2xl bg-travel-subtle flex items-center justify-center mx-auto text-travel-accent">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-travel-primary">
              {journeys.length === 0 ? 'No Trips Planned Yet' : 'No Matching Trips Found'}
            </h3>
            <p className="text-xs text-travel-secondary mt-1 max-w-md mx-auto">
              {journeys.length === 0
                ? 'Create your first personal trip to explore transport connections, book stays, and track itinerary expenses.'
                : "We couldn't find any trips matching your query. Try resetting your search."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {journeys.length > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-card border border-travel text-travel-secondary text-xs font-semibold transition"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(true);
                setCreateErrors({});
              }}
              className="px-5 py-2.5 rounded-xl btn-travel-primary text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{journeys.length === 0 ? 'Plan Your First Trip' : 'Create Trip'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredJourneys.map((journey) => {
            const segments = journey.segments || journey.travelSegments || [];
            const stays = journey.stays || [];
            const places = journey.places || [];
            const originTitle = journey.origin || 'Origin';
            const destTitle = journey.destination || 'Destination';

            return (
              <div
                key={journey.id || journey._id}
                onClick={() => navigateToJourney(journey.id || journey._id)}
                className="group relative bg-travel-card rounded-2xl border border-travel hover:border-travel-strong p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between text-travel-primary"
              >
                <div>
                  {/* Top Status & Controls */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1.5 border ${
                          journey.status === 'In Progress' || journey.status === 'Active'
                            ? 'bg-travel-accent-soft text-travel-accent border-travel'
                            : journey.status === 'Completed'
                            ? 'bg-travel-subtle text-travel-secondary border-travel'
                            : journey.status === 'Draft'
                            ? 'bg-travel-subtle text-travel-muted border-travel'
                            : 'bg-travel-accent-soft text-travel-accent border-travel'
                        }`}
                      >
                        {journey.status || 'Upcoming'}
                      </span>

                      {journey.startDate ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-travel-subtle text-travel-secondary font-mono flex items-center gap-1 border border-travel">
                          <Calendar className="w-3 h-3 text-travel-secondary" />
                          {journey.startDate}
                          {journey.endDate && journey.endDate !== journey.startDate ? ` ➔ ${journey.endDate}` : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-travel-subtle text-travel-muted font-mono">
                          Undated Trip
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(journey, e)}
                        className="p-1.5 rounded-lg text-travel-secondary hover:text-travel-accent hover:bg-travel-subtle transition"
                        title="Duplicate trip"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openEditModal(journey, e)}
                        className="p-1.5 rounded-lg text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle transition"
                        title="Edit trip details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => openDeleteModal(journey, e)}
                        className="p-1.5 rounded-lg text-travel-secondary hover:text-rose-500 hover:bg-travel-subtle transition"
                        title="Delete trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Route */}
                  <h3 className="text-base font-bold text-travel-primary group-hover:text-travel-accent transition-colors line-clamp-1">
                    {journey.title}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-travel-secondary">
                    <span className="truncate max-w-[150px] sm:max-w-[180px] text-travel-accent">
                      {originTitle}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-travel-muted shrink-0" />
                    <span className="truncate max-w-[150px] sm:max-w-[180px] text-travel-primary">
                      {destTitle}
                    </span>
                  </div>

                  {journey.notes && (
                    <p className="text-xs text-travel-secondary mt-2 line-clamp-2 leading-relaxed">
                      {journey.notes}
                    </p>
                  )}
                </div>

                {/* Card Footer: Metadata Counts & Action */}
                <div className="mt-4 pt-3 border-t border-travel flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-travel-secondary font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Route className="w-3 h-3 text-travel-secondary" />
                      {segments.length} {segments.length === 1 ? 'Leg' : 'Legs'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Hotel className="w-3 h-3 text-travel-secondary" />
                      {stays.length} {stays.length === 1 ? 'Stay' : 'Stays'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-travel-secondary" />
                      {places.length} {places.length === 1 ? 'Place' : 'Places'}
                    </span>
                  </div>

                  <span className="text-travel-accent text-xs font-bold group-hover:translate-x-1 transition flex items-center gap-1">
                    <span>Plan Trip</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simplified Initial Add Trip Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateOpen(false)}
          title="Plan a New Trip"
          subtitle="Define where you are going. You will discover transport options, add stays, and build your itinerary inside the trip workspace."
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs text-travel-primary">
            {/* Trip Title (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-travel-primary mb-1.5">
                Trip Title
                <span className="text-travel-muted font-normal ml-1.5">(Optional — defaults to route)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Summer Vacation in Tokyo, Weekend in Kyoto..."
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2.5 text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent text-xs transition"
              />
            </div>

            {/* Origin & Destination Autocomplete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <LocationAutocomplete
                label="Origin Departure"
                required
                placeholder="Departure city or landmark..."
                value={createForm.origin}
                selectedLocation={originLocation}
                onChange={(text) => {
                  setCreateForm((prev) => ({ ...prev, origin: text }));
                  if (!text) setOriginLocation(null);
                }}
                onSelect={(item) => {
                  setOriginLocation(item);
                  setCreateForm((prev) => ({ ...prev, origin: item ? item.name : '' }));
                  if (createErrors.origin) setCreateErrors((prev) => ({ ...prev, origin: null }));
                }}
                error={createErrors.origin}
                icon={MapPin}
              />

              <LocationAutocomplete
                label="Destination Arrival"
                required
                placeholder="Destination city or landmark..."
                value={createForm.destination}
                selectedLocation={destinationLocation}
                onChange={(text) => {
                  setCreateForm((prev) => ({ ...prev, destination: text }));
                  if (!text) setDestinationLocation(null);
                }}
                onSelect={(item) => {
                  setDestinationLocation(item);
                  setCreateForm((prev) => ({ ...prev, destination: item ? item.name : '' }));
                  if (createErrors.destination) setCreateErrors((prev) => ({ ...prev, destination: null }));
                }}
                error={createErrors.destination}
                icon={Compass}
              />
            </div>

            {/* Optional Travel Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-travel-primary mb-1.5">
                  Departure Date
                  <span className="text-travel-muted font-normal ml-1.5">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2.5 text-travel-primary focus:outline-none focus:border-travel-accent text-xs transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-primary mb-1.5">
                  Return Date
                  <span className="text-travel-muted font-normal ml-1.5">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={createForm.endDate}
                  onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2.5 text-travel-primary focus:outline-none focus:border-travel-accent text-xs transition"
                />
              </div>
            </div>

            <p className="text-[11px] text-travel-secondary bg-travel-subtle p-2.5 rounded-xl border border-travel">
              💡 You do not need to choose a transport mode now. Once your trip is created, you will explore real trains, buses, driving routes, and stays in your dedicated workspace.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-travel-subtle hover:bg-travel-card border border-travel text-travel-secondary font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl btn-travel-primary disabled:opacity-50 text-xs transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Trip & Plan Itinerary</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Trip Modal */}
      {editingJourney && (
        <Modal
          isOpen={true}
          onClose={() => setEditingJourney(null)}
          title={`Edit "${editingJourney.title}"`}
          subtitle="Update destination details, dates, or travel notes."
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs text-travel-primary">
            <div>
              <label className="block text-travel-primary font-semibold mb-1">Trip Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-primary font-semibold mb-1">Origin *</label>
                <input
                  type="text"
                  value={editForm.origin}
                  onChange={(e) => setEditForm({ ...editForm, origin: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
                />
                {editErrors.origin && <span className="text-rose-500 text-[10px] mt-0.5 block">{editErrors.origin}</span>}
              </div>
              <div>
                <label className="block text-travel-primary font-semibold mb-1">Destination *</label>
                <input
                  type="text"
                  value={editForm.destination}
                  onChange={(e) => setEditForm({ ...editForm, destination: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
                />
                {editErrors.destination && <span className="text-rose-500 text-[10px] mt-0.5 block">{editErrors.destination}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-primary font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary focus:outline-none focus:border-travel-accent"
                />
              </div>
              <div>
                <label className="block text-travel-primary font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary focus:outline-none focus:border-travel-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-travel-primary font-semibold mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-travel-primary font-semibold mb-1">Trip Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setEditingJourney(null)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-card border border-travel text-travel-secondary font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-travel-primary font-bold transition"
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
          title="Delete Trip"
          subtitle={`Are you sure you want to remove "${deletingJourney.title}"?`}
        >
          <div className="space-y-4 text-xs text-travel-primary">
            <p className="text-travel-secondary leading-relaxed">
              This action will remove the trip, all confirmed transport legs, stays, places, and associated expenses from your library.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setDeletingJourney(null)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-card border border-travel text-travel-secondary font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
              >
                Delete Trip
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
