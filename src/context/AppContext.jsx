import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_USER,
  INITIAL_SETTINGS,
  INITIAL_JOURNEYS,
  INITIAL_SAVED_PLACES,
  INITIAL_SUMMARY_STATS,
  INITIAL_RECENT_JOURNEYS,
  INITIAL_TRUSTED_CONTACTS,
  INITIAL_GEOFENCE_LOGS,
} from '../data/mockData';

const AppContext = createContext(null);

const STORAGE_KEYS = {
  JOURNEYS: 'tripmate_demo_journeys',
  SAVED_PLACES: 'tripmate_demo_saved_places',
  SETTINGS: 'tripmate_demo_settings',
  CHECK_INS: 'tripmate_demo_checkins',
  SOS_LOGS: 'tripmate_demo_sos_logs',
  LIVE_STATE: 'tripmate_demo_live_state',
  RECENT_JOURNEYS: 'tripmate_demo_recent_journeys',
  SUMMARY_STATS: 'tripmate_demo_summary_stats',
  TRUSTED_CONTACTS: 'tripmate_demo_trusted_contacts',
  EMERGENCY_SESSION: 'tripmate_demo_emergency_session',
  GEOFENCE_LOGS: 'tripmate_demo_geofence_logs',
};


export function AppProvider({ children }) {
  // Navigation
  const [activePage, setActivePage] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'journeys', 'trip-details', 'insights', 'safety', 'saved-places', 'settings'].includes(hash)) {
        return hash;
      }
    } catch {}
    return 'overview';
  });
  const [activeJourneyId, setActiveJourneyId] = useState('journey-campus-commute');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '');
        if (['overview', 'journeys', 'trip-details', 'insights', 'safety', 'saved-places', 'settings'].includes(hash)) {
          setActivePage(hash);
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    try {
      if (window.location.hash !== `#${activePage}`) {
        window.location.hash = activePage;
      }
    } catch {}
  }, [activePage]);

  // User Profile
  const [user, setUser] = useState(INITIAL_USER);

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!saved) return INITIAL_SETTINGS;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? { ...INITIAL_SETTINGS, ...parsed } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Journeys
  const [journeys, setJourneys] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNEYS);
      if (!saved) return INITIAL_JOURNEYS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_JOURNEYS;
      // Ensure campus commute exists
      const hasCampus = parsed.some((j) => j && j.id === 'journey-campus-commute');
      if (!hasCampus) {
        const campus = INITIAL_JOURNEYS.find((j) => j.id === 'journey-campus-commute');
        if (campus) return [campus, ...parsed];
      }
      return parsed;
    } catch {
      return INITIAL_JOURNEYS;
    }
  });

  // Saved Places
  const [savedPlaces, setSavedPlaces] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
      if (!saved) return INITIAL_SAVED_PLACES;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SAVED_PLACES;
    } catch {
      return INITIAL_SAVED_PLACES;
    }
  });

  // Check-ins & SOS Logs
  const [checkInLogs, setCheckInLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHECK_INS);
      if (!saved) return [
        {
          id: 'chk-1',
          timestamp: 'Today, 10:15 AM',
          location: 'Gion District, Kyoto',
          status: 'Safe & Active',
          note: 'Checked in at Shirakawa Canal bridge. Battery 88%.',
          battery: '88%',
        },
        {
          id: 'chk-2',
          timestamp: 'Yesterday, 07:30 PM',
          location: 'Kiyomizu-dera, Kyoto',
          status: 'Safe & Active',
          note: 'Evening temple illumination finished. Heading to dinner.',
          battery: '74%',
        },
      ];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [sosLogs, setSosLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOS_LOGS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Overview Summary Statistics
  const [summaryStats, setSummaryStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUMMARY_STATS);
      if (!saved) return INITIAL_SUMMARY_STATS;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? { ...INITIAL_SUMMARY_STATS, ...parsed } : INITIAL_SUMMARY_STATS;
    } catch {
      return INITIAL_SUMMARY_STATS;
    }
  });

  // Recent Journeys Log
  const [recentJourneys, setRecentJourneys] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENT_JOURNEYS);
      if (!saved) return INITIAL_RECENT_JOURNEYS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RECENT_JOURNEYS;
    } catch {
      return INITIAL_RECENT_JOURNEYS;
    }
  });

  // Active / Live Journey State
  const [journeyLiveState, setJourneyLiveState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LIVE_STATE);
      if (!saved) return {
        status: 'in_progress', // 'in_progress' | 'idle' | 'completed'
        startTime: '09:15 AM',
        startedDate: '2026-10-28',
        activeSegmentIndex: 1, // Segment 2 is active
        elapsedMinutes: 145,
        journeyId: 'kyoto-2026',
      };
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : {
        status: 'in_progress',
        startTime: '09:15 AM',
        startedDate: '2026-10-28',
        activeSegmentIndex: 1,
        elapsedMinutes: 145,
        journeyId: 'kyoto-2026',
      };
    } catch {
      return {
        status: 'in_progress',
        startTime: '09:15 AM',
        startedDate: '2026-10-28',
        activeSegmentIndex: 1,
        elapsedMinutes: 145,
        journeyId: 'kyoto-2026',
      };
    }
  });

  // Trusted Contacts Management
  const [trustedContacts, setTrustedContacts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACTS);
      if (!saved) return INITIAL_TRUSTED_CONTACTS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRUSTED_CONTACTS;
    } catch {
      return INITIAL_TRUSTED_CONTACTS;
    }
  });

  // Simulated Emergency Session State
  const DEFAULT_EMERGENCY_SESSION = {
    isActive: false,
    startedAt: null,
    startedTimestamp: null,
    elapsedSeconds: 0,
    sampleLocation: {
      name: "Gion District Safe Transit Hub, Kyoto",
      address: "572 Komatsucho, Higashiyama Ward, Kyoto 605-0931",
      coords: [35.0037, 135.7770],
      accuracy: "±8m (Simulated Client GPS)",
      region: "Kyoto, Japan (Demo Coordinates)",
    },
    mockAlertDeliveries: [
      {
        contactId: "tc-1",
        name: "Morgan Sterling",
        phone: "+1 (415) 555-0192",
        channel: "Simulated SMS Relay",
        status: "Delivered (Simulation)",
        timestamp: "Just now",
        payloadPreview: "TRIPMATE SIMULATED SOS: Distress broadcast initiated at 35.0037, 135.7770 (Kyoto). ICE health vault attached.",
      },
      {
        contactId: "tc-2",
        name: "David Sterling",
        phone: "+1 (415) 555-0144",
        channel: "Simulated SMS Relay",
        status: "Delivered (Simulation)",
        timestamp: "Just now",
        payloadPreview: "TRIPMATE SIMULATED SOS: Distress broadcast initiated at 35.0037, 135.7770 (Kyoto). ICE health vault attached.",
      },
      {
        contactId: "emb-1",
        name: "US Consulate General Osaka-Kobe Duty Desk",
        phone: "+81 3-3224-5000",
        channel: "Consular Emergency Wire",
        status: "Relay Queued (Simulation)",
        timestamp: "Just now",
        payloadPreview: "DIPLOMATIC CITIZEN ALERT: Simulated citizen distress packet logged for Alex Sterling.",
      },
    ],
    medicalIceSummary: "Blood: O+ | Allergies: Penicillin | Insurance: Allianz #AG-9428-TRAVEL-PRO",
  };

  const [emergencySession, setEmergencySession] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY_SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.sampleLocation) {
          if (parsed.isActive && parsed.startedTimestamp) {
            const elapsed = Math.max(0, Math.floor((Date.now() - parsed.startedTimestamp) / 1000));
            return { ...parsed, elapsedSeconds: elapsed };
          }
          return parsed;
        }
      }
      return DEFAULT_EMERGENCY_SESSION;
    } catch {
      return DEFAULT_EMERGENCY_SESSION;
    }
  });

  // Geofence Event History Logs
  const [geofenceEventLogs, setGeofenceEventLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GEOFENCE_LOGS);
      if (!saved) return INITIAL_GEOFENCE_LOGS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_GEOFENCE_LOGS;
    } catch {
      return INITIAL_GEOFENCE_LOGS;
    }
  });

  // Accidental Activation Confirmation Modal State
  const [isSosConfirmOpen, setIsSosConfirmOpen] = useState(false);

  // Emergency SOS Modal / Timer State
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null); // null or number (5 to 0)
  const [sosActive, setSosActive] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNEYS, JSON.stringify(journeys));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [journeys]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(savedPlaces));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [savedPlaces]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(checkInLogs));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [checkInLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SOS_LOGS, JSON.stringify(sosLogs));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [sosLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUMMARY_STATS, JSON.stringify(summaryStats));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [summaryStats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENT_JOURNEYS, JSON.stringify(recentJourneys));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [recentJourneys]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_STATE, JSON.stringify(journeyLiveState));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [journeyLiveState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(trustedContacts));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [trustedContacts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_SESSION, JSON.stringify(emergencySession));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [emergencySession]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GEOFENCE_LOGS, JSON.stringify(geofenceEventLogs));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [geofenceEventLogs]);

  // Live ticking timer for SIMULATED EMERGENCY SESSION
  useEffect(() => {
    let interval = null;
    if (emergencySession.isActive && emergencySession.startedTimestamp) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - emergencySession.startedTimestamp) / 1000));
        setEmergencySession((prev) => ({
          ...prev,
          elapsedSeconds: elapsed,
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [emergencySession.isActive, emergencySession.startedTimestamp]);

  // Keyboard shortcut for Cmd+K search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toast handler
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Active journey helper
  const activeJourney = journeys.find((j) => j.id === activeJourneyId) || journeys[0];

  const navigateToJourney = (journeyId) => {
    setActiveJourneyId(journeyId);
    setActivePage('trip-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Itinerary & Packing updates
  const togglePackingItem = (journeyId, itemId) => {
    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        return {
          ...journey,
          packingList: journey.packingList.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      })
    );
  };

  const addPackingItem = (journeyId, itemData) => {
    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const newItem = {
          id: 'pk-' + Date.now(),
          item: itemData.item,
          category: itemData.category || 'Gear',
          checked: false,
          mandatory: Boolean(itemData.mandatory),
        };
        return {
          ...journey,
          packingList: [...journey.packingList, newItem],
        };
      })
    );
    addToast('Packing Item Added', `${itemData.item} added to trip packing list.`, 'success');
  };

  const toggleItineraryItem = (journeyId, dayNumber, itemIndex) => {
    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const updatedDays = journey.itineraryDays.map((d) => {
          if (d.day !== dayNumber) return d;
          const updatedItems = [...d.items];
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            done: !updatedItems[itemIndex].done,
          };
          return { ...d, items: updatedItems };
        });
        return { ...journey, itineraryDays: updatedDays };
      })
    );
  };

  const addExpenseToJourney = (journeyId, expenseData) => {
    const newExpense = {
      id: 'exp-' + Date.now(),
      title: expenseData.title,
      amount: parseFloat(expenseData.amount) || 0,
      category: expenseData.category || 'Dining',
      date: expenseData.date || new Date().toISOString().split('T')[0],
    };

    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const updatedExpenses = [newExpense, ...journey.expenses];
        const updatedSpent = journey.spent + newExpense.amount;
        return {
          ...journey,
          expenses: updatedExpenses,
          spent: updatedSpent,
        };
      })
    );

    addToast('Expense Recorded', `$${newExpense.amount} added under ${newExpense.category}.`, 'success');
  };

  // Helper to recalculate journey distance, duration and CO2 totals
  const calculateJourneyTotals = (segments = []) => {
    const totalDistanceKm = parseFloat(
      segments.reduce((acc, s) => acc + (parseFloat(s.distanceKm) || 0), 0).toFixed(1)
    );
    const totalDurationMinutes = segments.reduce(
      (acc, s) => acc + (parseInt(s.durationMinutes, 10) || 0),
      0
    );
    const estimatedCo2Kg = parseFloat(
      segments.reduce((acc, s) => acc + (parseFloat(s.co2SavedKg) || 0), 0).toFixed(1)
    );
    return { totalDistanceKm, totalDurationMinutes, estimatedCo2Kg };
  };

  // Create new journey with structured trip chain support
  const createJourney = (journeyData) => {
    const newId = (journeyData.destination || 'journey').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const origin = journeyData.origin || 'City Departure Point';
    const destination = journeyData.destination || 'Destination Point';
    const travelDate = journeyData.travelDate || journeyData.startDate || new Date().toISOString().split('T')[0];
    const mode = journeyData.primaryTransportMode || 'Walking + Transit';
    const status = journeyData.status || 'Upcoming';

    // Build initial starter segment if user didn't provide custom segments
    const initialSegments = journeyData.initialSegments || [
      {
        id: 'seg-init-1',
        order: 1,
        type: (mode.toLowerCase().includes('bus') ? 'bus' : mode.toLowerCase().includes('train') ? 'train' : 'walking'),
        modeType: (mode.toLowerCase().includes('bus') ? 'bus' : mode.toLowerCase().includes('train') ? 'train' : 'walking'),
        mode: mode,
        transportMode: mode,
        title: `Primary Transit Leg: ${origin} to ${destination}`,
        from: origin,
        origin: origin,
        to: destination,
        destination: destination,
        distanceKm: parseFloat(journeyData.totalDistanceKm) || 4.5,
        distanceMi: parseFloat(((parseFloat(journeyData.totalDistanceKm) || 4.5) * 0.621371).toFixed(1)),
        durationMinutes: parseInt(journeyData.totalDurationMinutes, 10) || 30,
        duration: `${parseInt(journeyData.totalDurationMinutes, 10) || 30}m`,
        startTime: '09:00 AM',
        endTime: '09:30 AM',
        transitLine: journeyData.transitLine || null,
        co2SavedKg: 0.8,
        isStop: false,
        notes: journeyData.summary || 'Initial registered segment for this trip chain.',
        status: status === 'Active' || status === 'In Progress' ? 'In Progress' : 'Scheduled',
        telemetry: 'Demo Simulated Segment • Initial Leg',
      },
    ];

    const totals = calculateJourneyTotals(initialSegments);

    const newJourney = {
      id: newId,
      title: journeyData.title || `Expedition: ${origin} to ${destination}`,
      origin: origin,
      destination: destination,
      travelDate: travelDate,
      startDate: travelDate,
      endDate: journeyData.endDate || travelDate,
      currentDay: 1,
      totalDays: 1,
      status: status,
      countryCode: journeyData.countryCode || 'INT',
      primaryTransportMode: mode,
      transitTypes: [mode.toLowerCase()],
      totalDistanceKm: totals.totalDistanceKm,
      totalDurationMinutes: totals.totalDurationMinutes,
      estimatedCo2Kg: totals.estimatedCo2Kg,
      isDemoData: true,
      demoNotice: "Demo Trip Chain: Segments and timings are simulated demonstration records. No actual device GPS or hardware step sensor collection.",
      coverImage: journeyData.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      summary: journeyData.summary || `Structured trip chain from ${origin} to ${destination}.`,
      budget: parseFloat(journeyData.budget) || 120,
      spent: 0,
      center: journeyData.center || [35.0116, 135.7681],
      zoom: 13,
      currentLocation: {
        name: `${origin} (Simulated Demo)`,
        coords: journeyData.center || [35.0116, 135.7681],
        updatedAgo: 'Ready',
        safeZone: true,
      },
      localEmergencyNumbers: {
        police: '112 / 911',
        ambulance: '112 / 911',
      },
      hotelInfo: {
        name: journeyData.hotelName || 'Base Lodging pending',
        address: destination,
        phone: 'N/A',
      },
      waypoints: [
        { id: `wp-${Date.now()}-1`, title: origin, coords: [35.0116, 135.7681], completed: false, isOrigin: true },
        { id: `wp-${Date.now()}-2`, title: destination, coords: [35.0216, 135.7781], completed: false, isDestination: true },
      ],
      segments: initialSegments,
      travelSegments: initialSegments,
      itineraryDays: [],
      packingList: [],
      expenses: [],
    };

    setJourneys((prev) => [newJourney, ...prev]);
    setActiveJourneyId(newId);
    setActivePage('trip-details');
    addToast('Journey Created!', `"${newJourney.title}" added to your trip chains.`, 'success');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}
  };

  // Edit Journey metadata
  const editJourney = (journeyId, updatedData) => {
    setJourneys((prev) =>
      prev.map((j) => {
        if (j.id !== journeyId) return j;
        const updated = {
          ...j,
          ...updatedData,
          title: updatedData.title || j.title,
          origin: updatedData.origin !== undefined ? updatedData.origin : j.origin,
          destination: updatedData.destination || j.destination,
          travelDate: updatedData.travelDate || j.travelDate || updatedData.startDate || j.startDate,
          startDate: updatedData.travelDate || updatedData.startDate || j.startDate,
          status: updatedData.status || j.status,
          primaryTransportMode: updatedData.primaryTransportMode || j.primaryTransportMode,
          summary: updatedData.summary !== undefined ? updatedData.summary : j.summary,
        };
        return updated;
      })
    );
    addToast('Journey Updated', 'Your trip chain details were saved successfully.', 'success');
  };

  // Delete Journey
  const deleteJourney = (journeyId) => {
    const target = journeys.find((j) => j.id === journeyId);
    setJourneys((prev) => {
      const nextList = prev.filter((j) => j.id !== journeyId);
      if (activeJourneyId === journeyId) {
        setActiveJourneyId(nextList[0]?.id || '');
      }
      return nextList;
    });
    addToast('Journey Deleted', `"${target?.title || 'Journey'}" was removed from your library.`, 'info');
  };

  // Add Segment to Journey
  const addSegmentToJourney = (journeyId, segmentData) => {
    const dist = parseFloat(segmentData.distanceKm) || 0;
    const dur = parseInt(segmentData.durationMinutes, 10) || 0;
    const mode = segmentData.transportMode || segmentData.mode || 'Walking';
    const type = segmentData.type || segmentData.modeType || 'walking';
    const isStop = segmentData.isStop !== undefined ? segmentData.isStop : (type === 'cafe_stop' || type === 'activity');
    const co2Saved = segmentData.co2SavedKg !== undefined 
      ? parseFloat(segmentData.co2SavedKg) 
      : parseFloat((dist * (type === 'walking' || type === 'bicycle' ? 0.21 : 0.14)).toFixed(1));

    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const currentSegments = journey.segments || journey.travelSegments || [];
        const newOrder = currentSegments.length + 1;
        const newSeg = {
          id: 'seg-' + Date.now(),
          order: newOrder,
          type: type,
          modeType: type,
          mode: mode,
          transportMode: mode,
          title: segmentData.title || `${mode} Leg`,
          from: segmentData.origin || segmentData.from || 'Origin',
          origin: segmentData.origin || segmentData.from || 'Origin',
          to: segmentData.destination || segmentData.to || 'Destination',
          destination: segmentData.destination || segmentData.to || 'Destination',
          distanceKm: dist,
          distanceMi: parseFloat((dist * 0.621371).toFixed(1)),
          durationMinutes: dur,
          duration: dur > 0 ? `${dur}m` : '0m',
          startTime: segmentData.startTime || '10:00 AM',
          endTime: segmentData.endTime || (dur > 0 ? '10:30 AM' : '10:00 AM'),
          transitLine: segmentData.transitLine || null,
          co2SavedKg: co2Saved,
          isStop: isStop,
          notes: segmentData.notes || '',
          status: segmentData.status || 'Scheduled',
          telemetry: 'Demo Simulated Segment • Added by User',
        };

        const updatedSegments = [...currentSegments, newSeg];
        const totals = calculateJourneyTotals(updatedSegments);

        return {
          ...journey,
          segments: updatedSegments,
          travelSegments: updatedSegments,
          totalDistanceKm: totals.totalDistanceKm,
          totalDurationMinutes: totals.totalDurationMinutes,
          estimatedCo2Kg: totals.estimatedCo2Kg,
        };
      })
    );

    addToast('Segment Added', `Added leg: ${segmentData.origin} ➔ ${segmentData.destination}.`, 'success');
  };

  // Edit Segment in Journey
  const editSegmentInJourney = (journeyId, segmentId, updatedData) => {
    const dist = parseFloat(updatedData.distanceKm) || 0;
    const dur = parseInt(updatedData.durationMinutes, 10) || 0;
    const mode = updatedData.transportMode || updatedData.mode || 'Walking';
    const type = updatedData.type || updatedData.modeType || 'walking';
    const isStop = updatedData.isStop !== undefined ? updatedData.isStop : (type === 'cafe_stop' || type === 'activity');

    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const currentSegments = journey.segments || journey.travelSegments || [];
        const updatedSegments = currentSegments.map((s) => {
          if (s.id !== segmentId) return s;
          const co2Saved = updatedData.co2SavedKg !== undefined
            ? parseFloat(updatedData.co2SavedKg)
            : parseFloat((dist * (type === 'walking' || type === 'bicycle' ? 0.21 : 0.14)).toFixed(1));

          return {
            ...s,
            ...updatedData,
            type: type,
            modeType: type,
            mode: mode,
            transportMode: mode,
            title: updatedData.title || s.title,
            from: updatedData.origin || updatedData.from || s.from,
            origin: updatedData.origin || updatedData.from || s.origin,
            to: updatedData.destination || updatedData.to || s.to,
            destination: updatedData.destination || updatedData.to || s.destination,
            distanceKm: dist,
            distanceMi: parseFloat((dist * 0.621371).toFixed(1)),
            durationMinutes: dur,
            duration: dur > 0 ? `${dur}m` : '0m',
            startTime: updatedData.startTime || s.startTime,
            endTime: updatedData.endTime || s.endTime,
            transitLine: updatedData.transitLine !== undefined ? updatedData.transitLine : s.transitLine,
            notes: updatedData.notes !== undefined ? updatedData.notes : s.notes,
            status: updatedData.status || s.status,
            co2SavedKg: co2Saved,
            isStop: isStop,
          };
        });

        const totals = calculateJourneyTotals(updatedSegments);

        return {
          ...journey,
          segments: updatedSegments,
          travelSegments: updatedSegments,
          totalDistanceKm: totals.totalDistanceKm,
          totalDurationMinutes: totals.totalDurationMinutes,
          estimatedCo2Kg: totals.estimatedCo2Kg,
        };
      })
    );

    addToast('Segment Updated', 'Segment in trip chain successfully modified.', 'success');
  };

  // Delete Segment from Journey
  const deleteSegmentFromJourney = (journeyId, segmentId) => {
    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const currentSegments = journey.segments || journey.travelSegments || [];
        const filtered = currentSegments.filter((s) => s.id !== segmentId);
        const reindexed = filtered.map((s, idx) => ({ ...s, order: idx + 1 }));
        const totals = calculateJourneyTotals(reindexed);

        return {
          ...journey,
          segments: reindexed,
          travelSegments: reindexed,
          totalDistanceKm: totals.totalDistanceKm,
          totalDurationMinutes: totals.totalDurationMinutes,
          estimatedCo2Kg: totals.estimatedCo2Kg,
        };
      })
    );

    addToast('Segment Removed', 'Segment removed and trip chain re-ordered.', 'info');
  };

  // Reorder Segment in Journey
  const reorderSegmentInJourney = (journeyId, segmentId, direction) => {
    setJourneys((prev) =>
      prev.map((journey) => {
        if (journey.id !== journeyId) return journey;
        const currentSegments = [...(journey.segments || journey.travelSegments || [])];
        const index = currentSegments.findIndex((s) => s.id === segmentId);
        if (index === -1) return journey;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentSegments.length) return journey;

        const temp = currentSegments[index];
        currentSegments[index] = currentSegments[targetIndex];
        currentSegments[targetIndex] = temp;

        const reindexed = currentSegments.map((s, idx) => ({ ...s, order: idx + 1 }));

        return {
          ...journey,
          segments: reindexed,
          travelSegments: reindexed,
        };
      })
    );

    addToast('Trip Chain Reordered', `Segment moved ${direction}.`, 'info');
  };

  // Saved places handlers
  const toggleSavedPlace = (placeId) => {
    setSavedPlaces((prev) =>
      prev.map((p) => {
        if (p.id !== placeId) return p;
        const nextState = !p.isMustVisit;
        addToast(
          nextState ? 'Marked as Must-Visit' : 'Removed from Must-Visit',
          p.name,
          'info'
        );
        return { ...p, isMustVisit: nextState };
      })
    );
  };

  const addSavedPlace = (newPlaceData) => {
    const newPlace = {
      id: 'sp-' + Date.now(),
      name: newPlaceData.name,
      category: newPlaceData.category || 'Tourist Spot',
      city: newPlaceData.city || 'Kyoto',
      country: newPlaceData.country || 'Japan',
      address: newPlaceData.address || 'Address provided by traveler',
      rating: parseFloat(newPlaceData.rating) || 4.8,
      reviewsCount: 1,
      tags: Array.isArray(newPlaceData.tags)
        ? newPlaceData.tags
        : typeof newPlaceData.tags === 'string'
        ? newPlaceData.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Custom Safe Zone'],
      hours: newPlaceData.hours || 'Standard Hours',
      coords: newPlaceData.coords || [35.0116, 135.7681],
      radiusMeters: parseInt(newPlaceData.radiusMeters, 10) || 250,
      isSafeZone: newPlaceData.isSafeZone !== undefined ? newPlaceData.isSafeZone : true,
      currentStatus: 'outside',
      notes: newPlaceData.notes || '',
      imageUrl: newPlaceData.imageUrl || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
      tripId: newPlaceData.tripId || activeJourneyId,
      isMustVisit: newPlaceData.isMustVisit !== undefined ? newPlaceData.isMustVisit : true,
    };
    setSavedPlaces((prev) => [newPlace, ...prev]);
    addToast('Safe Zone Created', `${newPlace.name} (${newPlace.radiusMeters}m geofence) added to safe zones.`, 'success');
  };

  const editSavedPlace = (placeId, updatedData) => {
    setSavedPlaces((prev) =>
      prev.map((p) => {
        if (p.id !== placeId) return p;
        return {
          ...p,
          ...updatedData,
          radiusMeters: updatedData.radiusMeters ? parseInt(updatedData.radiusMeters, 10) : p.radiusMeters,
        };
      })
    );
    addToast('Safe Zone Updated', 'Geofence parameters updated successfully.', 'success');
  };

  const removeSavedPlace = (placeId) => {
    const place = savedPlaces.find((p) => p.id === placeId);
    setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
    addToast('Safe Zone Removed', `${place?.name || 'Place'} removed from safe zones.`, 'info');
  };

  // Trusted Contact Management (CRUD)
  const addTrustedContact = (contactData) => {
    const newContact = {
      id: 'tc-' + Date.now(),
      name: contactData.name.trim(),
      relation: contactData.relation?.trim() || 'Emergency Contact',
      phone: contactData.phone.trim(),
      email: contactData.email?.trim() || '',
      notifyOnSos: contactData.notifyOnSos !== undefined ? contactData.notifyOnSos : true,
      status: 'Verified Contact',
      channels: ['Simulated SMS'],
    };

    setTrustedContacts((prev) => [...prev, newContact]);
    addToast('Contact Added', `${newContact.name} added to trusted emergency contacts.`, 'success');
  };

  const editTrustedContact = (id, updatedData) => {
    setTrustedContacts((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          ...updatedData,
          name: updatedData.name !== undefined ? updatedData.name.trim() : c.name,
          phone: updatedData.phone !== undefined ? updatedData.phone.trim() : c.phone,
          relation: updatedData.relation !== undefined ? updatedData.relation.trim() : c.relation,
          email: updatedData.email !== undefined ? updatedData.email.trim() : c.email,
        };
      })
    );
    addToast('Contact Updated', 'Emergency contact details were saved.', 'success');
  };

  const removeTrustedContact = (id) => {
    const target = trustedContacts.find((c) => c.id === id);
    setTrustedContacts((prev) => prev.filter((c) => c.id !== id));
    addToast('Contact Removed', `${target?.name || 'Contact'} removed from trusted contacts.`, 'info');
  };

  // Geofence Simulation: Simulate Entry / Simulate Exit
  const simulateGeofenceEvent = (placeId, eventType = 'ENTRY') => {
    const place = savedPlaces.find((p) => p.id === placeId);
    if (!place) return;

    // Toggle current status in saved places list
    setSavedPlaces((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          return {
            ...p,
            currentStatus: eventType === 'ENTRY' ? 'inside' : 'outside',
          };
        }
        return p;
      })
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isEntry = eventType === 'ENTRY';

    const newLog = {
      id: 'geo-' + Date.now(),
      placeId: place.id,
      placeName: place.name,
      category: place.category || 'Safe Zone',
      eventType: eventType,
      timestamp: `Today, ${timeStr}`,
      radiusMeters: place.radiusMeters || 250,
      coords: place.coords || [35.0116, 135.7681],
      note: `Simulated Geofence Trigger: ${
        isEntry ? 'Crossed safe boundary inward' : 'Departed designated boundary'
      } for ${place.name} (${place.radiusMeters || 250}m perimeter).`,
      isSimulated: true,
    };

    setGeofenceEventLogs((prev) => [newLog, ...prev]);

    addToast(
      `Geofence ${isEntry ? 'Entry' : 'Exit'} (Simulated)`,
      `${isEntry ? 'Entered safe boundary of' : 'Departed from'} ${place.name} (${place.radiusMeters || 250}m radius).`,
      isEntry ? 'success' : 'info'
    );
  };

  const clearGeofenceEventLogs = () => {
    setGeofenceEventLogs([]);
    addToast('Event History Cleared', 'Geofence simulation history cleared.', 'info');
  };

  // Simulated Safety Check-in Ping
  const sendSafetyCheckInPing = (customNote = '') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const locationName = activeJourney?.currentLocation?.name || 'Current Safe Transit Zone';

    const newPing = {
      id: 'chk-' + Date.now(),
      timestamp: `Today, ${timeStr}`,
      location: locationName,
      status: 'Safe & Verified',
      note: customNote || 'Automated safety confirmation sent to emergency contacts.',
      battery: '91%',
    };

    setCheckInLogs((prev) => [newPing, ...prev]);
    addToast('Check-in Broadcast Sent (Simulated)', `Contacts notified that you are safe at ${locationName}.`, 'success');

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  // SOS Accidental Activation Prevention & Session Management
  const openSosConfirmation = () => {
    setIsSosConfirmOpen(true);
  };

  const closeSosConfirmation = () => {
    setIsSosConfirmOpen(false);
  };

  const startEmergencySession = (bypassCountdown = false) => {
    setIsSosConfirmOpen(false);

    if (bypassCountdown) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const sampleLoc = {
        name: activeJourney?.currentLocation?.name || 'Gion District Safe Transit Hub, Kyoto',
        address: activeJourney?.hotelInfo?.address || '572 Komatsucho, Higashiyama Ward, Kyoto 605-0931',
        coords: activeJourney?.currentLocation?.coords || [35.0037, 135.7770],
        accuracy: '±8m (Simulated Client GPS)',
        region: activeJourney?.destination || 'Kyoto, Japan (Demo Coordinates)',
      };

      // Generate mock alert deliveries for trusted contacts marked for SOS
      const activeContacts = trustedContacts.filter((c) => c.notifyOnSos !== false);
      const deliveries = activeContacts.map((c) => ({
        contactId: c.id,
        name: c.name,
        phone: c.phone,
        relation: c.relation,
        channel: 'Simulated SMS Relay',
        status: 'Delivered (Simulated Demo)',
        timestamp: 'Just now',
        payloadPreview: `TRIPMATE SIMULATED SOS: Distress broadcast initiated for Alex Sterling at ${sampleLoc.name} (${sampleLoc.coords.join(', ')}). ICE health profile attached. [DEMO SIMULATION ONLY]`,
      }));

      // Include consular mission alert
      deliveries.push({
        contactId: 'emb-consular-desk',
        name: 'US Consulate General Osaka-Kobe Citizen Support',
        phone: '+81 3-3224-5000',
        channel: 'Consular Wire Relay',
        status: 'Relay Queued (Simulation)',
        timestamp: 'Just now',
        payloadPreview: `DIPLOMATIC CITIZEN ALERT: Simulated citizen distress packet logged for Alex Sterling. Coordinates: ${sampleLoc.coords.join(', ')}.`,
      });

      setEmergencySession({
        isActive: true,
        startedAt: timeStr,
        startedTimestamp: Date.now(),
        elapsedSeconds: 0,
        sampleLocation: sampleLoc,
        mockAlertDeliveries: deliveries,
        medicalIceSummary: 'Blood: O+ | Allergies: Penicillin | Policy: Allianz #AG-9428-TRAVEL-PRO',
      });

      const newSosLog = {
        id: 'sos-' + Date.now(),
        timestamp: `Today, ${timeStr}`,
        type: 'SIMULATED EMERGENCY SOS BROADCAST',
        location: `${sampleLoc.name} (${sampleLoc.coords.join(', ')})`,
        contactsAlerted: deliveries.map((d) => `${d.name} (${d.phone})`),
        status: 'Simulated Emergency Session Running',
      };

      setSosLogs((prev) => [newSosLog, ...prev]);
      setIsSosModalOpen(false);
      setSosCountdown(null);
      setSosActive(true);

      addToast(
        'SIMULATED EMERGENCY SESSION ACTIVE',
        'Demonstration mode active. Live elapsed timer & mock alert delivery console started. Real emergency lines are NEVER contacted.',
        'warning'
      );
    } else {
      setIsSosModalOpen(true);
      setSosCountdown(5);
      setSosActive(false);
    }
  };

  const endEmergencySession = () => {
    const elapsed = emergencySession.elapsedSeconds;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const durationStr = `${mins}m ${secs}s`;

    setEmergencySession((prev) => ({
      ...prev,
      isActive: false,
      endedAt: new Date().toLocaleTimeString(),
      finalDuration: durationStr,
    }));

    setSosActive(false);
    setSosCountdown(null);
    setIsSosModalOpen(false);

    addToast(
      'Emergency Session Ended',
      `Simulated distress protocol terminated after ${durationStr}. System restored to safe standby mode.`,
      'info'
    );
  };

  // Backwards compatible startSosSimulation opens the confirmation modal
  const startSosSimulation = () => {
    openSosConfirmation();
  };

  // Countdown timer for 5s countdown option
  useEffect(() => {
    let timer = null;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (sosCountdown === 0) {
      // Countdown completed: activate emergency session
      startEmergencySession(true);
    }
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  const cancelSosSimulation = () => {
    setSosCountdown(null);
    setSosActive(false);
    setIsSosModalOpen(false);
    addToast('SOS Canceled', 'Emergency countdown aborted by user.', 'info');
  };

  const closeSosModal = () => {
    setSosCountdown(null);
    setIsSosModalOpen(false);
  };

  // Journey Controls (Start Journey / End Journey)
  const startJourney = (targetJourneyId) => {
    const targetId = targetJourneyId || activeJourneyId;
    const targetJourney = journeys.find((j) => j.id === targetId) || journeys[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setJourneyLiveState({
      status: 'in_progress',
      startTime: timeStr,
      startedDate: now.toISOString().split('T')[0],
      activeSegmentIndex: 0,
      elapsedMinutes: 0,
      journeyId: targetId,
    });

    addToast('Journey Started', `Started "${targetJourney.title}". Segment 1 active.`, 'success');
  };

  const endJourney = () => {
    const currentJourney = journeys.find((j) => j.id === journeyLiveState.journeyId) || activeJourney;
    const now = new Date();
    const dateStr = 'Today, ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newRecord = {
      id: 'rj-' + Date.now(),
      title: currentJourney?.title || 'Kyoto Cultural Traverse',
      destination: currentJourney?.destination || 'Kyoto, Japan',
      date: dateStr,
      distanceKm: 38.9,
      distanceMi: 24.2,
      duration: '3h 15m',
      transportModes: currentJourney?.transitTypes || ['bullet_train', 'walking'],
      co2SavedKg: 8.9,
      status: 'Completed',
      notes: `Finalized demo journey from ${currentJourney?.waypoints?.[0]?.title || 'Origin'} to ${currentJourney?.waypoints?.[currentJourney.waypoints.length - 1]?.title || 'Destination'}. All segments recorded.`,
    };

    setRecentJourneys((prev) => [newRecord, ...prev]);

    setSummaryStats((prev) => ({
      ...prev,
      journeysCompleted: prev.journeysCompleted + 1,
      totalDistanceKm: prev.totalDistanceKm + 38.9,
      totalTravelTimeHours: parseFloat((prev.totalTravelTimeHours + 3.25).toFixed(2)),
      totalCo2SavedKg: prev.totalCo2SavedKg + 8.9,
    }));

    setJourneyLiveState((prev) => ({
      ...prev,
      status: 'idle',
      activeSegmentIndex: 3,
    }));

    addToast('Journey Completed!', `"${currentJourney?.title || 'Journey'}" finalized and added to Recent Journeys.`, 'success');

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  const advanceSegment = () => {
    const currentJourney = journeys.find((j) => j.id === journeyLiveState.journeyId) || activeJourney;
    const totalSegments = currentJourney?.travelSegments?.length || 4;
    const nextIdx = journeyLiveState.activeSegmentIndex + 1;

    if (nextIdx < totalSegments) {
      setJourneyLiveState((prev) => ({
        ...prev,
        activeSegmentIndex: nextIdx,
      }));
      const nextSeg = currentJourney?.travelSegments?.[nextIdx];
      addToast('Segment Advanced', `Arrived at waypoint. Next: ${nextSeg?.to || 'Next destination'}.`, 'info');
    } else {
      endJourney();
    }
  };

  // Reset Demo Data
  const resetAllDemoData = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.JOURNEYS);
      localStorage.removeItem(STORAGE_KEYS.SAVED_PLACES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CHECK_INS);
      localStorage.removeItem(STORAGE_KEYS.SOS_LOGS);
      localStorage.removeItem(STORAGE_KEYS.LIVE_STATE);
      localStorage.removeItem(STORAGE_KEYS.RECENT_JOURNEYS);
      localStorage.removeItem(STORAGE_KEYS.SUMMARY_STATS);
      localStorage.removeItem(STORAGE_KEYS.TRUSTED_CONTACTS);
      localStorage.removeItem(STORAGE_KEYS.EMERGENCY_SESSION);
      localStorage.removeItem(STORAGE_KEYS.GEOFENCE_LOGS);
    } catch {}

    setJourneys(INITIAL_JOURNEYS);
    setSavedPlaces(INITIAL_SAVED_PLACES);
    setSettings(INITIAL_SETTINGS);
    setTrustedContacts(INITIAL_TRUSTED_CONTACTS);
    setEmergencySession(DEFAULT_EMERGENCY_SESSION);
    setGeofenceEventLogs(INITIAL_GEOFENCE_LOGS);
    setActiveJourneyId('kyoto-2026');
    setSummaryStats(INITIAL_SUMMARY_STATS);
    setRecentJourneys(INITIAL_RECENT_JOURNEYS);
    setJourneyLiveState({
      status: 'in_progress',
      startTime: '09:15 AM',
      startedDate: '2026-10-28',
      activeSegmentIndex: 1,
      elapsedMinutes: 145,
      journeyId: 'kyoto-2026',
    });
    setCheckInLogs([
      {
        id: 'chk-1',
        timestamp: 'Today, 10:15 AM',
        location: 'Gion District, Kyoto',
        status: 'Safe & Active',
        note: 'Checked in at Shirakawa Canal bridge. Battery 88%.',
        battery: '88%',
      },
    ]);
    setSosLogs([]);
    addToast('Demo Data Reset', 'All journeys, saved safe zones, trusted contacts, and safety settings returned to initial seed state.', 'info');
  };

  // Export Data as JSON
  const exportJourneyData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      user: user,
      settings: settings,
      journeys: journeys,
      recentJourneys: recentJourneys,
      summaryStats: summaryStats,
      savedPlaces: savedPlaces,
      trustedContacts: trustedContacts,
      emergencySession: emergencySession,
      geofenceEventLogs: geofenceEventLogs,
      checkInLogs: checkInLogs,
      disclaimer: 'TripMate Demo Data Export. Simulated traveler records. No actual emergency dispatch.',
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tripmate-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addToast('Data Exported', 'Your journeys and safety data were downloaded as JSON.', 'success');
  };

  const value = {
    activePage,
    setActivePage,
    activeJourneyId,
    setActiveJourneyId,
    activeJourney,
    navigateToJourney,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSearchOpen,
    setIsSearchOpen,
    user,
    setUser,
    settings,
    setSettings,
    journeys,
    setJourneys,
    savedPlaces,
    setSavedPlaces,
    toggleSavedPlace,
    addSavedPlace,
    editSavedPlace,
    removeSavedPlace,
    checkInLogs,
    sendSafetyCheckInPing,
    sosLogs,
    isSosModalOpen,
    sosCountdown,
    sosActive,
    startSosSimulation,
    cancelSosSimulation,
    closeSosModal,
    // Safety Center & Simulated Emergency Session
    emergencySession,
    startEmergencySession,
    endEmergencySession,
    isSosConfirmOpen,
    openSosConfirmation,
    closeSosConfirmation,
    trustedContacts,
    addTrustedContact,
    editTrustedContact,
    removeTrustedContact,
    // Geofencing & Safe Zones
    geofenceEventLogs,
    simulateGeofenceEvent,
    clearGeofenceEventLogs,
    toasts,
    addToast,
    removeToast,
    togglePackingItem,
    addPackingItem,
    toggleItineraryItem,
    addExpenseToJourney,
    createJourney,
    editJourney,
    deleteJourney,
    addSegmentToJourney,
    editSegmentInJourney,
    deleteSegmentFromJourney,
    reorderSegmentInJourney,
    resetAllDemoData,
    exportJourneyData,
    // Overview Presentation Features
    summaryStats,
    recentJourneys,
    journeyLiveState,
    startJourney,
    endJourney,
    advanceSegment,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
