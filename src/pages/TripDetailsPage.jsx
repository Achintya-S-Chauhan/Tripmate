import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Footprints,
  Bus,
  Train,
  Car,
  Ship,
  Bike,
  Plane,
  Edit3,
  Copy,
  Printer,
  Hotel,
  DollarSign,
  Route,
  Clock,
  Navigation,
  Sparkles,
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  Map as MapIcon,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Bookmark,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import InteractiveMap from '../components/map/InteractiveMap';
import Modal from '../components/common/Modal';
import LocationAutocomplete from '../components/common/LocationAutocomplete';
import { formatCurrency, SUPPORTED_CURRENCIES } from '../services/currency';
import { calculateRoute, formatDistance, formatDuration } from '../services/routing';
import { searchLocation } from '../services/geocoding';
import api from '../services/api';

// Transport mode icons
function getModeIcon(modeType) {
  const m = (modeType || '').toLowerCase();
  if (m.includes('train') || m.includes('rail') || m.includes('irctc')) {
    return <Train className="w-4 h-4 text-travel-accent" />;
  }
  if (m.includes('metro')) {
    return <Train className="w-4 h-4 text-emerald-500" />;
  }
  if (m.includes('bus') || m.includes('coach')) {
    return <Bus className="w-4 h-4 text-travel-terracotta" />;
  }
  if (m.includes('auto') || m.includes('rickshaw')) {
    return <Car className="w-4 h-4 text-amber-500" />;
  }
  if (m.includes('cab') || m.includes('taxi') || m.includes('ola') || m.includes('uber')) {
    return <Car className="w-4 h-4 text-sky-500" />;
  }
  if (m.includes('flight') || m.includes('plane') || m.includes('air')) {
    return <Plane className="w-4 h-4 text-travel-primary" />;
  }
  if (m.includes('walk') || m.includes('foot') || m.includes('pedestrian')) {
    return <Footprints className="w-4 h-4 text-travel-accent" />;
  }
  if (m.includes('bike') || m.includes('bicycle')) {
    return <Bike className="w-4 h-4 text-travel-accent" />;
  }
  if (m.includes('ferry') || m.includes('boat') || m.includes('ship')) {
    return <Ship className="w-4 h-4 text-travel-terracotta" />;
  }
  return <Car className="w-4 h-4 text-travel-secondary" />;
}

