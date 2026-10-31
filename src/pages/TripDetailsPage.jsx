import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  DollarSign,
  Luggage,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Footprints,
  Bus,
  Train,
  Coffee,
  Ship,
  Bike,
  Edit3,
  AlertTriangle,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import InteractiveMap from '../components/map/InteractiveMap';
import Modal from '../components/common/Modal';

// Helper to get transport mode icon
function getSegmentIcon(type, mode) {
  const t = (type || mode || '').toLowerCase();
  if (t.includes('walk') || t.includes('foot') || t.includes('pedestrian') || t.includes('hike')) {
    return <Footprints className="w-4 h-4 text-teal-400" />;
  }
  if (t.includes('bus')) {
    return <Bus className="w-4 h-4 text-sky-400" />;
  }
  if (t.includes('train') || t.includes('rail') || t.includes('tram') || t.includes('shinkansen')) {
    return <Train className="w-4 h-4 text-indigo-400" />;
  }
  if (t.includes('cafe') || t.includes('coffee') || t.includes('dining') || t.includes('rest')) {
    return <Coffee className="w-4 h-4 text-amber-400" />;
  }
  if (t.includes('ferry') || t.includes('boat') || t.includes('ship')) {
    return <Ship className="w-4 h-4 text-cyan-400" />;
  }
  if (t.includes('bike') || t.includes('bicycle')) {
    return <Bike className="w-4 h-4 text-emerald-400" />;
  }
  return <Sparkles className="w-4 h-4 text-purple-400" />;
}

