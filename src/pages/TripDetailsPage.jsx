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

  // Top Section Views
  const [routeViewMode, setRouteViewMode] = useState('map'); // 'map' | 'schematic'
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'itinerary' | 'packing' | 'expenses'

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
    // Sensible defaults based on existing chain
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

  // Delete Segment Handlers
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

  // Journey Delete Handler
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
            onClick={() => setActivePage('journeys')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Journeys
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
                <option key={j.id} value={j.id}>
                  {j.title} ({j.origin || 'Start'} ➔ {j.destination})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => sendSafetyCheckInPing(`Checked in at ${activeJourney.destination || 'Current Stop'}`)}
            className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            title="Send simulated safety check-in ping"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Check-in
          </button>

          <button
            onClick={startSosSimulation}
            className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            title="Simulate SOS emergency dispatch"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            SOS
          </button>

          <button
            onClick={openAddSegmentModal}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Add Leg / Stop
          </button>

          <button
            onClick={openEditJourneyModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-400" />
            Edit Journey
          </button>

          <button
            onClick={() => setIsDeleteJourneyOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            title="Delete this journey"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          <img
            src={activeJourney.coverImage}
            alt={activeJourney.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/75 to-transparent" />

          {/* Badges on Top Right */}
          <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                activeJourney.status === 'Active' || activeJourney.status === 'In Progress'
                  ? 'bg-emerald-500/80 text-white border-emerald-400'
                  : 'bg-teal-500/80 text-white border-teal-400'
              }`}
            >
              {activeJourney.status}
            </span>

            <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-slate-900/80 text-slate-300 border border-slate-700">
              Structured Trip Chain
            </span>
          </div>

          {/* Hero Content Bottom */}
          <div className="absolute bottom-5 left-5 right-5 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                {originTitle}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-white font-bold">{destTitle}</span>
              <span className="text-slate-400">• {activeJourney.travelDate || activeJourney.startDate}</span>
              <span className="text-slate-400">• Mode: {activeJourney.primaryTransportMode || 'Transit'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeJourney.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {activeJourney.summary}
            </p>
          </div>
        </div>

        {/* Demo Telemetry Disclaimer Banner */}
        <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-[11px]">
              <strong>Demo Data Notice:</strong> Ordered legs, dwell times, and sensor telemetry are simulated demonstration models.
            </span>
          </div>
          <span className="font-mono text-[11px] text-teal-300 font-semibold hidden sm:inline-block">
            {segments.length} Ordered Segments
          </span>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Route Distance</span>
            <span className="font-mono font-bold text-white text-base">
              {activeJourney.totalDistanceKm || 0} km
            </span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Estimated Travel Duration</span>
            <span className="font-mono font-bold text-teal-400 text-base">
              {activeJourney.totalDurationMinutes || 0} mins
            </span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Trip Chain Legs</span>
            <span className="font-mono font-bold text-white text-base">
              {segments.length} Ordered Stops
            </span>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">CO₂ Emissions Saved</span>
            <span className="font-mono font-bold text-emerald-400 text-base">
              -{activeJourney.estimatedCo2Kg || 0} kg CO₂
            </span>
          </div>
        </div>
      </div>

      {/* Map & Route Diagram Toggle Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-400" />
              Route Geography & Trip Chain Topology
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setRouteViewMode('map')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                routeViewMode === 'map'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Geographic Map
            </button>
            <button
              onClick={() => setRouteViewMode('schematic')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                routeViewMode === 'schematic'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Schematic Chain Diagram
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {routeViewMode === 'map' ? (
          <InteractiveMap
            waypoints={activeJourney.waypoints || []}
            center={activeJourney.center || [35.0116, 135.7681]}
            zoom={activeJourney.zoom || 13}
            currentLocation={activeJourney.currentLocation}
            height="400px"
            destinationTitle={`${activeJourney.title} — ${activeJourney.destination}`}
          />
        ) : (
          /* Schematic Topology Diagram */
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Linear Trip Chain Diagram
                </h4>
                <p className="text-xs text-slate-400">
                  Visual node topology illustrating sequential transit legs and dwell stops.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-teal-300">
                {segments.length} Chain Nodes
              </span>
            </div>

            {/* Horizontal Flow Diagram */}
            <div className="relative overflow-x-auto pb-4 pt-2">
              <div className="flex items-start gap-4 min-w-[700px]">
                {segments.map((seg, idx) => (
                  <div key={seg.id || idx} className="flex items-center gap-3 shrink-0">
                    {/* Node Card */}
                    <div
                      className={`w-56 rounded-2xl p-4 border transition-all ${
                        seg.isStop
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                          {seg.isStop ? `Stop ${idx + 1}` : `Leg ${idx + 1}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            seg.status === 'Completed'
                              ? 'text-emerald-400'
                              : seg.status === 'In Progress'
                              ? 'text-teal-400 animate-pulse'
                              : 'text-slate-400'
                          }`}
                        >
                          {seg.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-slate-800 shrink-0">
                          {getSegmentIcon(seg.type, seg.modeType || seg.mode)}
                        </div>
                        <span className="text-xs font-bold text-white truncate">
                          {seg.title}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="truncate">
                          <span className="text-slate-500">From:</span> {seg.origin || seg.from}
                        </div>
                        <div className="truncate text-teal-300 font-semibold">
                          <span className="text-slate-500">To:</span> {seg.destination || seg.to}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{seg.distanceKm} km</span>
                        <span>{seg.durationMinutes || seg.duration} min</span>
                      </div>
                    </div>

                    {/* Connector Arrow */}
                    {idx < segments.length - 1 && (
                      <div className="flex flex-col items-center justify-center shrink-0 text-slate-600">
                        <div className="w-6 h-0.5 bg-slate-700" />
                        <ArrowRight className="w-4 h-4 text-teal-500" />
                        <div className="w-6 h-0.5 bg-slate-700" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation: Timeline vs Itinerary vs Packing vs Expenses */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Ordered Trip Chain Timeline ({segments.length})
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'itinerary'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Itinerary Schedule ({activeJourney.itineraryDays?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('packing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'packing'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Luggage className="w-4 h-4" />
            Packing Checklist ({packedCount}/{packingList.length})
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Expenses (${activeJourney.spent || 0})
          </button>
        </div>

        {/* TAB 1: ORDERED TRIP CHAIN TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Sequential Trip Chain Segments
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordered mobility chain from <strong>{originTitle}</strong> to <strong>{destTitle}</strong>. Use reorder arrows to rearrange transit legs.
                </p>
              </div>

              <button
                onClick={openAddSegmentModal}
                className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Add Leg / Stop
              </button>
            </div>

            {/* Timeline List */}
            {segments.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No segments recorded for this trip chain. Click "Add Leg / Stop" to construct your route.
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                {segments.map((segment, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === segments.length - 1;

                  return (
                    <div key={segment.id || idx} className="relative group">
                      {/* Step marker circle */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                          segment.isStop
                            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-500/20'
                            : segment.status === 'Completed'
                            ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                            : segment.status === 'In Progress'
                            ? 'bg-teal-500 text-slate-950 border-teal-300 ring-4 ring-teal-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Segment Card */}
                      <div
                        className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                          segment.isStop
                            ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/50'
                            : segment.status === 'In Progress'
                            ? 'bg-slate-900/90 border-teal-500/50 ring-1 ring-teal-500/20 shadow-lg'
                            : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-800 text-teal-400">
                              {getSegmentIcon(segment.type, segment.modeType || segment.mode)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-white">
                                  {segment.title}
                                </h5>
                                {segment.isStop ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    INTERMEDIATE REST STOP
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                                    TRANSIT LEG
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">
                                {segment.transportMode || 'Walking'} {segment.transitLine ? `• ${segment.transitLine}` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            {/* Reorder Buttons */}
                            <button
                              disabled={isFirst}
                              onClick={() => reorderSegmentInJourney(activeJourney.id, segment.id, 'up')}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Move segment earlier in chain"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => reorderSegmentInJourney(activeJourney.id, segment.id, 'down')}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                              title="Move segment later in chain"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => openEditSegmentModal(segment)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-teal-300 hover:bg-slate-700 transition"
                              title="Edit segment"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingSegment(segment)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                              title="Delete segment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Origin ➔ Destination Banner */}
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-300">
                              {segment.origin || segment.from}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span className="font-bold text-white">
                              {segment.destination || segment.to}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-slate-400">
                            {segment.startTime} - {segment.endTime}
                          </span>
                        </div>

                        {/* Metrics strip for this segment */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Distance</span>
                            <span className="font-mono font-bold text-slate-200">
                              {segment.distanceKm} km
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Duration</span>
                            <span className="font-mono font-bold text-teal-300">
                              {segment.durationMinutes || segment.duration} min
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Status</span>
                            <span className="font-bold text-emerald-400">
                              {segment.status || 'Completed'}
                            </span>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60">
                            <span className="text-[10px] text-slate-500 block">Est. CO₂</span>
                            <span className="font-mono font-bold text-slate-300">
                              -{segment.co2SavedKg || 0.2} kg CO₂
                            </span>
                          </div>
                        </div>

                        {/* Notes & Sensor Attribution */}
                        {segment.notes && (
                          <p className="text-xs text-slate-300 bg-slate-950/30 p-2.5 rounded-xl border border-slate-800/50 mb-2 leading-relaxed">
                            {segment.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span className="font-mono flex items-center gap-1">
                            <Radio className="w-3 h-3 text-teal-400" />
                            {segment.telemetry || 'Demo Telemetry • Simulated Record'}
                          </span>
                          <span>Leg Index #{idx + 1}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ITINERARY SCHEDULE */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Trip Itinerary Schedule
              </h4>
              {(activeJourney.itineraryDays || []).length === 0 ? (
                <p className="text-xs text-slate-400">No scheduled day itineraries created yet.</p>
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
          </div>
        )}

        {/* TAB 3: PACKING CHECKLIST */}
        {activeTab === 'packing' && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Luggage className="w-4 h-4 text-teal-400" />
                    Essential Gear & Manifest Checklist
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {packedCount} of {packingList.length} items checked ({packingPercent}%)
                  </p>
                </div>

                <button
                  onClick={() => setIsAddPackingOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Item
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          </div>
        )}

        {/* TAB 4: EXPENSES LOG */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    Trip Budget & Expenditures
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total recorded: ${activeJourney.spent || 0} / Budget: ${activeJourney.budget || 0}
                  </p>
                </div>

                <button
                  onClick={() => setIsAddExpenseOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Expense
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
          </div>
        )}
      </div>

      {/* ADD SEGMENT MODAL */}
      <Modal
        isOpen={isAddSegmentOpen}
        onClose={() => setIsAddSegmentOpen(false)}
        title="Add Leg to Trip Chain"
        subtitle="Append an ordered transit leg or intermediate rest stop to this journey."
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
            <label className="text-xs font-semibold text-slate-300">Segment Notes & Instructions</label>
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
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              Save Segment Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE SEGMENT CONFIRMATION */}
      <Modal
        isOpen={Boolean(deletingSegment)}
        onClose={() => setDeletingSegment(null)}
        title="Delete Segment"
        subtitle="Remove this leg from the trip chain."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300">Remove Leg from Trip Chain?</span>
              <p className="text-xs text-slate-300">
                "{deletingSegment?.title}" ({deletingSegment?.origin} ➔ {deletingSegment?.destination}) will be removed, and the remaining chain legs will be re-indexed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeletingSegment(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteSegmentConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
            >
              Delete Segment
            </button>
          </div>
        </div>
      </Modal>

      {/* EDIT JOURNEY MODAL */}
      <Modal
        isOpen={isEditJourneyOpen}
        onClose={() => setIsEditJourneyOpen(false)}
        title="Edit Journey Metadata"
        subtitle="Update journey title, endpoints, dates, and narrative summary."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditJourneySubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Journey Title</label>
            <input
              type="text"
              value={journeyForm.title}
              onChange={(e) => setJourneyForm({ ...journeyForm, title: e.target.value })}
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
                value={journeyForm.origin}
                onChange={(e) => setJourneyForm({ ...journeyForm, origin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              {journeyErrors.origin && (
                <p className="text-[10px] text-rose-400">{journeyErrors.origin}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Destination Point <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={journeyForm.destination}
                onChange={(e) => setJourneyForm({ ...journeyForm, destination: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              {journeyErrors.destination && (
                <p className="text-[10px] text-rose-400">{journeyErrors.destination}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Travel Date</label>
              <input
                type="date"
                value={journeyForm.travelDate}
                onChange={(e) => setJourneyForm({ ...journeyForm, travelDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Primary Mode</label>
              <input
                type="text"
                value={journeyForm.primaryTransportMode}
                onChange={(e) => setJourneyForm({ ...journeyForm, primaryTransportMode: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Status</label>
              <select
                value={journeyForm.status}
                onChange={(e) => setJourneyForm({ ...journeyForm, status: e.target.value })}
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
              rows={3}
              value={journeyForm.summary}
              onChange={(e) => setJourneyForm({ ...journeyForm, summary: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditJourneyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              Save Journey
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE JOURNEY CONFIRMATION */}
      <Modal
        isOpen={isDeleteJourneyOpen}
        onClose={() => setIsDeleteJourneyOpen(false)}
        title="Delete Journey"
        subtitle="This action will permanently delete this journey and all its segments from local storage."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-rose-300">Delete "{activeJourney.title}"?</span>
              <p className="text-xs text-slate-300">
                This will delete the entire trip chain from {originTitle} to {destTitle} including all {segments.length} segments.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteJourneyOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Keep Journey
            </button>
            <button
              type="button"
              onClick={handleDeleteJourneyConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
            >
              Delete Trip Chain
            </button>
          </div>
        </div>
      </Modal>

      {/* ADD EXPENSE MODAL */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Journey Expense"
        subtitle="Log transit ticket, meals, or accommodation costs."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Item / Service Title</label>
            <input
              type="text"
              placeholder="e.g. City Bus Day Pass"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="45.00"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Transit">Transit & Tickets</option>
                <option value="Dining">Dining & Food</option>
                <option value="Lodging">Lodging & Hotels</option>
                <option value="Activities">Activities & Sights</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              Add Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD PACKING ITEM MODAL */}
      <Modal
        isOpen={isAddPackingOpen}
        onClose={() => setIsAddPackingOpen(false)}
        title="Add Packing Checklist Item"
        subtitle="Keep track of documents, electronics, or gear."
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePackingSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Item Name</label>
            <input
              type="text"
              placeholder="e.g. Student ID Badge"
              value={packingForm.item}
              onChange={(e) => setPackingForm({ ...packingForm, item: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Category</label>
            <select
              value={packingForm.category}
              onChange={(e) => setPackingForm({ ...packingForm, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            >
              <option value="Documents">Documents</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Gear">Gear & Luggage</option>
              <option value="Health">Health & Safety</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPackingOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
