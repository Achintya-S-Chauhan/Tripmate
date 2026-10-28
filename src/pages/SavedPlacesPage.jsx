import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Plus,
  Search,
  Star,
  MapPin,
  Clock,
  ExternalLink,
  Trash2,
  Tag,
  Compass,
  CheckCircle2,
  Share2,
  Shield,
  Layers,
  Radio,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import InteractiveMap from '../components/map/InteractiveMap';

export default function SavedPlacesPage() {
  const {
    savedPlaces,
    toggleSavedPlace,
    addSavedPlace,
    editSavedPlace,
    removeSavedPlace,
    geofenceEventLogs,
    simulateGeofenceEvent,
    clearGeofenceEventLogs,
    activeJourney,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRadiusFilter, setSelectedRadiusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mapPreviewPlace, setMapPreviewPlace] = useState(null);
  const [deletingPlace, setDeletingPlace] = useState(null);
  const [formError, setFormError] = useState('');

  // New place / safe zone form state
  const [newPlace, setNewPlace] = useState({
    name: '',
    category: 'Hotel',
    city: 'Kyoto',
    country: 'Japan',
    address: '',
    rating: '4.8',
    hours: '24/7 Access',
    tags: 'Safe Haven, Concierge',
    notes: '',
    radiusMeters: 250,
    lat: '35.0037',
    lng: '135.7770',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    isMustVisit: true,
  });

  const categories = ['All', 'Hotel', 'Tourist Spot', 'Checkpoint', 'Dining', 'Transit Hub'];

  // Convenient coordinate presets
  const COORD_PRESETS = [
    { label: 'Gion District Base (Kyoto)', lat: 35.0037, lng: 135.7770, category: 'Hotel' },
    { label: 'Kyoto Central Rail Hub', lat: 34.9858, lng: 135.7588, category: 'Transit Hub' },
    { label: 'Prefectural Safety Desk', lat: 35.0210, lng: 135.7540, category: 'Checkpoint' },
    { label: 'Fushimi Inari Trailhead', lat: 34.9671, lng: 135.7727, category: 'Tourist Spot' },
    { label: 'Ogawa Coffee Roasters', lat: 35.0312, lng: 135.7792, category: 'Dining' },
  ];

  const filteredPlaces = useMemo(() => {
    return savedPlaces.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        // Also support legacy category names
        if (selectedCategory === 'Hotel' && p.category !== 'Lodging') return false;
        if (selectedCategory === 'Tourist Spot' && p.category !== 'Sights') return false;
        if (selectedCategory === 'Checkpoint' && p.category !== 'Emergency') return false;
        if (selectedCategory === 'Transit Hub' && p.category !== 'Transit') return false;
        if (p.category !== selectedCategory && !['Lodging', 'Sights', 'Emergency', 'Transit'].includes(p.category)) {
          return false;
        }
      }

      // Radius filter
      const rad = p.radiusMeters || 250;
      if (selectedRadiusFilter === '<250m' && rad >= 250) return false;
      if (selectedRadiusFilter === '250m-500m' && (rad < 250 || rad > 500)) return false;
      if (selectedRadiusFilter === '>500m' && rad <= 500) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchNotes = p.notes?.toLowerCase().includes(q);
        const matchAddress = p.address?.toLowerCase().includes(q);
        const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        return matchName || matchNotes || matchAddress || matchTag;
      }
      return true;
    });
  }, [savedPlaces, selectedCategory, selectedRadiusFilter, searchQuery]);

  const insideCount = savedPlaces.filter((p) => p.currentStatus === 'inside').length;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!newPlace.name.trim()) {
      setFormError('Please provide a place / safe zone name.');
      return;
    }

    const latNum = parseFloat(newPlace.lat);
    const lngNum = parseFloat(newPlace.lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    addSavedPlace({
      ...newPlace,
      coords: [latNum, lngNum],
      radiusMeters: parseInt(newPlace.radiusMeters, 10) || 250,
      tags: typeof newPlace.tags === 'string'
        ? newPlace.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : newPlace.tags,
    });

    setIsAddModalOpen(false);
    setNewPlace({
      name: '',
      category: 'Hotel',
      city: 'Kyoto',
      country: 'Japan',
      address: '',
      rating: '4.8',
      hours: '24/7 Access',
      tags: 'Safe Haven, Concierge',
      notes: '',
      radiusMeters: 250,
      lat: '35.0037',
      lng: '135.7770',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      isMustVisit: true,
    });
  };

  const applyCoordPreset = (preset) => {
    setNewPlace((prev) => ({
      ...prev,
      lat: preset.lat.toString(),
      lng: preset.lng.toString(),
      category: preset.category,
      address: preset.label,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-teal-400" />
            Saved Places & Safe Zones (Geofencing)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Curated safe havens, transit hubs, and checkpoints with customizable perimeter geofences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            {savedPlaces.length} Safe Zones
          </span>

          <button
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Safe Zone
          </button>
        </div>
      </div>

      {/* 1. GEOFENCE MAP PANEL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-400" />
            Geofence Safe Zone Perimeter Map
          </span>
          <span className="text-[11px] text-teal-400 font-mono font-medium">
            ● {insideCount} Safe Perimeters Currently Active
          </span>
        </div>

        <InteractiveMap
          waypoints={[]}
          savedZones={savedPlaces}
          onSimulateGeofence={simulateGeofenceEvent}
          center={[35.008, 135.765]}
          zoom={13}
          height="400px"
          destinationTitle="Kyoto Safe Havens & Geofenced Safe Zones"
          currentLocation={{
            name: 'Gion District Base, Kyoto',
            coords: [35.0037, 135.7770],
            updatedAgo: 'Just now (Simulated)',
          }}
        />
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Radius Filter & Search */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedRadiusFilter}
              onChange={(e) => setSelectedRadiusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="All">All Radii</option>
              <option value="<250m">Radius &lt; 250m</option>
              <option value="250m-500m">Radius 250m - 500m</option>
              <option value=">500m">Radius &gt; 500m</option>
            </select>

            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search places & safe zones..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PLACES & SAFE ZONES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlaces.map((place) => {
          const isInside = place.currentStatus === 'inside';
          const radius = place.radiusMeters || 250;

          return (
            <div
              key={place.id}
              className={`bg-[#0f172a] rounded-2xl border transition flex flex-col group overflow-hidden shadow-xl ${
                isInside
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Image & Overlay Badges */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                <img
                  src={place.imageUrl}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />

                {/* Category Pill */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 backdrop-blur-md text-teal-300 border border-slate-700 shadow-md">
                    {place.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/90 backdrop-blur-md text-slate-200 border border-slate-700">
                    {radius}m Radius
                  </span>
                </div>

                {/* Bookmark Toggle */}
                <button
                  type="button"
                  onClick={() => toggleSavedPlace(place.id)}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition shadow-md ${
                    place.isMustVisit
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white'
                  }`}
                  title={place.isMustVisit ? 'Marked as Must Visit' : 'Bookmark as Must Visit'}
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>

                {/* Presence Status Pill */}
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 border shadow-md ${
                      isInside
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 animate-pulse'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isInside ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                    />
                    {isInside ? 'INSIDE SAFE PERIMETER' : 'OUTSIDE PERIMETER'}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700 text-xs font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{place.rating}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-teal-300 transition line-clamp-1">
                    {place.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{place.address}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{place.hours}</span>
                  </div>

                  {place.notes && (
                    <p className="text-xs text-slate-300 mt-2.5 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40 line-clamp-2 leading-relaxed">
                      "{place.notes}"
                    </p>
                  )}
                </div>

                {/* Simulation Control Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Geofence Simulator</span>
                    <span className="font-mono text-slate-500">{radius}m Boundary</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => simulateGeofenceEvent(place.id, 'ENTRY')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isInside
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Simulate Entry
                    </button>

                    <button
                      type="button"
                      onClick={() => simulateGeofenceEvent(place.id, 'EXIT')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        !isInside
                          ? 'bg-slate-800 text-slate-200 border border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Simulate Exit
                    </button>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setMapPreviewPlace(place)}
                    className="text-teal-400 hover:text-teal-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Geo Coords: {place.coords ? place.coords.join(', ') : 'N/A'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingPlace(place)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Remove Safe Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. CHRONOLOGICAL GEOFENCE EVENT HISTORY LOG */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              Chronological Geofence Event History
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated log of perimeter entries, departures, and automated proximity reassurance triggers.
            </p>
          </div>

          {geofenceEventLogs.length > 0 && (
            <button
              type="button"
              onClick={clearGeofenceEventLogs}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition shrink-0 self-start sm:self-center"
            >
              Clear Event History
            </button>
          )}
        </div>

        {geofenceEventLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No simulated geofence events recorded yet. Click "Simulate Entry" or "Simulate Exit" on any safe zone to generate trigger events.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
            {geofenceEventLogs.map((log) => {
              const isEntry = log.eventType === 'ENTRY';

              return (
                <div
                  key={log.id}
                  className="bg-slate-800/40 rounded-xl p-3.5 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider shrink-0 mt-0.5 ${
                        isEntry
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {log.eventType}
                    </span>

                    <div className="space-y-0.5">
                      <div className="font-extrabold text-white text-xs">
                        {log.placeName} ({log.radiusMeters}m perimeter)
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {log.note}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center font-mono text-[11px] text-slate-400">
                    <span>{log.timestamp}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Simulated
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-[11px] text-slate-500 font-mono pt-1">
          * Safety note: All geofence entry and exit events are client-side simulations. Background device location services are not accessed.
        </div>
      </div>

      {/* MODAL: CREATE SAFE ZONE / SAVED PLACE */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Create Safe Zone & Geofence"
          subtitle="Configure a safe perimeter, coordinates, and automated proximity alerts."
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Safe Zone / Venue Name *
              </label>
              <input
                type="text"
                required
                value={newPlace.name}
                onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                placeholder="e.g. Kyoto Imperial Safe Checkpoint or Celestine Base"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={newPlace.category}
                  onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Tourist Spot">Tourist Spot</option>
                  <option value="Checkpoint">Checkpoint</option>
                  <option value="Dining">Dining</option>
                  <option value="Transit Hub">Transit Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Geofence Radius *
                </label>
                <select
                  value={newPlace.radiusMeters}
                  onChange={(e) => setNewPlace({ ...newPlace, radiusMeters: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value={100}>100m (Tight Single Building)</option>
                  <option value={250}>250m (Property & Grounds - Standard)</option>
                  <option value={500}>500m (Neighborhood Safe Haven)</option>
                  <option value={1000}>1,000m (District Perimeter)</option>
                </select>
              </div>
            </div>

            {/* Coordinate Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quick Coordinate Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COORD_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCoordPreset(p)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[10px] font-medium border border-slate-700/60 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Latitude * (-90 to 90)
                </label>
                <input
                  type="text"
                  required
                  value={newPlace.lat}
                  onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })}
                  placeholder="35.0037"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Longitude * (-180 to 180)
                </label>
                <input
                  type="text"
                  required
                  value={newPlace.lng}
                  onChange={(e) => setNewPlace({ ...newPlace, lng: e.target.value })}
                  placeholder="135.7770"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Street Address / Location Note
              </label>
              <input
                type="text"
                value={newPlace.address}
                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                placeholder="e.g. 572 Komatsucho, Higashiyama Ward, Kyoto"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Traveler Notes & Tips
              </label>
              <textarea
                rows={2}
                value={newPlace.notes}
                onChange={(e) => setNewPlace({ ...newPlace, notes: e.target.value })}
                placeholder="24/7 staff support, multilingual foreign intake desk, safe retreat point..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-teal-500/20"
              >
                Create Safe Zone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DELETE SAFE ZONE CONFIRMATION */}
      {deletingPlace && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingPlace(null)}
          title="Remove Safe Zone"
          subtitle="Accidental deletion protection."
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{deletingPlace.name}</strong> from your saved safe zones? Its geofence boundary ({deletingPlace.radiusMeters || 250}m) will no longer appear on your safety map.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingPlace(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Keep Safe Zone
              </button>
              <button
                type="button"
                onClick={() => {
                  removeSavedPlace(deletingPlace.id);
                  setDeletingPlace(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Yes, Remove Safe Zone
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: VIEW GEO COORDS */}
      {mapPreviewPlace && (
        <Modal
          isOpen={true}
          onClose={() => setMapPreviewPlace(null)}
          title={mapPreviewPlace.name}
          subtitle={`${mapPreviewPlace.category} • ${mapPreviewPlace.radiusMeters || 250}m Safe Radius`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Coordinates:</span>
                <span className="font-mono font-bold text-teal-400">
                  {mapPreviewPlace.coords?.join(', ') || '35.0116, 135.7681'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Safe Perimeter Radius:</span>
                <span className="font-mono text-white">{mapPreviewPlace.radiusMeters || 250} meters</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Presence Status:</span>
                <span className="font-mono text-emerald-400 font-bold uppercase">
                  {mapPreviewPlace.currentStatus === 'inside' ? 'INSIDE ZONE' : 'OUTSIDE ZONE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Address:</span>
                <span className="text-white">{mapPreviewPlace.address}</span>
              </div>
            </div>

            <p className="text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
              {mapPreviewPlace.notes || 'No custom notes provided.'}
            </p>

            <button
              onClick={() => setMapPreviewPlace(null)}
              className="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
            >
              Close Coords
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}