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
  Loader2,
  AlertOctagon,
  Power,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import InteractiveMap from '../components/map/InteractiveMap';
import { searchLocation } from '../services/geocoding';

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
    // Real Danger Zones
    dangerZones,
    addDangerZone,
    editDangerZone,
    removeDangerZone,
    toggleDangerZone,
    simulateDangerZoneEntry,
    activeDangerBreach,
  } = useApp();

  // Active sub-tab: 'safe-zones' | 'danger-zones' | 'logs'
  const [activeTab, setActiveTab] = useState('safe-zones');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRadiusFilter, setSelectedRadiusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddDangerModalOpen, setIsAddDangerModalOpen] = useState(false);
  const [editingDangerZone, setEditingDangerZone] = useState(null);
  const [mapPreviewPlace, setMapPreviewPlace] = useState(null);
  const [deletingPlace, setDeletingPlace] = useState(null);
  const [deletingDangerZone, setDeletingDangerZone] = useState(null);
  const [formError, setFormError] = useState('');

  // Geocoding helper in Add Modal
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoSearchResults, setGeoSearchResults] = useState([]);
  const [isGeoSearching, setIsGeoSearching] = useState(false);

  // New place / safe zone form state
  const [newPlace, setNewPlace] = useState({
    name: '',
    category: 'Hotel',
    city: 'Vidisha',
    country: 'India',
    address: '',
    rating: '4.8',
    hours: '24/7 Access',
    tags: 'Safe Haven, Concierge',
    notes: '',
    radiusMeters: 250,
    lat: '23.5251',
    lng: '77.8081',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    isMustVisit: true,
  });

  // Danger zone form state
  const [dangerForm, setDangerForm] = useState({
    name: '',
    hazardType: 'Flood Risk',
    lat: '23.5350',
    lng: '77.8150',
    radiusMeters: 400,
    isActive: true,
    notes: '',
    address: '',
  });

  const categories = ['All', 'Hotel', 'Tourist Spot', 'Checkpoint', 'Dining', 'Transit Hub'];

  // Indian and regional coordinate presets
  const COORD_PRESETS = [
    { label: 'Vidisha Rail Junction (Madhya Pradesh)', lat: 23.5251, lng: 77.8081, category: 'Transit Hub' },
    { label: 'Bhopal Central Safety Desk (MP)', lat: 23.2599, lng: 77.4126, category: 'Checkpoint' },
    { label: 'Indore Rajwada Base (MP)', lat: 22.7196, lng: 75.8577, category: 'Hotel' },
    { label: 'New Delhi Connaught Hub', lat: 28.6315, lng: 77.2167, category: 'Transit Hub' },
    { label: 'Gion District Base (Kyoto)', lat: 35.0037, lng: 135.7770, category: 'Hotel' },
  ];

  const filteredPlaces = useMemo(() => {
    return savedPlaces.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
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
  const activeDangerCount = dangerZones.filter((z) => z.isActive).length;

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
    });

    setIsAddModalOpen(false);
    setNewPlace({
      name: '',
      category: 'Hotel',
      city: 'Vidisha',
      country: 'India',
      address: '',
      rating: '4.8',
      hours: '24/7 Access',
      tags: 'Safe Haven, Concierge',
      notes: '',
      radiusMeters: 250,
      lat: '23.5251',
      lng: '77.8081',
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      isMustVisit: true,
    });
    setGeoSearchQuery('');
    setGeoSearchResults([]);
  };

  const handleDangerSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!dangerForm.name.trim()) {
      setFormError('Please provide a danger zone name.');
      return;
    }

    const latNum = parseFloat(dangerForm.lat);
    const lngNum = parseFloat(dangerForm.lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setFormError('Please provide valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }

    const payload = {
      name: dangerForm.name.trim(),
      hazardType: dangerForm.hazardType,
      coords: [latNum, lngNum],
      radiusMeters: parseInt(dangerForm.radiusMeters, 10) || 300,
      isActive: Boolean(dangerForm.isActive),
      notes: dangerForm.notes.trim(),
    };

    if (editingDangerZone) {
      editDangerZone(editingDangerZone.id, payload);
      setEditingDangerZone(null);
    } else {
      addDangerZone(payload);
    }

    setIsAddDangerModalOpen(false);
    setDangerForm({
      name: '',
      hazardType: 'Flood Risk',
      lat: '23.5350',
      lng: '77.8150',
      radiusMeters: 400,
      isActive: true,
      notes: '',
      address: '',
    });
  };

  const handleGeoSearch = async (e) => {
    e?.preventDefault();
    if (!geoSearchQuery.trim()) return;
    setIsGeoSearching(true);
    try {
      const results = await searchLocation(geoSearchQuery);
      setGeoSearchResults(results);
    } catch {
      setGeoSearchResults([]);
    } finally {
      setIsGeoSearching(false);
    }
  };

  const handleSelectGeoResult = (result) => {
    setNewPlace((prev) => ({
      ...prev,
      name: prev.name || result.name,
      lat: result.lat.toString(),
      lng: result.lng.toString(),
      address: result.displayName,
      city: result.city || prev.city,
      country: result.country || prev.country,
    }));
    setDangerForm((prev) => ({
      ...prev,
      name: prev.name || result.name,
      lat: result.lat.toString(),
      lng: result.lng.toString(),
      address: result.displayName,
    }));
    setGeoSearchQuery(result.name);
    setGeoSearchResults([]);
  };

  const applyCoordPreset = (preset) => {
    setNewPlace((prev) => ({
      ...prev,
      lat: preset.lat.toString(),
      lng: preset.lng.toString(),
      category: preset.category,
      address: preset.label,
    }));
    setDangerForm((prev) => ({
      ...prev,
      lat: preset.lat.toString(),
      lng: preset.lng.toString(),
      address: preset.label,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-travel-primary tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-travel-accent" />
            Saved Places & Hazard Geofencing
          </h2>
          <p className="text-xs text-travel-muted mt-1">
            Curated safe havens, transit hubs, and real danger-zone perimeters with automatic 60s escalation countdown.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'danger-zones' ? (
            <button
              onClick={() => {
                setFormError('');
                setEditingDangerZone(null);
                setDangerForm({
                  name: '',
                  hazardType: 'Flood Risk',
                  lat: '23.5350',
                  lng: '77.8150',
                  radiusMeters: 400,
                  isActive: true,
                  notes: '',
                  address: '',
                });
                setIsAddDangerModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            >
              <AlertOctagon className="w-4 h-4" />
              Add Danger Zone
            </button>
          ) : (
            <button
              onClick={() => {
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl btn-travel-primary font-bold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Safe Zone
            </button>
          )}
        </div>
      </div>

      {/* 1. GEOFENCE MAP PANEL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-travel-secondary uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-travel-accent" />
            Geofence Safe Havens & Hazard Perimeters Map
          </span>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-emerald-500 font-medium">● {insideCount} Safe Zones Inside</span>
            <span className="text-travel-muted">•</span>
            <span className="text-rose-400 font-medium">⚠️ {activeDangerCount} Monitored Hazards</span>
          </div>
        </div>

        <InteractiveMap
          waypoints={[]}
          savedZones={savedPlaces}
          dangerZones={dangerZones}
          onSimulateGeofence={simulateGeofenceEvent}
          onSimulateDangerEntry={simulateDangerZoneEntry}
          center={null}
          height="400px"
          destinationTitle="Safe Havens & Monitored Hazard Geofences"
          currentLocation={null}
          onLocationSelect={(loc) => {
            setNewPlace((prev) => ({
              ...prev,
              name: prev.name || loc.name,
              lat: loc.lat.toString(),
              lng: loc.lng.toString(),
              address: loc.displayName,
              city: loc.city || prev.city,
              country: loc.country || prev.country,
            }));
            setIsAddModalOpen(true);
          }}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-travel pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('safe-zones')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'safe-zones'
              ? 'btn-travel-primary shadow-sm'
              : 'text-travel-muted hover:text-travel-primary hover:bg-travel-subtle'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Safe Havens & Checkpoints ({savedPlaces.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger-zones')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'danger-zones'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-travel-muted hover:text-rose-400 hover:bg-travel-subtle'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Monitored Danger Zones ({dangerZones.length})</span>
          {activeDangerBreach && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'btn-travel-primary shadow-sm'
              : 'text-travel-muted hover:text-travel-primary hover:bg-travel-subtle'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Geofence Event History ({geofenceEventLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: SAFE HAVENS & PLACES */}
      {activeTab === 'safe-zones' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-travel-card p-4 rounded-2xl border border-travel shadow-md space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? 'btn-travel-primary shadow-sm'
                        : 'bg-travel-subtle text-travel-muted hover:text-travel-primary hover:bg-travel-subtle'
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
                  className="bg-travel-subtle border border-travel text-travel-primary text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-travel-accent font-mono"
                >
                  <option value="All">All Radii</option>
                  <option value="<250m">&lt; 250m</option>
                  <option value="250m-500m">250m - 500m</option>
                  <option value=">500m">&gt; 500m</option>
                </select>

                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 text-travel-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search safe places..."
                    className="w-full bg-travel-subtle border border-travel rounded-xl pl-8 pr-3 py-1.5 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredPlaces.length === 0 ? (
            <div className="text-center py-12 bg-travel-card rounded-2xl border border-travel p-8 space-y-3">
              <Bookmark className="w-10 h-10 text-travel-accent/50 mx-auto" />
              <h3 className="text-base font-bold text-travel-primary">No Safe Havens Match Filter</h3>
              <p className="text-xs text-travel-muted max-w-sm mx-auto">
                Try resetting your filters or click "Add Safe Zone" above to map a new safe zone.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlaces.map((place) => {
                const isInside = place.currentStatus === 'inside';
                const radius = place.radiusMeters || 250;

                return (
                  <div
                    key={place.id || place._id}
                    className={`bg-travel-card rounded-2xl border overflow-hidden shadow-sm hover:shadow-elevated transition flex flex-col group ${
                      isInside ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-travel'
                    }`}
                  >
                    <div className="relative h-44 w-full bg-travel-subtle overflow-hidden">
                      <img
                        src={place.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-black/60 text-travel-primary border border-white/20">
                          {place.category}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 border shadow-md ${
                            isInside
                              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 animate-pulse'
                              : 'bg-travel-subtle text-travel-muted border-travel'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isInside ? 'bg-emerald-400' : 'bg-travel-muted'}`} />
                          {isInside ? 'INSIDE SAFE PERIMETER' : 'OUTSIDE PERIMETER'}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-travel-subtle backdrop-blur-md px-2 py-0.5 rounded-lg border border-travel text-xs font-bold text-amber-300">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{place.rating}</span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-base font-extrabold text-travel-primary group-hover:text-travel-accent transition line-clamp-1">
                          {place.name}
                        </h3>

                        <div className="flex items-center gap-1.5 text-xs text-travel-muted mt-1">
                          <MapPin className="w-3.5 h-3.5 text-travel-muted shrink-0" />
                          <span className="truncate">{place.address}</span>
                        </div>

                        {place.notes && (
                          <p className="text-xs text-travel-secondary mt-2.5 bg-travel-subtle/50 p-2.5 rounded-xl border border-travel/40 line-clamp-2 leading-relaxed">
                            "{place.notes}"
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-travel">
                        <div className="text-[10px] font-bold text-travel-muted uppercase tracking-wider flex items-center justify-between">
                          <span>Geofence Simulator</span>
                          <span className="font-mono text-travel-muted">{radius}m Boundary</span>
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
                                ? 'bg-travel-subtle text-travel-secondary border border-travel'
                                : 'bg-travel-subtle hover:bg-travel-subtle text-travel-secondary'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Simulate Exit
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-travel flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setMapPreviewPlace(place)}
                          className="text-travel-accent hover:text-travel-accent text-xs font-semibold flex items-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Geo Coords: {place.coords ? place.coords.join(', ') : 'N/A'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingPlace(place)}
                          className="p-1.5 rounded-lg text-travel-muted hover:text-rose-400 hover:bg-travel-subtle transition"
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
          )}
        </div>
      )}

      {/* TAB 2: MONITORED DANGER ZONES */}
      {activeTab === 'danger-zones' && (
        <div className="space-y-5">
          <div className="bg-travel-card p-5 rounded-2xl border border-travel space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold uppercase font-mono tracking-wider">
                Active Hazard Geofences
              </span>
              <span className="text-xs text-travel-muted font-mono">
                Automatic 60s Safety Countdown on Breach
              </span>
            </div>
            <p className="text-xs text-travel-secondary leading-relaxed">
              When your device GPS enters any monitored hazard perimeter, a 60-second safety confirmation timer immediately starts. If not dismissed via "I'm Safe", simulated distress telemetry is dispatched to your trusted contacts.
            </p>
          </div>

          {dangerZones.length === 0 ? (
            <div className="text-center py-12 bg-travel-card rounded-2xl border border-travel p-8 space-y-3">
              <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto opacity-70" />
              <h3 className="text-base font-bold text-travel-primary">No Danger Zones Configured</h3>
              <p className="text-xs text-travel-muted max-w-sm mx-auto">
                Add known high-risk, flood-prone, or construction zones to keep safety monitoring vigilant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dangerZones.map((zone) => {
                const isBreached = activeDangerBreach && activeDangerBreach.zone.id === zone.id;

                return (
                  <div
                    key={zone.id}
                    className={`bg-travel-card rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-elevated transition ${
                      isBreached
                        ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20'
                        : zone.isActive
                        ? 'border-amber-600/40'
                        : 'border-travel opacity-75'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase font-mono">
                          ⚠️ {zone.hazardType || 'Hazard'}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleDangerZone(zone.id)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                            zone.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-travel-subtle text-travel-muted border border-travel'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{zone.isActive ? 'Active' : 'Paused'}</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-travel-primary">{zone.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-travel-muted font-mono mt-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Perimeter: {zone.radiusMeters}m radius</span>
                        </div>
                        <div className="text-[11px] text-travel-muted font-mono mt-0.5">
                          Coords: {zone.coords ? zone.coords.join(', ') : 'N/A'}
                        </div>
                      </div>

                      {zone.notes && (
                        <p className="text-xs text-travel-secondary bg-travel-subtle/60 p-2.5 rounded-xl border border-travel leading-relaxed">
                          "{zone.notes}"
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-travel">
                      {/* Simulate Entry Button for testing */}
                      <button
                        type="button"
                        onClick={() => simulateDangerZoneEntry(zone.id)}
                        className="w-full py-2 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Simulate GPS Entry (Test 60s Timer)</span>
                      </button>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDangerZone(zone);
                            setDangerForm({
                              name: zone.name,
                              hazardType: zone.hazardType || 'Flood Risk',
                              lat: zone.coords ? zone.coords[0].toString() : '23.5350',
                              lng: zone.coords ? zone.coords[1].toString() : '77.8150',
                              radiusMeters: zone.radiusMeters || 400,
                              isActive: zone.isActive !== false,
                              notes: zone.notes || '',
                              address: '',
                            });
                            setIsAddDangerModalOpen(true);
                          }}
                          className="text-travel-muted hover:text-travel-primary font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingDangerZone(zone)}
                          className="text-travel-muted hover:text-rose-400 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHRONOLOGICAL GEOFENCE EVENT HISTORY LOG */}
      {activeTab === 'logs' && (
        <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-travel pb-3">
            <div>
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-travel-accent" />
                Isolated Geofence & Hazard Event History
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Authentic real-time activity log for this account. Records boundary crossings, 60s countdowns, and safety confirmations.
              </p>
            </div>

            {geofenceEventLogs.length > 0 && (
              <button
                type="button"
                onClick={clearGeofenceEventLogs}
                className="px-3 py-1.5 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-muted hover:text-travel-secondary text-xs font-semibold transition shrink-0 self-start sm:self-center"
              >
                Clear Event History
              </button>
            )}
          </div>

          {geofenceEventLogs.length === 0 ? (
            <div className="text-center py-12 text-travel-muted text-xs">
              No geofence events logged for this account yet. Events are recorded when GPS crosses safe or danger zone boundaries.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar">
              {geofenceEventLogs.map((log) => {
                const isDangerEntry = log.eventType === 'DANGER_ENTRY';
                const isDangerExit = log.eventType === 'DANGER_EXIT';
                const isSafe = log.eventType === 'SAFETY_CONFIRMED';
                const isEscalation = log.eventType === 'ESCALATION_TRIGGERED';
                const isSafeEntry = log.eventType === 'ENTRY';

                return (
                  <div
                    key={log.id}
                    className="bg-travel-subtle/50 rounded-xl p-3.5 border border-travel flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase font-mono tracking-wider shrink-0 mt-0.5 ${
                          isEscalation
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isDangerEntry
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : isSafe
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isDangerExit
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {log.eventType}
                      </span>

                      <div className="space-y-0.5">
                        <div className="font-extrabold text-travel-primary text-xs">
                          {log.placeName} ({log.radiusMeters}m perimeter)
                        </div>
                        <p className="text-travel-secondary text-[11px] leading-relaxed">
                          {log.note}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center font-mono text-[11px] text-travel-muted">
                      <span>{log.timestamp}</span>
                      <span className="text-[10px] bg-travel-subtle text-travel-muted px-2 py-0.5 rounded">
                        Simulated
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-[11px] text-travel-muted font-mono pt-1">
            * Safety disclosure: All event dispatches and escalation relays operate client-side. Background device battery is protected without unnecessary polling.
          </div>
        </div>
      )}

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
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Safe Zone / Venue Name *
              </label>
              <input
                type="text"
                required
                value={newPlace.name}
                onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
                placeholder="e.g. Vidisha Railway Station Base"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Category *
                </label>
                <select
                  value={newPlace.category}
                  onChange={(e) => setNewPlace({ ...newPlace, category: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
                >
                  <option value="Hotel">Hotel / Lodging</option>
                  <option value="Tourist Spot">Tourist Spot</option>
                  <option value="Checkpoint">Police / Medical Checkpoint</option>
                  <option value="Dining">Dining</option>
                  <option value="Transit Hub">Transit Hub</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Geofence Radius *
                </label>
                <select
                  value={newPlace.radiusMeters}
                  onChange={(e) => setNewPlace({ ...newPlace, radiusMeters: parseInt(e.target.value, 10) })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent font-mono"
                >
                  <option value={100}>100m (Tight Single Building)</option>
                  <option value={250}>250m (Property & Grounds - Standard)</option>
                  <option value={500}>500m (Neighborhood Safe Haven)</option>
                  <option value={1000}>1,000m (District Perimeter)</option>
                </select>
              </div>
            </div>

            {/* Location Autocomplete / Search */}
            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Search Location on OpenStreetMap
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={geoSearchQuery}
                  onChange={(e) => setGeoSearchQuery(e.target.value)}
                  placeholder="e.g. Vidisha, Madhya Pradesh"
                  className="flex-1 bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
                />
                <button
                  type="button"
                  onClick={handleGeoSearch}
                  disabled={isGeoSearching}
                  className="px-3.5 py-2 rounded-xl btn-travel-secondary text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isGeoSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search</span>
                </button>
              </div>

              {geoSearchResults.length > 0 && (
                <div className="mt-2 bg-travel-card border border-travel rounded-xl overflow-hidden shadow-elevated max-h-40 overflow-y-auto custom-scrollbar">
                  {geoSearchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => handleSelectGeoResult(res)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-travel-subtle border-b border-travel/60 last:border-none flex flex-col"
                    >
                      <span className="font-bold text-travel-primary">{res.name}</span>
                      <span className="text-[10px] text-travel-muted truncate">{res.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Coordinate Presets */}
            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Quick Regional Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COORD_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCoordPreset(p)}
                    className="px-2 py-1 rounded-lg bg-travel-subtle hover:bg-travel-subtle text-travel-accent text-[10px] font-medium border border-travel/60 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Latitude * (-90 to 90)
                </label>
                <input
                  type="text"
                  required
                  value={newPlace.lat}
                  onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })}
                  placeholder="23.5251"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary font-mono focus:outline-none focus:border-travel-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Longitude * (-180 to 180)
                </label>
                <input
                  type="text"
                  required
                  value={newPlace.lng}
                  onChange={(e) => setNewPlace({ ...newPlace, lng: e.target.value })}
                  placeholder="77.8081"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary font-mono focus:outline-none focus:border-travel-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Street Address / Location Note
              </label>
              <input
                type="text"
                value={newPlace.address}
                onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
                placeholder="e.g. Station Road, Vidisha, Madhya Pradesh"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Traveler Notes & Tips
              </label>
              <textarea
                rows={2}
                value={newPlace.notes}
                onChange={(e) => setNewPlace({ ...newPlace, notes: e.target.value })}
                placeholder="24/7 staff support, verified retreat point..."
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-travel-primary font-bold text-xs transition shadow-md"
              >
                Create Safe Zone
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE / EDIT DANGER ZONE */}
      {isAddDangerModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddDangerModalOpen(false);
            setEditingDangerZone(null);
          }}
          title={editingDangerZone ? 'Edit Danger Zone' : 'Create Danger Zone Geofence'}
          subtitle="Configure a circular hazard perimeter (100m - 2000m) with 60s emergency escalation timer."
        >
          <form onSubmit={handleDangerSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Danger Zone Name *
              </label>
              <input
                type="text"
                required
                value={dangerForm.name}
                onChange={(e) => setDangerForm({ ...dangerForm, name: e.target.value })}
                placeholder="e.g. Betwa River Lowland Flash Flood Zone"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Hazard Type *
                </label>
                <select
                  value={dangerForm.hazardType}
                  onChange={(e) => setDangerForm({ ...dangerForm, hazardType: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
                >
                  <option value="Flood Risk">Flood Risk / Flash Flooding</option>
                  <option value="High Crime">High Crime / Theft Area</option>
                  <option value="Road Hazard">Road Hazard / Accident Prone</option>
                  <option value="Construction">Construction / Heavy Machinery</option>
                  <option value="Restricted Area">Restricted / Military Area</option>
                  <option value="General Hazard">General Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Perimeter Radius: {dangerForm.radiusMeters}m *
                </label>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={dangerForm.radiusMeters}
                  onChange={(e) => setDangerForm({ ...dangerForm, radiusMeters: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-600 cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] text-travel-muted font-mono">
                  <span>100m</span>
                  <span>1000m</span>
                  <span>2000m</span>
                </div>
              </div>
            </div>

            {/* Quick Regional Presets */}
            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Quick Regional Coordinates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COORD_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCoordPreset(p)}
                    className="px-2 py-1 rounded-lg bg-travel-subtle hover:bg-travel-subtle text-rose-400 text-[10px] font-medium border border-travel/60 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Latitude * (-90 to 90)
                </label>
                <input
                  type="text"
                  required
                  value={dangerForm.lat}
                  onChange={(e) => setDangerForm({ ...dangerForm, lat: e.target.value })}
                  placeholder="23.5350"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary font-mono focus:outline-none focus:border-travel-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Longitude * (-180 to 180)
                </label>
                <input
                  type="text"
                  required
                  value={dangerForm.lng}
                  onChange={(e) => setDangerForm({ ...dangerForm, lng: e.target.value })}
                  placeholder="77.8150"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary font-mono focus:outline-none focus:border-travel-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Hazard Advisory Notes
              </label>
              <textarea
                rows={2}
                value={dangerForm.notes}
                onChange={(e) => setDangerForm({ ...dangerForm, notes: e.target.value })}
                placeholder="Low-lying terrain, steep riverbanks, poor lighting at night..."
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="activeZoneCheckbox"
                checked={dangerForm.isActive}
                onChange={(e) => setDangerForm({ ...dangerForm, isActive: e.target.checked })}
                className="rounded border-travel text-rose-600 focus:ring-rose-500 bg-travel-subtle w-4 h-4"
              />
              <label htmlFor="activeZoneCheckbox" className="text-xs text-travel-secondary font-medium cursor-pointer">
                Actively Monitor this Hazard Perimeter (Enables 60s Warning Countdown)
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => {
                  setIsAddDangerModalOpen(false);
                  setEditingDangerZone(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md"
              >
                {editingDangerZone ? 'Save Changes' : 'Create Danger Zone'}
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
            <p className="text-travel-secondary leading-relaxed">
              Are you sure you want to remove <strong className="text-travel-primary">{deletingPlace.name}</strong> from your saved safe zones?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => setDeletingPlace(null)}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
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

      {/* MODAL: DELETE DANGER ZONE CONFIRMATION */}
      {deletingDangerZone && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingDangerZone(null)}
          title="Remove Danger Zone"
          subtitle="Accidental deletion protection."
        >
          <div className="space-y-4 text-xs">
            <p className="text-travel-secondary leading-relaxed">
              Are you sure you want to remove <strong className="text-travel-primary">{deletingDangerZone.name}</strong> from monitored hazard zones? Proactive breach warnings for this perimeter will cease.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => setDeletingDangerZone(null)}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
              >
                Keep Danger Zone
              </button>
              <button
                type="button"
                onClick={() => {
                  removeDangerZone(deletingDangerZone.id);
                  setDeletingDangerZone(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Yes, Remove Danger Zone
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
            <div className="bg-travel-subtle p-4 rounded-xl border border-travel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-travel-muted">Coordinates:</span>
                <span className="font-mono font-bold text-travel-accent">
                  {mapPreviewPlace.coords?.join(', ') || '23.5251, 77.8081'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-travel-muted">Safe Perimeter Radius:</span>
                <span className="font-mono text-travel-primary">{mapPreviewPlace.radiusMeters || 250} meters</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-travel-muted">Address:</span>
                <span className="text-travel-primary">{mapPreviewPlace.address}</span>
              </div>
            </div>

            <p className="text-travel-secondary bg-travel-subtle/50 p-3 rounded-xl border border-travel/50">
              {mapPreviewPlace.notes || 'No custom notes provided.'}
            </p>

            <button
              onClick={() => setMapPreviewPlace(null)}
              className="w-full py-2.5 rounded-xl btn-travel-primary font-bold text-xs transition"
            >
              Close Coords
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