export default function TripDetailsPage() {
  const {
    journeys,
    activeJourneyId,
    setActiveJourneyId,
    activeJourney,
    setActivePage,
    editJourney,
    deleteJourney,
    addSegmentToJourney,
    editSegmentInJourney,
    deleteSegmentFromJourney,
    reorderSegmentInJourney,
    togglePackingItem,
    addPackingItem,
    toggleItineraryItem,
    addExpenseToJourney,
    sendSafetyCheckInPing,
    startSosSimulation,
  } = useApp();

  // Route view mode: 'map' | 'schematic'
  const [routeViewMode, setRouteViewMode] = useState('map');
  // Lower tabbed section: 'itinerary' | 'packing' | 'expenses'
  const [lowerTab, setLowerTab] = useState('itinerary');

  // Modals
  const [isAddSegmentOpen, setIsAddSegmentOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [deletingSegment, setDeletingSegment] = useState(null);
  const [isEditJourneyOpen, setIsEditJourneyOpen] = useState(false);
  const [isDeleteJourneyOpen, setIsDeleteJourneyOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddPackingOpen, setIsAddPackingOpen] = useState(false);

  // Segment Form State (for both Add and Edit)
  const [segmentForm, setSegmentForm] = useState({
    title: '',
    origin: '',
    destination: '',
    type: 'walking',
    transportMode: 'Walking',
    distanceKm: '0.8',
    durationMinutes: '12',
    startTime: '09:00 AM',
    endTime: '09:12 AM',
    transitLine: '',
    notes: '',
    status: 'Scheduled',
    isStop: false,
  });

  const [segmentErrors, setSegmentErrors] = useState({});

  // Journey Edit Form State
  const [journeyForm, setJourneyForm] = useState({
    title: '',
    origin: '',
    destination: '',
    travelDate: '',
    primaryTransportMode: '',
    status: '',
    summary: '',
  });

  const [journeyErrors, setJourneyErrors] = useState({});

  // Expense form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Dining',
    date: '2026-10-28',
  });

  // Packing item form
  const [packingForm, setPackingForm] = useState({
    item: '',
    category: 'Gear',
    mandatory: false,
  });

  if (!activeJourney) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-lg font-bold text-white">No Journey Selected</h3>
        <p className="text-xs text-slate-400">Choose a trip chain from your library to inspect ordered segments.</p>
        <button
          type="button"
          onClick={() => setActivePage('journeys')}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
        >
          Return to My Journeys
        </button>
      </div>
    );
  }

  const segments = activeJourney.segments || activeJourney.travelSegments || [];
  const originTitle = activeJourney.origin || activeJourney.waypoints?.[0]?.title || 'Origin';
  const destTitle = activeJourney.destination || activeJourney.waypoints?.[activeJourney.waypoints.length - 1]?.title || 'Destination';

  const packingList = activeJourney.packingList || [];
  const packedCount = packingList.filter((p) => p.checked).length;
  const packingPercent = packingList.length ? Math.round((packedCount / packingList.length) * 100) : 100;

  // Handlers for Add Segment
  const openAddSegmentModal = () => {
    const lastSeg = segments[segments.length - 1];
    const nextOrigin = lastSeg ? (lastSeg.destination || lastSeg.to || lastSeg.origin) : originTitle;

    setSegmentForm({
      title: 'New Travel Leg',
      origin: nextOrigin,
      destination: '',
      type: 'walking',
      transportMode: 'Walking',
      distanceKm: '1.2',
      durationMinutes: '15',
      startTime: lastSeg?.endTime || '10:00 AM',
      endTime: '10:15 AM',
      transitLine: '',
      notes: '',
      status: 'Scheduled',
      isStop: false,
    });
    setSegmentErrors({});
    setIsAddSegmentOpen(true);
  };

  const validateSegmentForm = () => {
    const errors = {};
    if (!segmentForm.origin.trim()) errors.origin = 'Origin is required';
    if (!segmentForm.destination.trim()) errors.destination = 'Destination is required';
    if (isNaN(parseFloat(segmentForm.distanceKm)) || parseFloat(segmentForm.distanceKm) < 0) {
      errors.distanceKm = 'Must be non-negative';
    }
    if (isNaN(parseInt(segmentForm.durationMinutes, 10)) || parseInt(segmentForm.durationMinutes, 10) < 0) {
      errors.durationMinutes = 'Must be non-negative';
    }
    setSegmentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSegmentSubmit = (e) => {
    e.preventDefault();
    if (!validateSegmentForm()) return;

    addSegmentToJourney(activeJourney.id, {
      title: segmentForm.title.trim() || `${segmentForm.transportMode} Leg`,
      origin: segmentForm.origin.trim(),
      destination: segmentForm.destination.trim(),
      type: segmentForm.type,
      transportMode: segmentForm.transportMode,
      distanceKm: parseFloat(segmentForm.distanceKm) || 0,
      durationMinutes: parseInt(segmentForm.durationMinutes, 10) || 0,
      startTime: segmentForm.startTime.trim() || '10:00 AM',
      endTime: segmentForm.endTime.trim() || '10:30 AM',
      transitLine: segmentForm.transitLine.trim() || null,
      notes: segmentForm.notes.trim() || '',
      status: segmentForm.status,
      isStop: segmentForm.isStop || segmentForm.type === 'cafe_stop' || segmentForm.type === 'activity',
    });

    setIsAddSegmentOpen(false);
  };

  // Handlers for Edit Segment
  const openEditSegmentModal = (seg) => {
    setEditingSegment(seg);
    setSegmentForm({
      title: seg.title || '',
      origin: seg.origin || seg.from || '',
      destination: seg.destination || seg.to || '',
      type: seg.type || seg.modeType || 'walking',
      transportMode: seg.transportMode || seg.mode || 'Walking',
      distanceKm: (seg.distanceKm || 0).toString(),
      durationMinutes: (seg.durationMinutes || parseInt(seg.duration, 10) || 0).toString(),
      startTime: seg.startTime || '10:00 AM',
      endTime: seg.endTime || '10:30 AM',
      transitLine: seg.transitLine || '',
      notes: seg.notes || '',
      status: seg.status || 'Scheduled',
      isStop: seg.isStop || false,
    });
    setSegmentErrors({});
  };

  const handleEditSegmentSubmit = (e) => {
    e.preventDefault();
    if (!validateSegmentForm() || !editingSegment) return;

    editSegmentInJourney(activeJourney.id, editingSegment.id, {
      title: segmentForm.title.trim() || `${segmentForm.transportMode} Leg`,
      origin: segmentForm.origin.trim(),
      destination: segmentForm.destination.trim(),
      type: segmentForm.type,
      transportMode: segmentForm.transportMode,
      distanceKm: parseFloat(segmentForm.distanceKm) || 0,
      durationMinutes: parseInt(segmentForm.durationMinutes, 10) || 0,
      startTime: segmentForm.startTime.trim(),
      endTime: segmentForm.endTime.trim(),
      transitLine: segmentForm.transitLine.trim() || null,
      notes: segmentForm.notes.trim(),
      status: segmentForm.status,
      isStop: segmentForm.isStop || segmentForm.type === 'cafe_stop' || segmentForm.type === 'activity',
    });

    setEditingSegment(null);
  };

  // Delete Segment Handler
  const handleDeleteSegmentConfirm = () => {
    if (deletingSegment) {
      deleteSegmentFromJourney(activeJourney.id, deletingSegment.id);
      setDeletingSegment(null);
    }
  };

  // Journey Edit Handlers
  const openEditJourneyModal = () => {
    setJourneyForm({
      title: activeJourney.title || '',
      origin: originTitle,
      destination: destTitle,
      travelDate: activeJourney.travelDate || activeJourney.startDate || '',
      primaryTransportMode: activeJourney.primaryTransportMode || 'Walking + Transit',
      status: activeJourney.status || 'In Progress',
      summary: activeJourney.summary || '',
    });
    setJourneyErrors({});
    setIsEditJourneyOpen(true);
  };

  const handleEditJourneySubmit = (e) => {
    e.preventDefault();
    if (!journeyForm.origin.trim() || !journeyForm.destination.trim()) {
      setJourneyErrors({
        origin: !journeyForm.origin.trim() ? 'Origin is required' : '',
        destination: !journeyForm.destination.trim() ? 'Destination is required' : '',
      });
      return;
    }

    editJourney(activeJourney.id, {
      title: journeyForm.title.trim() || `${journeyForm.origin} ➔ ${journeyForm.destination}`,
      origin: journeyForm.origin.trim(),
      destination: journeyForm.destination.trim(),
      travelDate: journeyForm.travelDate,
      primaryTransportMode: journeyForm.primaryTransportMode,
      status: journeyForm.status,
      summary: journeyForm.summary.trim(),
    });

    setIsEditJourneyOpen(false);
  };

  const handleDeleteJourneyConfirm = () => {
    deleteJourney(activeJourney.id);
    setIsDeleteJourneyOpen(false);
    setActivePage('journeys');
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    addExpenseToJourney(activeJourney.id, expenseForm);
    setIsAddExpenseOpen(false);
    setExpenseForm({
      title: '',
      amount: '',
      category: 'Dining',
      date: '2026-10-28',
    });
  };

  const handlePackingSubmit = (e) => {
    e.preventDefault();
    if (!packingForm.item) return;

    addPackingItem(activeJourney.id, packingForm);
    setIsAddPackingOpen(false);
    setPackingForm({ item: '', category: 'Gear', mandatory: false });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Journey Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f172a] p-3.5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActivePage('journeys')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Journeys</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              Viewing:
            </span>
            <select
              value={activeJourneyId}
              onChange={(e) => setActiveJourneyId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-teal-500 max-w-[220px] sm:max-w-xs truncate"
            >
              {journeys.map((j) => (
                <option key={j.id || j._id} value={j.id || j._id}>
                  {j.title} ({j.origin || 'Start'} ➔ {j.destination})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => sendSafetyCheckInPing(`Checked in at ${activeJourney.destination || 'Current Stop'}`)}
            className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            title="Broadcast simulated check-in"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Check-in</span>
          </button>

          <button
            type="button"
            onClick={openAddSegmentModal}
            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Leg</span>
          </button>

          <button
            type="button"
            onClick={openEditJourneyModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteJourneyOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            title="Delete this journey"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Journey Header Card */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  activeJourney.status === 'Active' || activeJourney.status === 'In Progress'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                }`}
              >
                {activeJourney.status || 'Planned'}
              </span>

              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                <MapPin className="w-3 h-3 text-teal-400" />
                {originTitle} ➔ {destTitle}
              </span>

              {activeJourney.travelDate && (
                <span className="text-xs text-slate-500 font-mono">
                  • {activeJourney.travelDate}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeJourney.title}
            </h2>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
              {activeJourney.totalDistanceKm || activeJourney.distanceKm || 0} km
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-teal-400">
              {activeJourney.totalDurationMinutes || 55} mins
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
              -{activeJourney.estimatedCo2Kg || activeJourney.co2SavedKg || 4.2} kg CO₂
            </span>
          </div>
        </div>

        {activeJourney.summary && (
          <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
            {activeJourney.summary}
          </p>
        )}
      </div>

      {/* DESKTOP 2-COLUMN SPLIT: Left (Map) + Right (Ordered Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (6 cols): Geographic Map & Topology */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Route Geography</span>
            </h3>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setRouteViewMode('map')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  routeViewMode === 'map'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setRouteViewMode('schematic')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  routeViewMode === 'schematic'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Schematic
              </button>
            </div>
          </div>

          {/* Map or Schematic Container */}
          {routeViewMode === 'map' ? (
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
              <InteractiveMap
                waypoints={activeJourney.waypoints || []}
                center={activeJourney.center || [35.0116, 135.7681]}
                zoom={activeJourney.zoom || 13}
                currentLocation={activeJourney.currentLocation}
                height="460px"
                destinationTitle={`${activeJourney.title} — ${activeJourney.destination}`}
              />
            </div>
          ) : (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-5 space-y-4 min-h-[460px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  Linear Node Topology
                </span>
                <span className="text-[11px] font-mono text-teal-300">
                  {segments.length} Chain Nodes
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
                {segments.map((seg, idx) => (
                  <div
                    key={seg.id || idx}
                    className={`rounded-xl p-3 border text-xs transition ${
                      seg.isStop
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-teal-300">
                        {seg.isStop ? `Stop ${idx + 1}` : `Leg ${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {seg.distanceKm} km • {seg.durationMinutes || seg.duration} min
                      </span>
                    </div>
                    <div className="font-bold text-white">{seg.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {seg.origin || seg.from} ➔ {seg.destination || seg.to}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 cols): Ordered Timeline & Segments */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Ordered Trip Chain Timeline</span>
              </h3>
            </div>

            <button
              type="button"
              onClick={openAddSegmentModal}
              className="px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-md shadow-teal-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Leg / Stop</span>
            </button>
          </div>

          {/* Timeline Cards Container */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {segments.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No segments in this journey yet. Click "Add Leg / Stop" to start chaining your route.
              </div>
            ) : (
              segments.map((segment, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === segments.length - 1;

                return (
                  <div
                    key={segment.id || idx}
                    className={`rounded-2xl border p-4 transition-all ${
                      segment.isStop
                        ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                        : segment.status === 'In Progress'
                        ? 'bg-slate-900/90 border-teal-500/50 ring-1 ring-teal-500/20 shadow-md'
                        : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Number, Title, Type, Reorder & Actions */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-teal-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                            {segment.title}
                          </h5>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {segment.transportMode || 'Walking'} {segment.transitLine ? `• ${segment.transitLine}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => reorderSegmentInJourney(activeJourney.id, segment.id, 'up')}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 transition"
                          title="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => reorderSegmentInJourney(activeJourney.id, segment.id, 'down')}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 transition"
                          title="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditSegmentModal(segment)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-teal-300 transition"
                          title="Edit leg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingSegment(segment)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                          title="Delete leg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Route Leg endpoints */}
                    <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-300 truncate">{segment.origin || segment.from}</span>
                        <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
                        <span className="text-white font-semibold truncate">{segment.destination || segment.to}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {segment.distanceKm} km • {segment.durationMinutes || segment.duration}m
                      </span>
                    </div>

                    {/* Sensor / Telemetry tag */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{segment.status || 'Scheduled'}</span>
                      <span>-{segment.co2SavedKg || 0.2} kg CO₂</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* LOWER TABBED SECTION: Itinerary, Packing, Expenses */}
      <div className="bg-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setLowerTab('itinerary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              lowerTab === 'itinerary'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Itinerary Schedule ({activeJourney.itineraryDays?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setLowerTab('packing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              lowerTab === 'packing'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Luggage className="w-3.5 h-3.5" />
            <span>Packing Checklist ({packedCount}/{packingList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setLowerTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              lowerTab === 'expenses'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Expenses (${activeJourney.spent || 0})</span>
          </button>
        </div>

        {/* TAB 1: ITINERARY */}
        {lowerTab === 'itinerary' && (
          <div className="space-y-3">
            {(activeJourney.itineraryDays || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No scheduled day itineraries created yet.</p>
            ) : (
              activeJourney.itineraryDays.map((day) => (
                <div key={day.day} className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Day {day.day}: {day.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{day.date}</span>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    {day.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItineraryItem(activeJourney.id, day.day, idx)}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-800 cursor-pointer text-xs"
                      >
                        <span className={item.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                          {item.time} — {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">{item.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: PACKING */}
        {lowerTab === 'packing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  {packedCount} of {packingList.length} items checked ({packingPercent}%)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddPackingOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {packingList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => togglePackingItem(activeJourney.id, item.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                        item.checked
                          ? 'bg-teal-500 border-teal-400 text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={item.checked ? 'line-through text-slate-500' : 'text-slate-200'}>
                      {item.item}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: EXPENSES */}
        {lowerTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">
                  Total recorded: ${activeJourney.spent || 0} / Budget: ${activeJourney.budget || 0}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>

            <div className="space-y-2">
              {(activeJourney.expenses || []).map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white block">{exp.title}</span>
                    <span className="text-[11px] text-slate-400">{exp.category} • {exp.date}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ${exp.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADD SEGMENT MODAL */}
      <Modal
        isOpen={isAddSegmentOpen}
        onClose={() => setIsAddSegmentOpen(false)}
        title="Add Leg to Trip Chain"
        subtitle="Append an ordered transit leg or intermediate rest stop."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAddSegmentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Segment Title</label>
              <input
                type="text"
                placeholder="e.g. City Bus Transit Leg"
                value={segmentForm.title}
                onChange={(e) => setSegmentForm({ ...segmentForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Segment Type</label>
              <select
                value={segmentForm.type}
                onChange={(e) => {
                  const val = e.target.value;
                  const isStop = val === 'cafe_stop' || val === 'activity';
                  const modeMap = {
                    walking: 'Walking',
                    bus: 'Bus',
                    train: 'Train',
                    cafe_stop: 'Intermediate Cafe Stop',
                    activity: 'Milestone / Sight',
                    bicycle: 'Bicycle',
                    ferry: 'Ferry',
                  };
                  setSegmentForm({
                    ...segmentForm,
                    type: val,
                    transportMode: modeMap[val] || 'Walking',
                    isStop: isStop,
                    distanceKm: isStop ? '0.0' : segmentForm.distanceKm,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="walking">Walking / Pedestrian</option>
                <option value="bus">City Bus / Transit</option>
                <option value="train">Train / Regional Rail</option>
                <option value="cafe_stop">Intermediate Cafe / Rest Stop</option>
                <option value="activity">Milestone / Arrival Stop</option>
                <option value="bicycle">Bicycle</option>
                <option value="ferry">Maritime Ferry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Origin Point <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Kitayama Stn Bus Stop"
                value={segmentForm.origin}
                onChange={(e) => setSegmentForm({ ...segmentForm, origin: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  segmentErrors.origin ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500`}
              />
              {segmentErrors.origin && (
                <p className="text-[10px] text-rose-400">{segmentErrors.origin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Destination Point <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hyakumanben Junction"
                value={segmentForm.destination}
                onChange={(e) => setSegmentForm({ ...segmentForm, destination: e.target.value })}
                className={`w-full bg-slate-900 border ${
                  segmentErrors.destination ? 'border-rose-500' : 'border-slate-700'
                } rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500`}
              />
              {segmentErrors.destination && (
                <p className="text-[10px] text-rose-400">{segmentErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={segmentForm.distanceKm}
                onChange={(e) => setSegmentForm({ ...segmentForm, distanceKm: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Duration (mins)</label>
              <input
                type="number"
                min="0"
                value={segmentForm.durationMinutes}
                onChange={(e) => setSegmentForm({ ...segmentForm, durationMinutes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Start Time</label>
              <input
                type="text"
                placeholder="09:00 AM"
                value={segmentForm.startTime}
                onChange={(e) => setSegmentForm({ ...segmentForm, startTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">End Time</label>
              <input
                type="text"
                placeholder="09:22 AM"
                value={segmentForm.endTime}
                onChange={(e) => setSegmentForm({ ...segmentForm, endTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Transit Line / Operator</label>
              <input
                type="text"
                placeholder="e.g. Kyoto City Bus #206"
                value={segmentForm.transitLine}
                onChange={(e) => setSegmentForm({ ...segmentForm, transitLine: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Leg Status</label>
              <select
                value={segmentForm.status}
                onChange={(e) => setSegmentForm({ ...segmentForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Segment Notes</label>
            <textarea
              rows={2}
              placeholder="Transit transfer tips, sidewalk condition, or study rest dwell..."
              value={segmentForm.notes}
              onChange={(e) => setSegmentForm({ ...segmentForm, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddSegmentOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-500/20"
            >
              Append to Chain
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT SEGMENT MODAL */}
      <Modal
        isOpen={Boolean(editingSegment)}
        onClose={() => setEditingSegment(null)}
        title="Edit Trip Chain Leg"
        subtitle="Modify leg distance, duration, or timing."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleEditSegmentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Segment Title</label>
              <input
                type="text"
                value={segmentForm.title}
                onChange={(e) => setSegmentForm({ ...segmentForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Segment Type</label>
              <select
                value={segmentForm.type}
                onChange={(e) => {
                  const val = e.target.value;
                  const isStop = val === 'cafe_stop' || val === 'activity';
                  const modeMap = {
                    walking: 'Walking',
                    bus: 'Bus',
                    train: 'Train',
                    cafe_stop: 'Intermediate Cafe Stop',
                    activity: 'Milestone / Sight',
                    bicycle: 'Bicycle',
                    ferry: 'Ferry',
                  };
                  setSegmentForm({
                    ...segmentForm,
                    type: val,
                    transportMode: modeMap[val] || 'Walking',
                    isStop: isStop,
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="walking">Walking / Pedestrian</option>
                <option value="bus">City Bus / Transit</option>
                <option value="train">Train / Regional Rail</option>
                <option value="cafe_stop">Intermediate Cafe / Rest Stop</option>
                <option value="activity">Milestone / Arrival Stop</option>
                <option value="bicycle">Bicycle</option>
                <option value="ferry">Maritime Ferry</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Origin Point</label>
              <input
                type="text"
                value={segmentForm.origin}
                onChange={(e) => setSegmentForm({ ...segmentForm, origin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Destination Point</label>
              <input
                type="text"
                value={segmentForm.destination}
                onChange={(e) => setSegmentForm({ ...segmentForm, destination: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={segmentForm.distanceKm}
                onChange={(e) => setSegmentForm({ ...segmentForm, distanceKm: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Duration (mins)</label>
              <input
                type="number"
                min="0"
                value={segmentForm.durationMinutes}
                onChange={(e) => setSegmentForm({ ...segmentForm, durationMinutes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Start Time</label>
              <input
                type="text"
                value={segmentForm.startTime}
                onChange={(e) => setSegmentForm({ ...segmentForm, startTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">End Time</label>
              <input
                type="text"
                value={segmentForm.endTime}
                onChange={(e) => setSegmentForm({ ...segmentForm, endTime: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Transit Line</label>
              <input
                type="text"
                value={segmentForm.transitLine}
                onChange={(e) => setSegmentForm({ ...segmentForm, transitLine: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <select
                value={segmentForm.status}
                onChange={(e) => setSegmentForm({ ...segmentForm, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Notes</label>
            <textarea
              rows={2}
              value={segmentForm.notes}
              onChange={(e) => setSegmentForm({ ...segmentForm, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingSegment(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-teal-500/20"
            >
              Save Leg Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE SEGMENT MODAL */}
      {deletingSegment && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingSegment(null)}
          title="Delete Segment Leg"
          subtitle={`Are you sure you want to remove "${deletingSegment.title}"?`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Removing this leg will restructure your sequential chain from {originTitle} to {destTitle}.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSegment(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSegmentConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
              >
                Delete Leg
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT JOURNEY MODAL */}
      {isEditJourneyOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditJourneyOpen(false)}
          title="Edit Journey"
          subtitle="Update destination, dates, and primary mode."
        >
          <form onSubmit={handleEditJourneySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={journeyForm.title}
                onChange={(e) => setJourneyForm({ ...journeyForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origin *</label>
                <input
                  type="text"
                  value={journeyForm.origin}
                  onChange={(e) => setJourneyForm({ ...journeyForm, origin: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination *</label>
                <input
                  type="text"
                  value={journeyForm.destination}
                  onChange={(e) => setJourneyForm({ ...journeyForm, destination: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={journeyForm.travelDate}
                  onChange={(e) => setJourneyForm({ ...journeyForm, travelDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={journeyForm.status}
                  onChange={(e) => setJourneyForm({ ...journeyForm, status: e.target.value })}
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
                value={journeyForm.summary}
                onChange={(e) => setJourneyForm({ ...journeyForm, summary: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditJourneyOpen(false)}
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

      {/* DELETE JOURNEY MODAL */}
      {isDeleteJourneyOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsDeleteJourneyOpen(false)}
          title="Delete Journey"
          subtitle={`Are you sure you want to remove "${activeJourney.title}"?`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              This action permanently deletes this journey chain, its waypoints, and expense logs.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteJourneyOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJourneyConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition"
              >
                Delete Journey
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD PACKING ITEM MODAL */}
      {isAddPackingOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddPackingOpen(false)}
          title="Add Packing Checklist Item"
          subtitle="Add gear or travel documents to your checklist."
        >
          <form onSubmit={handlePackingSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Passport & Visa Photocopy"
                value={packingForm.item}
                onChange={(e) => setPackingForm({ ...packingForm, item: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={packingForm.category}
                onChange={(e) => setPackingForm({ ...packingForm, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Gear">Gear</option>
                <option value="Documents">Documents</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Medical">Medical</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddPackingOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
              >
                Add Item
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD EXPENSE MODAL */}
      {isAddExpenseOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddExpenseOpen(false)}
          title="Log Expense"
          subtitle="Record travel expenditure for this expedition."
        >
          <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expense Title</label>
              <input
                type="text"
                placeholder="e.g. Randen Tramway All-Day Pass"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="14.50"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Transit">Transit</option>
                  <option value="Dining">Dining</option>
                  <option value="Lodging">Lodging</option>
                  <option value="Activities">Activities</option>
                  <option value="Gear">Gear</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition"
              >
                Save Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