export default function TripDetailsPage() {
  const {
    journeys,
    activeJourneyId,
    activeJourney,
    setActivePage,
    editJourney,
    duplicateJourney,
    deleteJourney,
    addSegmentToJourney,
    editSegmentInJourney,
    deleteSegmentFromJourney,
    reorderSegmentInJourney,
    addStayToJourney,
    deleteStayFromJourney,
    addPlaceToJourney,
    togglePlaceVisited,
    deletePlaceFromJourney,
    addExpenseToJourney,
    deleteExpenseFromJourney,
    settings,
  } = useApp();

  // Active workspace tab: 'overview' | 'travel' | 'stays' | 'places' | 'expenses' | 'map'
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isAddLegOpen, setIsAddLegOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);
  const [isAddStayOpen, setIsAddStayOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Search stays & places state
  const [isSearchingStays, setIsSearchingStays] = useState(false);
  const [staysSearchResults, setStaysSearchResults] = useState([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placesSearchResults, setPlacesSearchResults] = useState([]);
  const [placesSearchQuery, setPlacesSearchQuery] = useState('');

  // Transport Discovery state
  const [discoveryOrigin, setDiscoveryOrigin] = useState(null);
  const [discoveryDest, setDiscoveryDest] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [discoveryTab, setDiscoveryTab] = useState('alternatives');
  const [addingLegKey, setAddingLegKey] = useState(null);

  // Helper to check if a discovered transit option or road route is already present in this trip's legs
  const isLegAlreadyAdded = (leg) => {
    if (!leg) return false;
    const origin = (leg.origin || leg.from || activeJourney?.origin || '').trim().toLowerCase();
    const dest = (leg.destination || leg.to || activeJourney?.destination || '').trim().toLowerCase();
    const mode = (leg.transportMode || leg.mode || leg.type || '').trim().toLowerCase();
    const dist = parseFloat(leg.distanceKm) || 0;

    return segments.some((s) => {
      const sOrigin = (s.origin || s.from || '').trim().toLowerCase();
      const sDest = (s.destination || s.to || '').trim().toLowerCase();
      const sMode = (s.transportMode || s.mode || s.type || '').trim().toLowerCase();
      const sDist = parseFloat(s.distanceKm) || 0;
      return sOrigin === origin && sDest === dest && (sMode === mode || Math.abs(sDist - dist) < 0.1);
    });
  };

  // Progressive Ranking & Fallbacks for Transport Alternatives using OR logic
  const rankedAlternatives = useMemo(() => {
    if (!discoveryResults?.alternatives || !Array.isArray(discoveryResults.alternatives)) {
      return [];
    }
    const prefs = settings?.travelPreferences || {
      preferFewerTransfers: false,
      preferDirect: false,
      maxWalkingMinutes: 20,
    };

    const maxWalk = prefs.maxWalkingMinutes || 20;
    const hasAnyPreference = Boolean(prefs.preferDirect || prefs.preferFewerTransfers || prefs.maxWalkingMinutes);

    const scored = discoveryResults.alternatives.map((alt) => {
      let score = 50;
      const badges = [];
      let matchedAnyPreference = false;

      // 1. Direct alternative preference match
      if (prefs.preferDirect) {
        if (alt.transfers === 0) {
          score += 35;
          matchedAnyPreference = true;
          badges.push({ text: 'Direct Route Match', type: 'match' });
        }
      }

      // 2. Fewer transfers preference match (independent alternative OR condition)
      if (prefs.preferFewerTransfers) {
        if (alt.transfers === 0) {
          score += 30;
          matchedAnyPreference = true;
          if (!prefs.preferDirect) {
            badges.push({ text: '0 Transfers (Optimal)', type: 'match' });
          }
        } else if (alt.transfers <= 1) {
          score += 20;
          matchedAnyPreference = true;
          badges.push({ text: 'Low Transfers (1 Transfer)', type: 'match' });
        }
      }

      // 3. Max walking minutes preference match (independent alternative OR condition)
      if (prefs.maxWalkingMinutes) {
        if (alt.walkingMinutes <= maxWalk) {
          score += 25;
          matchedAnyPreference = true;
          badges.push({ text: `Walking ≤ ${maxWalk}m Match`, type: 'match' });
        }
      }

      // If route satisfies preferences (either/OR), explain boost; if not, explain why it ranks lower without discarding it
      if (hasAnyPreference && !matchedAnyPreference) {
        badges.push({
          text: alt.transfers > 0 
            ? `Alternative (${alt.transfers} transfer${alt.transfers === 1 ? '' : 's'}, ${alt.walkingMinutes}m walk)`
            : `Alternative (${alt.walkingMinutes}m walk)`,
          type: 'alternative',
        });
      } else if (badges.length === 0) {
        badges.push({ text: 'Recommended Corridor Match', type: 'match' });
      }

      return {
        ...alt,
        calculatedScore: score,
        badges,
      };
    });

    return scored.sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [discoveryResults, settings?.travelPreferences]);

  // Leg Form state
  const [legForm, setLegForm] = useState({
    title: '',
    origin: '',
    destination: '',
    type: 'train',
    operator: '',
    serviceNumber: '',
    departureDate: '',
    departureTime: '',
    departureStation: '',
    arrivalDate: '',
    arrivalTime: '',
    arrivalStation: '',
    distanceKm: '',
    durationMinutes: '',
    transfers: '0',
    price: '',
    currency: 'USD',
    bookingStatus: 'planned',
    bookingUrl: '',
    notes: '',
  });

  // Stay Form state
  const [stayForm, setStayForm] = useState({
    name: '',
    propertyType: 'hotel',
    address: '',
    checkInDate: '',
    checkInTime: '14:00',
    checkOutDate: '',
    checkOutTime: '11:00',
    nights: '1',
    totalPrice: '',
    currency: 'USD',
    bookingStatus: 'planned',
    bookingUrl: '',
    confirmationNumber: '',
    notes: '',
  });

  // Place Form state
  const [placeForm, setPlaceForm] = useState({
    title: '',
    category: 'attraction',
    address: '',
    day: '1',
    visitTime: '',
    notes: '',
  });

  // Expense Form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    currency: 'USD',
    category: 'Transport',
    date: new Date().toISOString().split('T')[0],
    linkedType: 'none',
    linkedId: '',
    notes: '',
  });

  // Trip Edit Form state
  const [tripForm, setTripForm] = useState({
    title: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    status: '',
    budget: '',
    currency: 'USD',
    notes: '',
  });

  if (!activeJourney) {
    return (
      <div className="py-20 text-center space-y-4">
        <Compass className="w-12 h-12 text-travel-accent mx-auto opacity-70" />
        <h3 className="text-xl font-bold text-travel-primary">No Trip Selected</h3>
        <p className="text-xs text-travel-muted">Choose a trip from your library to start planning.</p>
        <button
          type="button"
          onClick={() => setActivePage('journeys')}
          className="px-5 py-2.5 rounded-xl btn-travel-primary text-xs font-bold transition shadow-md"
        >
          Return to My Trips
        </button>
      </div>
    );
  }

  const segments = activeJourney.segments || activeJourney.travelSegments || [];
  const stays = activeJourney.stays || [];
  const places = activeJourney.places || [];
  const expenses = activeJourney.expenses || [];
  const tripCurrency = activeJourney.currency || settings?.currency || 'USD';

  // Total travel costs (sum of prices on confirmed legs)
  const totalTravelCost = useMemo(() => {
    return segments.reduce((sum, seg) => sum + (parseFloat(seg.price) || 0), 0);
  }, [segments]);

  // Total accommodation cost (sum of stays)
  const totalStayCost = useMemo(() => {
    return stays.reduce((sum, st) => sum + (parseFloat(st.totalPrice) || 0), 0);
  }, [stays]);

  // Total recorded expenses
  const totalRecordedExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  }, [expenses]);

  // Total distance strictly from distinct legs (never multiply distance due to duplicate records)
  const totalTripDistanceKm = useMemo(() => {
    const seen = new Set();
    const distinct = [];
    for (const s of segments) {
      if (!s) continue;
      const origin = (s.origin || s.from || '').trim().toLowerCase();
      const destination = (s.destination || s.to || '').trim().toLowerCase();
      const mode = (s.transportMode || s.mode || s.type || '').trim().toLowerCase();
      const dist = parseFloat(s.distanceKm) || 0;
      const key = `${origin}-->${destination}::${mode}::${dist.toFixed(1)}`;
      if (!seen.has(key)) {
        seen.add(key);
        distinct.push(s);
      }
    }
    return parseFloat(distinct.reduce((sum, s) => sum + (parseFloat(s.distanceKm) || 0), 0).toFixed(1));
  }, [segments]);

  // Check schedule conflicts between consecutive legs
  const scheduleConflicts = useMemo(() => {
    const conflicts = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      // Check if dates match and times overlap
      const cDate = current.arrivalDate || current.departureDate || activeJourney.startDate;
      const nDate = next.departureDate || next.arrivalDate || activeJourney.startDate;

      if (cDate && nDate && cDate === nDate && current.endTime && next.startTime) {
        if (current.endTime > next.startTime) {
          conflicts.push({
            indexA: i,
            indexB: i + 1,
            legA: current,
            legB: next,
            message: `Leg #${i + 1} (${current.title}) arrives at ${current.endTime}, which is after Leg #${i + 2} (${next.title}) departs at ${next.startTime}.`,
          });
        }
      }
    }
    return conflicts;
  }, [segments, activeJourney.startDate]);

  // Trigger Live Transport Discovery for current trip origin & destination
  const handleDiscoverTransport = async () => {
    setIsDiscovering(true);
    try {
      const oCoords = activeJourney.waypoints?.[0]?.coords || activeJourney.center || null;
      const dCoords = activeJourney.waypoints?.[activeJourney.waypoints?.length - 1]?.coords || activeJourney.center || null;

      let oLat, oLng, dLat, dLng;
      if (oCoords && oCoords.length === 2) {
        [oLat, oLng] = oCoords;
      }
      if (dCoords && dCoords.length === 2) {
        [dLat, dLng] = dCoords;
      }

      const res = await api.transport.discover({
        origin: activeJourney.origin,
        destination: activeJourney.destination,
        originLat: oLat,
        originLng: oLng,
        destLat: dLat,
        destLng: dLng,
        date: activeJourney.startDate,
      });

      if (res.results) {
        setDiscoveryResults(res.results);
      }
    } catch (err) {
      console.warn('Transport discovery query failed:', err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Add real OSRM route option directly as a leg
  const handleAddDiscoveredRoute = async (routeOption) => {
    if (!routeOption || addingLegKey) return;
    const legKey = routeOption.source || `${routeOption.from}_${routeOption.to}_${routeOption.mode}`;
    if (isLegAlreadyAdded(routeOption)) return;

    setAddingLegKey(legKey);
    try {
      await addSegmentToJourney(activeJourney.id || activeJourney._id, {
        title: routeOption.title,
        origin: routeOption.from || activeJourney.origin,
        destination: routeOption.to || activeJourney.destination,
        type: routeOption.mode.toLowerCase().includes('walk') ? 'walking' : 'car',
        transportMode: routeOption.mode,
        distanceKm: routeOption.distanceKm,
        durationMinutes: routeOption.durationMinutes,
        operator: routeOption.operator,
        transfers: 0,
        source: routeOption.source,
        geometry: routeOption.geometry,
      });
    } finally {
      setAddingLegKey(null);
    }
  };

  // Add a ranked corridor transit alternative directly as a leg
  const handleAddDiscoveredAlternative = async (alt) => {
    if (!alt || addingLegKey) return;
    const legKey = alt.id || `${alt.origin || activeJourney.origin}_${alt.destination || activeJourney.destination}_${alt.mode}`;
    if (isLegAlreadyAdded(alt)) return;

    setAddingLegKey(legKey);
    try {
      await addSegmentToJourney(activeJourney.id || activeJourney._id, {
        title: alt.title,
        origin: alt.origin || activeJourney.origin,
        destination: alt.destination || activeJourney.destination,
        type: alt.type,
        transportMode: alt.mode,
        operator: alt.operator,
        distanceKm: alt.distanceKm,
        durationMinutes: alt.durationMinutes,
        transfers: alt.transfers,
        source: alt.source || 'Corridor Route',
      });
    } finally {
      setAddingLegKey(null);
    }
  };

  // Search Real Stays near Destination via OpenStreetMap
  const handleSearchStays = async () => {
    setIsSearchingStays(true);
    try {
      const destCoords = activeJourney.waypoints?.[activeJourney.waypoints?.length - 1]?.coords || activeJourney.center || null;
      const params = { destination: activeJourney.destination };
      if (destCoords && destCoords.length === 2) {
        params.lat = destCoords[0];
        params.lng = destCoords[1];
      }
      const res = await api.transport.searchStays(params);
      if (res.stays) {
        setStaysSearchResults(res.stays);
      }
    } catch (err) {
      console.warn('Stays search error:', err.message);
    } finally {
      setIsSearchingStays(false);
    }
  };

  // Search Real Places / Attractions near Destination
  const handleSearchPlaces = async () => {
    if (!placesSearchQuery && !activeJourney.destination) return;
    setIsSearchingPlaces(true);
    try {
      const q = placesSearchQuery.trim()
        ? `${placesSearchQuery.trim()} ${activeJourney.destination}`
        : `attractions in ${activeJourney.destination}`;
      const results = await searchLocation(q, 6);
      setPlacesSearchResults(results);
    } catch (err) {
      console.warn('Places search failed:', err.message);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Open Edit Trip Modal
  const openEditTripModal = () => {
    setTripForm({
      title: activeJourney.title || '',
      origin: activeJourney.origin || '',
      destination: activeJourney.destination || '',
      startDate: activeJourney.startDate || activeJourney.travelDate || '',
      endDate: activeJourney.endDate || '',
      status: activeJourney.status || 'Upcoming',
      budget: (activeJourney.budget || '').toString(),
      currency: activeJourney.currency || 'USD',
      notes: activeJourney.notes || activeJourney.summary || '',
    });
    setIsEditTripOpen(true);
  };

  const handleEditTripSubmit = async (e) => {
    e.preventDefault();
    await editJourney(activeJourney.id || activeJourney._id, {
      title: tripForm.title.trim() || `${tripForm.origin} ➔ ${tripForm.destination}`,
      origin: tripForm.origin.trim(),
      destination: tripForm.destination.trim(),
      startDate: tripForm.startDate,
      endDate: tripForm.endDate,
      travelDate: tripForm.startDate,
      isUndated: !tripForm.startDate && !tripForm.endDate,
      status: tripForm.status,
      budget: parseFloat(tripForm.budget) || 0,
      currency: tripForm.currency,
      notes: tripForm.notes.trim(),
    });
    setIsEditTripOpen(false);
  };

  // Open Custom Leg Modal
  const openCustomLegModal = (prefillType = 'train') => {
    setLegForm({
      title: '',
      origin: activeJourney.origin,
      destination: activeJourney.destination,
      type: prefillType,
      operator: '',
      serviceNumber: '',
      departureDate: activeJourney.startDate || '',
      departureTime: '09:00',
      departureStation: '',
      arrivalDate: activeJourney.startDate || '',
      arrivalTime: '12:00',
      arrivalStation: '',
      distanceKm: '',
      durationMinutes: '',
      transfers: '0',
      price: '',
      currency: tripCurrency,
      bookingStatus: 'planned',
      bookingUrl: '',
      notes: '',
    });
    setEditingLeg(null);
    setIsAddLegOpen(true);
  };

  const handleLegSubmit = async (e) => {
    e.preventDefault();
    if (!legForm.origin.trim() || !legForm.destination.trim()) return;

    const payload = {
      title: legForm.title.trim() || `${legForm.type.toUpperCase()}: ${legForm.origin} ➔ ${legForm.destination}`,
      origin: legForm.origin.trim(),
      destination: legForm.destination.trim(),
      type: legForm.type,
      transportMode: legForm.type.charAt(0).toUpperCase() + legForm.type.slice(1),
      operator: legForm.operator.trim(),
      serviceNumber: legForm.serviceNumber.trim(),
      departureDate: legForm.departureDate,
      departureTime: legForm.departureTime,
      departureStation: legForm.departureStation.trim(),
      arrivalDate: legForm.arrivalDate || legForm.departureDate,
      arrivalTime: legForm.arrivalTime,
      arrivalStation: legForm.arrivalStation.trim(),
      distanceKm: parseFloat(legForm.distanceKm) || 0,
      durationMinutes: parseInt(legForm.durationMinutes, 10) || 0,
      transfers: parseInt(legForm.transfers, 10) || 0,
      price: legForm.price ? parseFloat(legForm.price) : undefined,
      currency: legForm.currency || tripCurrency,
      bookingStatus: legForm.bookingStatus,
      bookingUrl: legForm.bookingUrl.trim(),
      notes: legForm.notes.trim(),
      source: 'User Added',
    };

    if (editingLeg) {
      await editSegmentInJourney(activeJourney.id || activeJourney._id, editingLeg.id || editingLeg._id, payload);
    } else {
      await addSegmentToJourney(activeJourney.id || activeJourney._id, payload);
    }
    setIsAddLegOpen(false);
  };

  // Open Edit Leg Modal
  const openEditLeg = (leg) => {
    setEditingLeg(leg);
    setLegForm({
      title: leg.title || '',
      origin: leg.origin || leg.from || '',
      destination: leg.destination || leg.to || '',
      type: leg.type || 'train',
      operator: leg.operator || '',
      serviceNumber: leg.serviceNumber || '',
      departureDate: leg.departureDate || '',
      departureTime: leg.startTime || leg.departureTime || '',
      departureStation: leg.departureStation || '',
      arrivalDate: leg.arrivalDate || '',
      arrivalTime: leg.endTime || leg.arrivalTime || '',
      arrivalStation: leg.arrivalStation || '',
      distanceKm: (leg.distanceKm || '').toString(),
      durationMinutes: (leg.durationMinutes || '').toString(),
      transfers: (leg.transfers || 0).toString(),
      price: leg.price != null ? leg.price.toString() : '',
      currency: leg.currency || tripCurrency,
      bookingStatus: leg.bookingStatus || 'planned',
      bookingUrl: leg.bookingUrl || '',
      notes: leg.notes || '',
    });
    setIsAddLegOpen(true);
  };

  // Handle Stay Submit
  const handleStaySubmit = async (e) => {
    e.preventDefault();
    if (!stayForm.name.trim()) return;

    await addStayToJourney(activeJourney.id || activeJourney._id, {
      name: stayForm.name.trim(),
      propertyType: stayForm.propertyType,
      address: stayForm.address.trim(),
      checkInDate: stayForm.checkInDate,
      checkInTime: stayForm.checkInTime,
      checkOutDate: stayForm.checkOutDate,
      checkOutTime: stayForm.checkOutTime,
      nights: parseInt(stayForm.nights, 10) || 1,
      totalPrice: parseFloat(stayForm.totalPrice) || 0,
      currency: stayForm.currency || tripCurrency,
      bookingStatus: stayForm.bookingStatus,
      bookingUrl: stayForm.bookingUrl.trim(),
      confirmationNumber: stayForm.confirmationNumber.trim(),
      notes: stayForm.notes.trim(),
      source: 'User Added',
    });
    setIsAddStayOpen(false);
  };

  // Handle Place Submit
  const handlePlaceSubmit = async (e) => {
    e.preventDefault();
    if (!placeForm.title.trim()) return;

    await addPlaceToJourney(activeJourney.id || activeJourney._id, {
      title: placeForm.title.trim(),
      category: placeForm.category,
      address: placeForm.address.trim(),
      day: parseInt(placeForm.day, 10) || 1,
      visitTime: placeForm.visitTime,
      notes: placeForm.notes.trim(),
      source: 'User Added',
    });
    setIsAddPlaceOpen(false);
  };

  // Handle Expense Submit
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title.trim() || !expenseForm.amount) return;

    await addExpenseToJourney(activeJourney.id || activeJourney._id, {
      title: expenseForm.title.trim(),
      amount: parseFloat(expenseForm.amount) || 0,
      currency: expenseForm.currency || tripCurrency,
      category: expenseForm.category,
      date: expenseForm.date,
      linkedType: expenseForm.linkedType,
      linkedId: expenseForm.linkedId,
      notes: expenseForm.notes.trim(),
    });
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Trip Header & Action Bar */}
      <div className="bg-travel-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-travel shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActivePage('journeys')}
                className="text-xs text-travel-muted hover:text-travel-primary transition flex items-center gap-1 mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Trips</span>
              </button>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  activeJourney.status === 'In Progress' || activeJourney.status === 'Active'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : activeJourney.status === 'Completed'
                    ? 'bg-travel-accent-soft text-travel-accent border border-travel'
                    : 'bg-travel-subtle text-travel-secondary border border-travel'
                }`}
              >
                {activeJourney.status || 'Upcoming'}
              </span>

              {activeJourney.startDate ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-travel-subtle text-travel-muted font-mono border border-travel flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-travel-muted" />
                  {activeJourney.startDate}
                  {activeJourney.endDate && activeJourney.endDate !== activeJourney.startDate ? ` ➔ ${activeJourney.endDate}` : ''}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-travel-subtle text-travel-muted font-mono border border-travel">
                  Undated Trip
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-travel-primary tracking-tight">
              {activeJourney.title}
            </h1>

            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-semibold text-travel-secondary">
              <span className="text-travel-accent">{activeJourney.origin}</span>
              <ArrowRight className="w-3.5 h-3.5 text-travel-muted" />
              <span className="text-travel-secondary">{activeJourney.destination}</span>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary border border-travel text-xs font-semibold transition flex items-center gap-1.5"
              title="Print or export clean itinerary"
            >
              <Printer className="w-3.5 h-3.5 text-travel-accent" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => duplicateJourney(activeJourney.id || activeJourney._id)}
              className="px-3.5 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary border border-travel text-xs font-semibold transition flex items-center gap-1.5"
              title="Duplicate trip"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              onClick={openEditTripModal}
              className="px-3.5 py-2 rounded-xl btn-travel-secondary border border-travel text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* 2. The 6 Dedicated Workspace Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border-t border-travel pt-3 overflow-x-auto custom-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Layers, count: null },
            { id: 'travel', label: 'Travel', icon: Route, count: segments.length },
            { id: 'stays', label: 'Stays', icon: Hotel, count: stays.length },
            { id: 'places', label: 'Places', icon: MapPin, count: places.length },
            { id: 'expenses', label: 'Expenses', icon: CreditCard, count: expenses.length },
            { id: 'map', label: 'Map', icon: MapIcon, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-travel-accent text-[var(--accent-primary-fg)] shadow-sm'
                    : 'text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-primary-fg)]' : 'text-travel-secondary'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-travel-card text-travel-primary font-bold' : 'bg-travel-subtle text-travel-secondary border border-travel'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-travel-card rounded-2xl p-4 border border-travel shadow-md">
              <span className="text-[11px] text-travel-muted font-medium flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-travel-accent" />
                Tracked Distance
              </span>
              <div className="text-xl sm:text-2xl font-black text-travel-primary font-mono mt-1">
                {formatDistance(totalTripDistanceKm, settings?.distanceUnit)}
              </div>
              <p className="text-[10px] text-travel-muted mt-1">
                {segments.length} confirmed transport leg{segments.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="bg-travel-card rounded-2xl p-4 border border-travel shadow-md">
              <span className="text-[11px] text-travel-muted font-medium flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-indigo-400" />
                Travel Transport Cost
              </span>
              <div className="text-xl sm:text-2xl font-black text-travel-primary font-mono mt-1">
                {formatCurrency(totalTravelCost, tripCurrency)}
              </div>
              <p className="text-[10px] text-travel-muted mt-1">From provider fares & planned legs</p>
            </div>

            <div className="bg-travel-card rounded-2xl p-4 border border-travel shadow-md">
              <span className="text-[11px] text-travel-muted font-medium flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-violet-400" />
                Accommodation Cost
              </span>
              <div className="text-xl sm:text-2xl font-black text-travel-primary font-mono mt-1">
                {formatCurrency(totalStayCost, tripCurrency)}
              </div>
              <p className="text-[10px] text-travel-muted mt-1">
                {stays.length} lodging propert{stays.length === 1 ? 'y' : 'ies'}
              </p>
            </div>

            <div className="bg-travel-card rounded-2xl p-4 border border-travel shadow-md">
              <span className="text-[11px] text-travel-muted font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Recorded Expenses
              </span>
              <div className="text-xl sm:text-2xl font-black text-travel-primary font-mono mt-1">
                {formatCurrency(totalRecordedExpenses, tripCurrency)}
              </div>
              <p className="text-[10px] text-travel-muted mt-1">
                {activeJourney.budget ? `Budget: ${formatCurrency(activeJourney.budget, tripCurrency)}` : 'No budget set'}
              </p>
            </div>
          </div>

          {/* Conflict Warning if any */}
          {scheduleConflicts.length > 0 && (
            <div className="bg-amber-950/30 border border-amber-600/40 rounded-2xl p-4 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Schedule Conflict Detected</span>
              </div>
              <p>{scheduleConflicts[0].message}</p>
            </div>
          )}

          {/* 2-Column Overview Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 cols: Itinerary & Stays Snapshot */}
            <div className="lg:col-span-2 space-y-6">
              {/* Transport Legs Card */}
              <div className="bg-travel-card rounded-2xl p-5 border border-travel shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-travel pb-3">
                  <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                    <Route className="w-4 h-4 text-travel-accent" />
                    <span>Transport Connections & Multi-Leg Route</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('travel')}
                    className="text-xs text-travel-accent hover:underline font-semibold"
                  >
                    View All ({segments.length}) →
                  </button>
                </div>

                {segments.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Route className="w-8 h-8 text-travel-muted mx-auto" />
                    <p className="text-xs text-travel-muted">No travel legs added yet.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('travel')}
                      className="px-4 py-2 rounded-xl btn-travel-primary text-xs transition"
                    >
                      Explore Transport Options
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {segments.slice(0, 3).map((seg, idx) => (
                      <div
                        key={seg.id || seg._id || idx}
                        className="p-3 rounded-xl bg-travel-subtle/60 border border-travel/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-2 rounded-lg bg-travel-subtle text-travel-accent shrink-0">
                            {getModeIcon(seg.type || seg.transportMode)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-travel-primary truncate">{seg.title}</p>
                            <p className="text-[11px] text-travel-muted truncate">
                              {seg.origin || seg.from} ➔ {seg.destination || seg.to}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-travel-secondary block">
                            {formatDistance(seg.distanceKm, settings?.distanceUnit)}
                          </span>
                          {seg.price != null && (
                            <span className="text-[11px] text-emerald-400 font-mono">
                              {formatCurrency(seg.price, seg.currency || tripCurrency)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stays Snapshot Card */}
              <div className="bg-travel-card rounded-2xl p-5 border border-travel shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-travel pb-3">
                  <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                    <Hotel className="w-4 h-4 text-violet-400" />
                    <span>Accommodations & Lodging</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stays')}
                    className="text-xs text-travel-accent hover:underline font-semibold"
                  >
                    View All ({stays.length}) →
                  </button>
                </div>

                {stays.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Hotel className="w-8 h-8 text-travel-muted mx-auto" />
                    <p className="text-xs text-travel-muted">No accommodation added.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('stays')}
                      className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary font-bold text-xs transition border border-travel"
                    >
                      Add Accommodation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {stays.slice(0, 3).map((st, idx) => (
                      <div
                        key={st.id || st._id || idx}
                        className="p-3 rounded-xl bg-travel-subtle/60 border border-travel/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800/60">
                            {st.propertyType || 'Hotel'}
                          </span>
                          <p className="font-bold text-travel-primary mt-1 truncate">{st.name}</p>
                          <p className="text-[11px] text-travel-muted truncate">{st.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-emerald-400 font-mono font-bold block">
                            {formatCurrency(st.totalPrice, st.currency || tripCurrency)}
                          </span>
                          <span className="text-[10px] text-travel-muted font-mono">
                            {st.nights || 1} night{st.nights === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 col: Notes, Places & Budget Summary */}
            <div className="space-y-6">
              {/* Trip Notes Card */}
              <div className="bg-travel-card rounded-2xl p-5 border border-travel shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-travel pb-2.5">
                  <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                    <Info className="w-4 h-4 text-travel-accent" />
                    <span>Trip Notes</span>
                  </h3>
                  <button
                    type="button"
                    onClick={openEditTripModal}
                    className="text-xs text-travel-accent hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-xs text-travel-secondary leading-relaxed whitespace-pre-line">
                  {activeJourney.notes || activeJourney.summary || 'No notes added yet for this trip. Click Edit to add packing reminders, pass codes, or goals.'}
                </p>
              </div>

              {/* Places Summary Card */}
              <div className="bg-travel-card rounded-2xl p-5 border border-travel shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-travel pb-2.5">
                  <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Planned Places</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('places')}
                    className="text-xs text-travel-accent hover:underline"
                  >
                    Explore ({places.length})
                  </button>
                </div>
                {places.length === 0 ? (
                  <p className="text-xs text-travel-muted italic py-2">No places or attractions added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {places.slice(0, 3).map((pl, idx) => (
                      <div key={pl.id || pl._id || idx} className="text-xs flex items-center justify-between">
                        <span className="text-travel-secondary truncate max-w-[160px]">{pl.title}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-travel-subtle text-travel-muted">
                          {pl.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget & Remaining Summary */}
              <div className="bg-travel-card rounded-2xl p-5 border border-travel shadow-md space-y-3">
                <div className="flex items-center justify-between border-b border-travel pb-2.5">
                  <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Budget & Spend</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('expenses')}
                    className="text-xs text-travel-accent hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-travel-muted">
                    <span>Trip Budget:</span>
                    <span className="font-mono text-travel-primary">
                      {activeJourney.budget ? formatCurrency(activeJourney.budget, tripCurrency) : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between text-travel-muted">
                    <span>Total Recorded:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(totalRecordedExpenses, tripCurrency)}
                    </span>
                  </div>
                  {activeJourney.budget > 0 && (
                    <div className="flex justify-between text-travel-muted pt-1 border-t border-travel/80">
                      <span>Remaining:</span>
                      <span
                        className={`font-mono font-bold ${
                          activeJourney.budget - totalRecordedExpenses < 0 ? 'text-rose-400' : 'text-travel-accent'
                        }`}
                      >
                        {formatCurrency(activeJourney.budget - totalRecordedExpenses, tripCurrency)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRAVEL (Multi-Leg Itinerary & Real Transport Discovery) */}
      {activeTab === 'travel' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-travel-card p-4 rounded-2xl border border-travel">
            <div>
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <Route className="w-5 h-5 text-travel-accent" />
                <span>Multi-Leg Transport Itinerary</span>
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Build your itinerary across trains, buses, flights, driving, or walking connections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscoverTransport}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-accent border border-travel text-xs font-bold transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Discover Options</span>
              </button>
              <button
                type="button"
                onClick={() => openCustomLegModal('train')}
                className="px-4 py-2 rounded-xl btn-travel-primary text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Leg</span>
              </button>
            </div>
          </div>

          {/* Schedule Conflict Warning */}
          {scheduleConflicts.map((conf, idx) => (
            <div key={idx} className="bg-amber-950/40 border border-amber-600/50 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300">Schedule Conflict Warning</p>
                <p className="mt-0.5">{conf.message}</p>
              </div>
            </div>
          ))}

          {/* Transport Discovery Drawer / Panel */}
          {discoveryResults && (
            <div className="bg-travel-subtle rounded-2xl p-5 border border-travel space-y-4">
              <div className="flex items-center justify-between border-b border-travel pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-travel-accent" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-travel-accent">
                    Live Transport Provider Discovery
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscoveryResults(null)}
                  className="text-travel-muted hover:text-travel-primary p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Selection Pills */}
              <div className="flex items-center gap-2 border-b border-travel/80 pb-2 overflow-x-auto custom-scrollbar">
                {[
                  { id: 'alternatives', label: `Corridor Alternatives (${rankedAlternatives.length})` },
                  { id: 'driving', label: 'Driving / Road' },
                  { id: 'walking', label: 'Walking' },
                  { id: 'train', label: 'IRCTC / Train' },
                  { id: 'bus', label: 'State Bus' },
                  { id: 'flight', label: 'Flight' },
                  { id: 'transit', label: 'City Metro / Auto' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDiscoveryTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      discoveryTab === tab.id
                        ? 'btn-travel-primary'
                        : 'text-travel-muted hover:text-travel-primary hover:bg-travel-subtle'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Alternatives result (Progressive Fallback & Ranking View) */}
              {discoveryTab === 'alternatives' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-travel-muted">
                    <span>
                      Ranked by preferences:{' '}
                      <strong className="text-travel-primary">
                        {settings?.travelPreferences?.preferDirect
                          ? 'Direct Priority'
                          : settings?.travelPreferences?.preferFewerTransfers
                          ? 'Fewer Transfers'
                          : 'Balanced Corridors'}
                      </strong>
                      {' • '}
                      Max Walk: <strong>{settings?.travelPreferences?.maxWalkingMinutes || 20}m</strong>
                    </span>
                    <span className="text-[10px] font-mono">No options filtered out</span>
                  </div>

                  {rankedAlternatives.length === 0 ? (
                    <div className="p-4 rounded-xl bg-travel-subtle border border-travel text-xs text-travel-muted text-center">
                      No corridor alternatives generated for this route.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {rankedAlternatives.map((alt) => (
                        <div
                          key={alt.id}
                          className="p-4 rounded-xl bg-travel-subtle border border-travel hover:border-travel-accent/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            {/* Badges Row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="flex items-center gap-1 font-bold text-travel-primary bg-travel-card px-2 py-0.5 rounded border border-travel font-mono text-[11px]">
                                {getModeIcon(alt.mode || alt.type)}
                                <span>{alt.mode}</span>
                              </span>

                              {alt.badges?.map((b, bIdx) => (
                                <span
                                  key={bIdx}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                                    b.type === 'match'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : b.type === 'relaxed'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                  }`}
                                >
                                  {b.text}
                                </span>
                              ))}
                            </div>

                            <h5 className="text-sm font-bold text-travel-primary truncate">
                              {alt.title}
                            </h5>

                            <div className="flex items-center gap-3 text-[11px] text-travel-secondary flex-wrap font-mono">
                              <span>{formatDistance(alt.distanceKm, settings?.distanceUnit)}</span>
                              <span>• {alt.durationFormatted}</span>
                              <span>• {alt.transfers} transfer{alt.transfers === 1 ? '' : 's'}</span>
                              <span>• Walk: {alt.walkingMinutes} min</span>
                              {alt.estimatedFare && (
                                <span className="font-bold text-emerald-400">• Fare: {alt.estimatedFare}</span>
                              )}
                              <span className="text-travel-muted">({alt.operator})</span>
                            </div>
                          </div>

                          {(() => {
                            const alreadyAdded = isLegAlreadyAdded(alt);
                            const altKey = alt.id || `${alt.origin || activeJourney.origin}_${alt.destination || activeJourney.destination}_${alt.mode}`;
                            const isAdding = addingLegKey === altKey;
                            return (
                              <button
                                type="button"
                                disabled={alreadyAdded || isAdding || Boolean(addingLegKey)}
                                onClick={() => handleAddDiscoveredAlternative(alt)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 self-start sm:self-center ${
                                  alreadyAdded
                                    ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                                    : 'btn-travel-primary active:scale-95'
                                }`}
                              >
                                {alreadyAdded ? 'Added ✓' : isAdding ? 'Adding...' : 'Add to Itinerary'}
                              </button>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Driving / Road result */}
              {discoveryTab === 'driving' && (
                <div className="text-xs space-y-3">
                  {discoveryResults.driving ? (
                    <div className="p-4 rounded-xl bg-travel-subtle border border-travel flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-travel-subtle text-travel-accent border border-travel">
                          {discoveryResults.driving.source}
                        </span>
                        <h5 className="text-sm font-bold text-travel-primary mt-1.5">
                          Direct Road Route: {discoveryResults.driving.from} ➔ {discoveryResults.driving.to}
                        </h5>
                        <p className="text-xs text-travel-muted mt-0.5 font-mono">
                          {formatDistance(discoveryResults.driving.distanceKm, settings?.distanceUnit)} • {discoveryResults.driving.durationFormatted}
                        </p>
                      </div>
                      {(() => {
                        const roadAlreadyAdded = isLegAlreadyAdded(discoveryResults.driving);
                        const roadKey = discoveryResults.driving.source || `${discoveryResults.driving.from}_${discoveryResults.driving.to}_${discoveryResults.driving.mode}`;
                        const isAddingRoad = addingLegKey === roadKey;
                        return (
                          <button
                            type="button"
                            disabled={roadAlreadyAdded || isAddingRoad || Boolean(addingLegKey)}
                            onClick={() => handleAddDiscoveredRoute(discoveryResults.driving)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                              roadAlreadyAdded
                                ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                                : 'btn-travel-primary active:scale-95'
                            }`}
                          >
                            {roadAlreadyAdded ? 'Added ✓' : isAddingRoad ? 'Adding...' : 'Add to Itinerary'}
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-travel-muted">Road routing unavailable for these coordinates.</p>
                  )}
                </div>
              )}

              {/* Walking result */}
              {discoveryTab === 'walking' && (
                <div className="text-xs space-y-3">
                  {discoveryResults.walking ? (
                    <div className="p-4 rounded-xl bg-travel-subtle border border-travel flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {discoveryResults.walking.source}
                        </span>
                        <h5 className="text-sm font-bold text-travel-primary mt-1.5">
                          Pedestrian Connection: {discoveryResults.walking.from} ➔ {discoveryResults.walking.to}
                        </h5>
                        <p className="text-xs text-travel-muted mt-0.5 font-mono">
                          {formatDistance(discoveryResults.walking.distanceKm, settings?.distanceUnit)} • {discoveryResults.walking.durationFormatted}
                        </p>
                      </div>
                      {(() => {
                        const walkAlreadyAdded = isLegAlreadyAdded(discoveryResults.walking);
                        const walkKey = discoveryResults.walking.source || `${discoveryResults.walking.from}_${discoveryResults.walking.to}_${discoveryResults.walking.mode}`;
                        const isAddingWalk = addingLegKey === walkKey;
                        return (
                          <button
                            type="button"
                            disabled={walkAlreadyAdded || isAddingWalk || Boolean(addingLegKey)}
                            onClick={() => handleAddDiscoveredRoute(discoveryResults.walking)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                              walkAlreadyAdded
                                ? 'bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                                : 'btn-travel-primary active:scale-95'
                            }`}
                          >
                            {walkAlreadyAdded ? 'Added ✓' : isAddingWalk ? 'Adding...' : 'Add to Itinerary'}
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-travel-muted">Pedestrian connection routing unavailable.</p>
                  )}
                </div>
              )}

              {/* Train / Rail provider status (Honest Reporting) */}
              {discoveryTab === 'train' && (
                <div className="text-xs p-4 rounded-xl bg-travel-subtle border border-travel space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-travel-primary">Live Train Schedules Status</p>
                      <p className="text-travel-muted mt-1">{discoveryResults.train?.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCustomLegModal('train')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-travel-primary font-bold text-xs transition"
                  >
                    + Add Custom / Booked Train Leg
                  </button>
                </div>
              )}

              {/* Bus provider status (Honest Reporting) */}
              {discoveryTab === 'bus' && (
                <div className="text-xs p-4 rounded-xl bg-travel-subtle border border-travel space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-travel-primary">Live Bus Schedules Status</p>
                      <p className="text-travel-muted mt-1">{discoveryResults.bus?.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCustomLegModal('bus')}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-travel-primary font-bold text-xs transition"
                  >
                    + Add Custom / Booked Bus Leg
                  </button>
                </div>
              )}

              {/* Flight provider status (Honest Reporting) */}
              {discoveryTab === 'flight' && (
                <div className="text-xs p-4 rounded-xl bg-travel-subtle border border-travel space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-travel-primary">Live Flight Search Status</p>
                      <p className="text-travel-muted mt-1">{discoveryResults.flight?.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCustomLegModal('flight')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                  >
                    + Add Custom / Booked Flight Leg
                  </button>
                </div>
              )}

              {/* Transit provider status */}
              {discoveryTab === 'transit' && (
                <div className="text-xs p-4 rounded-xl bg-travel-subtle border border-travel space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-travel-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-travel-primary">City Transit Status</p>
                      <p className="text-travel-muted mt-1">{discoveryResults.transit?.message}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCustomLegModal('transit')}
                    className="px-4 py-2 rounded-xl btn-travel-primary text-xs transition"
                  >
                    + Add Custom Transit Leg
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Chronological Itinerary Legs List */}
          {segments.length === 0 ? (
            <div className="bg-travel-card rounded-3xl border border-travel p-12 text-center space-y-4">
              <Route className="w-12 h-12 text-travel-muted mx-auto" />
              <div>
                <h4 className="text-base font-bold text-travel-primary">No Transport Legs Added Yet</h4>
                <p className="text-xs text-travel-muted mt-1 max-w-md mx-auto">
                  Build your travel itinerary by adding train routes, bus connections, driving paths, or flights between stations and waypoints.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDiscoverTransport}
                  className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-accent font-bold text-xs transition border border-travel"
                >
                  Discover Live Options
                </button>
                <button
                  type="button"
                  onClick={() => openCustomLegModal('train')}
                  className="px-5 py-2.5 rounded-xl btn-travel-primary text-xs transition"
                >
                  + Add First Travel Leg
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((seg, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === segments.length - 1;

                return (
                  <div
                    key={seg.id || seg._id || idx}
                    className="bg-travel-card rounded-2xl border border-travel hover:border-travel p-5 transition space-y-3"
                  >
                    {/* Top Row: Leg Order, Mode, Operator, Actions */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-travel-accent-soft text-travel-accent text-xs font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="p-1.5 rounded-md bg-travel-subtle text-travel-accent">
                          {getModeIcon(seg.type || seg.transportMode)}
                        </span>
                        <span className="text-xs font-bold text-travel-primary uppercase tracking-wider">
                          {seg.transportMode || seg.type}
                        </span>
                        {seg.operator && (
                          <span className="text-[11px] text-travel-secondary font-medium">
                            • {seg.operator} {seg.serviceNumber ? `(${seg.serviceNumber})` : ''}
                          </span>
                        )}
                        {seg.source && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-travel-subtle text-travel-muted font-mono border border-travel">
                            {seg.source}
                          </span>
                        )}
                      </div>

                      {/* Controls: Reorder, Edit, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => reorderSegmentInJourney(activeJourney.id || activeJourney._id, seg.id || seg._id, 'up')}
                          className="p-1.5 rounded-lg text-travel-muted hover:text-travel-primary disabled:opacity-30 transition"
                          title="Move earlier"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => reorderSegmentInJourney(activeJourney.id || activeJourney._id, seg.id || seg._id, 'down')}
                          className="p-1.5 rounded-lg text-travel-muted hover:text-travel-primary disabled:opacity-30 transition"
                          title="Move later"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditLeg(seg)}
                          className="p-1.5 rounded-lg text-travel-muted hover:text-travel-accent transition"
                          title="Edit leg"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSegmentFromJourney(activeJourney.id || activeJourney._id, seg.id || seg._id)}
                          className="p-1.5 rounded-lg text-travel-muted hover:text-rose-400 transition"
                          title="Remove leg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Route Details: Departure ➔ Arrival */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Departure */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-travel-muted uppercase font-bold tracking-wider">Departure</span>
                        <p className="text-sm font-bold text-travel-primary">{seg.origin || seg.from}</p>
                        {seg.departureStation && (
                          <p className="text-xs text-travel-muted">{seg.departureStation}</p>
                        )}
                        {(seg.departureDate || seg.startTime) && (
                          <p className="text-xs text-travel-accent font-mono mt-0.5">
                            {seg.departureDate} {seg.startTime}
                          </p>
                        )}
                      </div>

                      {/* Arrival */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-travel-muted uppercase font-bold tracking-wider">Arrival</span>
                        <p className="text-sm font-bold text-travel-primary">{seg.destination || seg.to}</p>
                        {seg.arrivalStation && (
                          <p className="text-xs text-travel-muted">{seg.arrivalStation}</p>
                        )}
                        {(seg.arrivalDate || seg.endTime) && (
                          <p className="text-xs text-travel-accent font-mono mt-0.5">
                            {seg.arrivalDate} {seg.endTime}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Row: Distance, Duration, Price, Booking */}
                    <div className="pt-2 border-t border-travel/80 flex items-center justify-between text-xs text-travel-muted font-mono flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {seg.distanceKm > 0 && <span>{formatDistance(seg.distanceKm, settings?.distanceUnit)}</span>}
                        {seg.duration && <span>• {seg.duration}</span>}
                        {seg.transfers > 0 && <span>• {seg.transfers} transfer{seg.transfers === 1 ? '' : 's'}</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        {seg.price != null && (
                          <span className="text-sm font-bold text-emerald-400">
                            {formatCurrency(seg.price, seg.currency || tripCurrency)}
                          </span>
                        )}
                        {seg.bookingUrl && (
                          <a
                            href={seg.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-travel-accent-soft text-travel-accent hover:bg-travel-accent-soft font-sans font-bold text-[11px] flex items-center gap-1"
                          >
                            <span>Book</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STAYS (Accommodations & Lodging) */}
      {activeTab === 'stays' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-travel-card p-4 rounded-2xl border border-travel">
            <div>
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <Hotel className="w-5 h-5 text-violet-400" />
                <span>Accommodations & Lodging</span>
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Manage hotel reservations, hostels, apartments, and guest stays.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearchStays}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-violet-300 border border-travel text-xs font-bold transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Real Stays Nearby</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStayForm({
                    name: '',
                    propertyType: 'hotel',
                    address: '',
                    checkInDate: activeJourney.startDate || '',
                    checkInTime: '14:00',
                    checkOutDate: activeJourney.endDate || '',
                    checkOutTime: '11:00',
                    nights: '1',
                    totalPrice: '',
                    currency: tripCurrency,
                    bookingStatus: 'planned',
                    bookingUrl: '',
                    confirmationNumber: '',
                    notes: '',
                  });
                  setIsAddStayOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-travel-primary font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Stay Manually</span>
              </button>
            </div>
          </div>

          {/* Stays Search Results Dropdown/Drawer */}
          {staysSearchResults.length > 0 && (
            <div className="bg-travel-subtle rounded-2xl p-5 border border-violet-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-travel pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                    Real Properties Found via OpenStreetMap Nominatim
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setStaysSearchResults([])}
                  className="text-travel-muted hover:text-travel-primary p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {staysSearchResults.map((prop, idx) => (
                  <div
                    key={prop.id || idx}
                    className="p-3.5 rounded-xl bg-travel-subtle border border-travel flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800">
                        {prop.propertyType}
                      </span>
                      <h5 className="text-sm font-bold text-travel-primary mt-1 line-clamp-1">{prop.name}</h5>
                      <p className="text-xs text-travel-muted line-clamp-2 mt-0.5">{prop.address}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addStayToJourney(activeJourney.id || activeJourney._id, {
                          name: prop.name,
                          propertyType: prop.propertyType,
                          address: prop.address,
                          coords: prop.coords,
                          checkInDate: activeJourney.startDate || '',
                          checkOutDate: activeJourney.endDate || '',
                          source: 'OpenStreetMap Verified',
                        });
                        setStaysSearchResults((prev) => prev.filter((p) => p.id !== prop.id));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-travel-primary font-bold text-xs transition self-start"
                    >
                      + Save to Stays
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stays List */}
          {stays.length === 0 ? (
            <div className="bg-travel-card rounded-3xl border border-travel p-12 text-center space-y-4">
              <Hotel className="w-12 h-12 text-travel-muted mx-auto" />
              <div>
                <h4 className="text-base font-bold text-travel-primary">No Accommodation Added</h4>
                <p className="text-xs text-travel-muted mt-1 max-w-md mx-auto">
                  Keep your hotel reservations, hostel check-ins, or rental stays organized in one place with dates and confirmation numbers.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSearchStays}
                  className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-violet-300 font-bold text-xs transition border border-travel"
                >
                  Search Stays Nearby
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddStayOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-travel-primary font-bold text-xs transition"
                >
                  + Add Stay Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stays.map((st, idx) => (
                <div
                  key={st.id || st._id || idx}
                  className="bg-travel-card rounded-2xl border border-travel hover:border-travel p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
                        {st.propertyType || 'Hotel'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-travel-subtle text-travel-muted font-mono border border-travel">
                        {st.source || 'User Added'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteStayFromJourney(activeJourney.id || activeJourney._id, st.id || st._id)}
                      className="p-1.5 rounded-lg text-travel-muted hover:text-rose-400 transition"
                      title="Remove stay"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-travel-primary">{st.name}</h4>
                    {st.address && <p className="text-xs text-travel-muted mt-0.5">{st.address}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-travel/80">
                    <div>
                      <span className="text-[10px] text-travel-muted block uppercase font-mono">Check-in</span>
                      <span className="text-travel-primary font-mono">{st.checkInDate || 'Not set'} ({st.checkInTime || '14:00'})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-travel-muted block uppercase font-mono">Check-out</span>
                      <span className="text-travel-primary font-mono">{st.checkOutDate || 'Not set'} ({st.checkOutTime || '11:00'})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-travel/80 text-xs">
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      {st.totalPrice ? formatCurrency(st.totalPrice, st.currency || tripCurrency) : 'Price not recorded'}
                    </span>
                    {st.confirmationNumber && (
                      <span className="text-travel-muted font-mono text-[11px]">
                        Ref: {st.confirmationNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLACES & ACTIVITIES */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-travel-card p-4 rounded-2xl border border-travel">
            <div>
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Places, Attractions & Activities</span>
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Save monuments, museums, dining spots, and must-visit landmarks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearchPlaces}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-amber-300 border border-travel text-xs font-bold transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Attractions Nearby</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaceForm({
                    title: '',
                    category: 'attraction',
                    address: '',
                    day: '1',
                    visitTime: '',
                    notes: '',
                  });
                  setIsAddPlaceOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Place</span>
              </button>
            </div>
          </div>

          {/* Place Search Results */}
          {placesSearchResults.length > 0 && (
            <div className="bg-travel-subtle rounded-2xl p-5 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-travel pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Real Landmarks Found via OpenStreetMap Nominatim
                </h4>
                <button
                  type="button"
                  onClick={() => setPlacesSearchResults([])}
                  className="text-travel-muted hover:text-travel-primary p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {placesSearchResults.map((loc, idx) => (
                  <div
                    key={loc.id || idx}
                    className="p-3 rounded-xl bg-travel-subtle border border-travel flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-travel-primary truncate">{loc.name}</p>
                      <p className="text-[11px] text-travel-muted truncate">{loc.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addPlaceToJourney(activeJourney.id || activeJourney._id, {
                          title: loc.name,
                          category: 'attraction',
                          address: loc.subtitle,
                          coords: loc.coords,
                          source: 'OpenStreetMap Nominatim',
                        });
                        setPlacesSearchResults((prev) => prev.filter((p) => p.id !== loc.id));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Places List */}
          {places.length === 0 ? (
            <div className="bg-travel-card rounded-3xl border border-travel p-12 text-center space-y-4">
              <MapPin className="w-12 h-12 text-travel-muted mx-auto" />
              <div>
                <h4 className="text-base font-bold text-travel-primary">No Places Added Yet</h4>
                <p className="text-xs text-travel-muted mt-1 max-w-md mx-auto">
                  Add places you plan to visit, restaurants you want to try, or drop pins directly to plot them on the interactive map.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPlaceOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Place</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {places.map((pl, idx) => (
                <div
                  key={pl.id || pl._id || idx}
                  className={`bg-travel-card rounded-2xl border p-4 transition space-y-3 flex flex-col justify-between ${
                    pl.visited ? 'border-emerald-600/40 bg-emerald-950/10' : 'border-travel hover:border-travel'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-travel-subtle text-amber-300 border border-travel">
                        {pl.category || 'Attraction'}
                      </span>

                      <button
                        type="button"
                        onClick={() => deletePlaceFromJourney(activeJourney.id || activeJourney._id, pl.id || pl._id)}
                        className="p-1 rounded-md text-travel-muted hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className={`text-sm font-bold text-travel-primary ${pl.visited ? 'line-through text-travel-muted' : ''}`}>
                      {pl.title}
                    </h4>
                    {pl.address && <p className="text-xs text-travel-muted mt-0.5 line-clamp-2">{pl.address}</p>}
                    {pl.notes && <p className="text-xs text-travel-muted mt-1 italic">{pl.notes}</p>}
                  </div>

                  <div className="pt-2 border-t border-travel/80 flex items-center justify-between text-xs">
                    <span className="text-travel-muted font-mono text-[11px]">
                      {pl.visitTime ? `🕒 ${pl.visitTime}` : `Day ${pl.day || 1}`}
                    </span>

                    <button
                      type="button"
                      onClick={() => togglePlaceVisited(activeJourney.id || activeJourney._id, pl.id || pl._id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                        pl.visited
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-travel-subtle text-travel-muted hover:text-travel-primary'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{pl.visited ? 'Visited' : 'Mark Visited'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EXPENSES & BUDGET */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-travel-card p-4 rounded-2xl border border-travel">
            <div>
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Expenses & Budget Tracking</span>
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Record actual travel expenses, manage budgets, and link receipts.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openEditTripModal}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary border border-travel text-xs font-bold transition flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Set Budget</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpenseForm({
                    title: '',
                    amount: '',
                    currency: tripCurrency,
                    category: 'Food',
                    date: new Date().toISOString().split('T')[0],
                    linkedType: 'none',
                    linkedId: '',
                    notes: '',
                  });
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Budget Progress Bar */}
          {activeJourney.budget > 0 && (
            <div className="bg-travel-card rounded-2xl p-5 border border-travel space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-travel-muted">
                  Recorded: <strong className="text-travel-primary font-mono">{formatCurrency(totalRecordedExpenses, tripCurrency)}</strong> of{' '}
                  <strong className="text-travel-primary font-mono">{formatCurrency(activeJourney.budget, tripCurrency)}</strong>
                </span>
                <span className="font-mono text-travel-accent font-bold">
                  {Math.round((totalRecordedExpenses / activeJourney.budget) * 100)}% Used
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-travel-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalRecordedExpenses > activeJourney.budget ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((totalRecordedExpenses / activeJourney.budget) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="bg-travel-card rounded-3xl border border-travel p-12 text-center space-y-4">
              <CreditCard className="w-12 h-12 text-travel-muted mx-auto" />
              <div>
                <h4 className="text-base font-bold text-travel-primary">No Expenses Recorded</h4>
                <p className="text-xs text-travel-muted mt-1 max-w-md mx-auto">
                  Track actual money spent on tickets, lodging, meals, transport, and souvenirs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Expense</span>
              </button>
            </div>
          ) : (
            <div className="bg-travel-card rounded-2xl border border-travel overflow-hidden">
              <div className="divide-y divide-travel/80">
                {expenses.map((exp, idx) => (
                  <div key={exp.id || exp._id || idx} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-travel-primary text-sm">{exp.title}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded bg-travel-subtle text-travel-secondary border border-travel">
                          {exp.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-travel-muted mt-0.5 flex items-center gap-2 font-mono">
                        <span>{exp.date}</span>
                        {exp.notes && <span>• {exp.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-travel-primary font-mono">
                        {formatCurrency(exp.amount, exp.currency || tripCurrency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteExpenseFromJourney(activeJourney.id || activeJourney._id, exp.id || exp._id)}
                        className="p-1.5 rounded-lg text-travel-muted hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: INTERACTIVE MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-travel-card rounded-2xl p-4 border border-travel flex items-center justify-between text-xs text-travel-muted">
            <span>
              Interactive map displaying {segments.length} travel legs, {stays.length} stays, and {places.length} places.
            </span>
            <span className="font-mono text-travel-accent">
              Center: {activeJourney.destination}
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-travel shadow-2xl">
            <InteractiveMap
              waypoints={activeJourney.waypoints || []}
              routeGeometry={activeJourney.routeGeometry || segments?.[0]?.geometry || null}
              stays={stays}
              places={places}
              center={activeJourney.center || null}
              zoom={activeJourney.zoom || 12}
              height="580px"
              destinationTitle={`${activeJourney.title} — ${activeJourney.destination}`}
            />
          </div>
        </div>
      )}

      {/* PRINTABLE ITINERARY EXPORT MODAL */}
      {isPrintModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsPrintModalOpen(false)}
          title="Print & Export Itinerary"
          subtitle="Clean summary of your journey connections, stays, and budget."
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs" id="printable-itinerary">
            <div className="border-b border-travel pb-4">
              <h2 className="text-xl font-bold text-travel-primary">{activeJourney.title}</h2>
              <p className="text-travel-muted mt-1">
                {activeJourney.origin} ➔ {activeJourney.destination}
              </p>
              <p className="text-xs text-travel-accent font-mono mt-0.5">
                {activeJourney.startDate ? `${activeJourney.startDate} ${activeJourney.endDate ? `to ${activeJourney.endDate}` : ''}` : 'Undated Trip'}
              </p>
            </div>

            {/* Travel Legs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-travel-accent">Confirmed Transport Legs</h4>
              {segments.length === 0 ? (
                <p className="text-travel-muted italic">No transport legs recorded.</p>
              ) : (
                <div className="space-y-2">
                  {segments.map((seg, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-travel-subtle border border-travel flex justify-between">
                      <div>
                        <p className="font-bold text-travel-primary">
                          #{idx + 1} {seg.transportMode}: {seg.origin} ➔ {seg.destination}
                        </p>
                        {seg.operator && <p className="text-travel-muted">{seg.operator} {seg.serviceNumber}</p>}
                        <p className="text-travel-muted font-mono">{seg.departureDate} {seg.startTime} - {seg.endTime}</p>
                      </div>
                      {seg.price != null && (
                        <span className="font-mono font-bold text-travel-primary">
                          {formatCurrency(seg.price, seg.currency || tripCurrency)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stays */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">Accommodations</h4>
              {stays.length === 0 ? (
                <p className="text-travel-muted italic">No stays recorded.</p>
              ) : (
                <div className="space-y-2">
                  {stays.map((st, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-travel-subtle border border-travel flex justify-between">
                      <div>
                        <p className="font-bold text-travel-primary">{st.name} ({st.propertyType})</p>
                        <p className="text-travel-muted">{st.address}</p>
                        <p className="text-travel-muted font-mono">In: {st.checkInDate} • Out: {st.checkOutDate}</p>
                      </div>
                      {st.totalPrice > 0 && (
                        <span className="font-mono font-bold text-travel-primary">
                          {formatCurrency(st.totalPrice, st.currency || tripCurrency)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Print Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl btn-travel-primary flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Itinerary / Save PDF</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT TRIP MODAL */}
      {isEditTripOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsEditTripOpen(false)}
          title="Edit Trip Properties"
          subtitle="Update destination, dates, currency, and travel budget."
        >
          <form onSubmit={handleEditTripSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Trip Title</label>
              <input
                type="text"
                value={tripForm.title}
                onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Origin *</label>
                <input
                  type="text"
                  value={tripForm.origin}
                  onChange={(e) => setTripForm({ ...tripForm, origin: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Destination *</label>
                <input
                  type="text"
                  value={tripForm.destination}
                  onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Start Date</label>
                <input
                  type="date"
                  value={tripForm.startDate}
                  onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">End Date</label>
                <input
                  type="date"
                  value={tripForm.endDate}
                  onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Trip Currency</label>
                <select
                  value={tripForm.currency}
                  onChange={(e) => setTripForm({ ...tripForm, currency: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Trip Budget</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 1500"
                  value={tripForm.budget}
                  onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Trip Notes & Goals</label>
              <textarea
                rows={3}
                value={tripForm.notes}
                onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsEditTripOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-travel-primary"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD / EDIT TRANSPORT LEG MODAL */}
      {isAddLegOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddLegOpen(false)}
          title={editingLeg ? 'Edit Transport Leg' : 'Add Transport Leg to Itinerary'}
          subtitle="Record real schedules, operators, stations, and fare costs."
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleLegSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Transport Mode</label>
                <select
                  value={legForm.type}
                  onChange={(e) => setLegForm({ ...legForm, type: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                >
                  <option value="train">IRCTC / Express Train</option>
                  <option value="bus">State Bus / Intercity Coach</option>
                  <option value="metro">City Metro / Rapid Transit</option>
                  <option value="auto">Auto Rickshaw</option>
                  <option value="cab">Cab / Rideshare (Ola/Uber)</option>
                  <option value="flight">Domestic / International Flight</option>
                  <option value="walking">Walking Connection</option>
                  <option value="car">Personal Car / Driving</option>
                  <option value="ferry">Ferry / Marine</option>
                </select>
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Operator / Airline</label>
                <input
                  type="text"
                  placeholder="e.g. Deutsche Bahn, FlixBus, Delta..."
                  value={legForm.operator}
                  onChange={(e) => setLegForm({ ...legForm, operator: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Origin City/Stop *</label>
                <input
                  type="text"
                  value={legForm.origin}
                  onChange={(e) => setLegForm({ ...legForm, origin: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Destination City/Stop *</label>
                <input
                  type="text"
                  value={legForm.destination}
                  onChange={(e) => setLegForm({ ...legForm, destination: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Departure Time</label>
                <input
                  type="time"
                  value={legForm.departureTime}
                  onChange={(e) => setLegForm({ ...legForm, departureTime: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Arrival Time</label>
                <input
                  type="time"
                  value={legForm.arrivalTime}
                  onChange={(e) => setLegForm({ ...legForm, arrivalTime: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Ticket Price</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 45.00"
                  value={legForm.price}
                  onChange={(e) => setLegForm({ ...legForm, price: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Booking Status</label>
                <select
                  value={legForm.bookingStatus}
                  onChange={(e) => setLegForm({ ...legForm, bookingStatus: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                >
                  <option value="planned">Planned (Not Booked Yet)</option>
                  <option value="booked">Booked & Confirmed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Booking URL / Confirmation Link</label>
              <input
                type="url"
                placeholder="https://..."
                value={legForm.bookingUrl}
                onChange={(e) => setLegForm({ ...legForm, bookingUrl: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsAddLegOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-travel-primary"
              >
                {editingLeg ? 'Save Changes' : 'Add Leg'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD STAY MODAL */}
      {isAddStayOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddStayOpen(false)}
          title="Add Accommodation / Stay"
          subtitle="Record hotel, hostel, or homestay booking details."
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleStaySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Property Name *</label>
              <input
                type="text"
                placeholder="e.g. Kyoto Central Hotel, Mountain Guest House..."
                value={stayForm.name}
                onChange={(e) => setStayForm({ ...stayForm, name: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Type</label>
                <select
                  value={stayForm.propertyType}
                  onChange={(e) => setStayForm({ ...stayForm, propertyType: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                >
                  <option value="hotel">Hotel</option>
                  <option value="hostel">Hostel</option>
                  <option value="guesthouse">Guest House</option>
                  <option value="homestay">Homestay</option>
                  <option value="apartment">Apartment</option>
                  <option value="resort">Resort</option>
                </select>
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Total Cost</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 180.00"
                  value={stayForm.totalPrice}
                  onChange={(e) => setStayForm({ ...stayForm, totalPrice: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Address</label>
              <input
                type="text"
                placeholder="Street address or neighborhood..."
                value={stayForm.address}
                onChange={(e) => setStayForm({ ...stayForm, address: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Check-in Date</label>
                <input
                  type="date"
                  value={stayForm.checkInDate}
                  onChange={(e) => setStayForm({ ...stayForm, checkInDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Check-out Date</label>
                <input
                  type="date"
                  value={stayForm.checkOutDate}
                  onChange={(e) => setStayForm({ ...stayForm, checkOutDate: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsAddStayOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-travel-primary font-bold"
              >
                Save Stay
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD PLACE MODAL */}
      {isAddPlaceOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddPlaceOpen(false)}
          title="Add Place or Activity"
          subtitle="Add attraction, dining spot, or landmark to visit."
        >
          <form onSubmit={handlePlaceSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Place Name *</label>
              <input
                type="text"
                placeholder="e.g. Fushimi Inari Shrine, Gion District..."
                value={placeForm.title}
                onChange={(e) => setPlaceForm({ ...placeForm, title: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Category</label>
                <select
                  value={placeForm.category}
                  onChange={(e) => setPlaceForm({ ...placeForm, category: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                >
                  <option value="attraction">Attraction / Museum</option>
                  <option value="restaurant">Dining / Restaurant</option>
                  <option value="landmark">Landmark / Monument</option>
                  <option value="shopping">Shopping Area</option>
                  <option value="viewpoint">Viewpoint / Scenic</option>
                  <option value="activity">Activity / Tour</option>
                </select>
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Trip Day</label>
                <input
                  type="number"
                  min="1"
                  value={placeForm.day}
                  onChange={(e) => setPlaceForm({ ...placeForm, day: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Notes</label>
              <textarea
                rows={2}
                value={placeForm.notes}
                onChange={(e) => setPlaceForm({ ...placeForm, notes: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsAddPlaceOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Save Place
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
          title="Record Trip Expense"
          subtitle="Keep your budget on track with recorded costs."
        >
          <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-travel-secondary font-semibold mb-1">Expense Title *</label>
              <input
                type="text"
                placeholder="e.g. Train Ticket, Dinner at Gion, Museum Entry..."
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Currency</label>
                <select
                  value={expenseForm.currency}
                  onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2.5 text-travel-primary"
                >
                  <option value="Transport">Transport</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Food">Food / Dining</option>
                  <option value="Activities">Activities / Sightseeing</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-travel-secondary font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full bg-travel-subtle border border-travel rounded-xl p-2 text-travel-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-travel">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-travel-subtle text-travel-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Record Expense
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
