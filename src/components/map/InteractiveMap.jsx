import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Layers,
  Compass,
  AlertTriangle,
  ExternalLink,
  WifiOff,
  Navigation,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Crosshair,
  Loader2,
  X,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { searchLocation, getCurrentBrowserPosition } from '../../services/geocoding';
import { useApp } from '../../context/AppContext';

// Fix for default Leaflet marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function InteractiveMap({
  waypoints = [],
  routeGeometry = null,
  stays = [],
  places = [],
  savedZones = [],
  dangerZones: propDangerZones = null,
  onSimulateGeofence = null,
  onSimulateDangerEntry = null,
  center = null,
  zoom = 13,
  currentLocation = null,
  height = '460px',
  interactive = true,
  destinationTitle = 'Expedition Route Map',
  onLocationSelect = null,
}) {
  const appContext = useApp();
  const dangerZones = propDangerZones || appContext?.dangerZones || [];
  const evaluateDangerZones = appContext?.evaluateDangerZones;
  const simulateDangerZoneEntry = onSimulateDangerEntry || appContext?.simulateDangerZoneEntry;
  const activeDangerBreach = appContext?.activeDangerBreach;

  // Map Container & Instance Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Dedicated Persistent LayerGroups (prevents map remounts and layer leaks)
  const waypointsLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const staysLayerRef = useRef(null);
  const placesLayerRef = useRef(null);
  const zonesLayerRef = useRef(null);
  const dangerZonesLayerRef = useRef(null);
  const currentLocationLayerRef = useRef(null);
  const liveLocationLayerRef = useRef(null);

  // Single Mutable Live Location & Search Marker Refs
  const liveMarkerRef = useRef(null);
  const liveCircleRef = useRef(null);
  const searchMarkerRef = useRef(null);

  // Bounds Fingerprint Ref (ensures fitBounds is only called on genuine waypoint/route changes)
  const lastBoundsFingerprintRef = useRef('');

  // UI State
  const [mapError, setMapError] = useState(false);
  const [mapTileSource, setMapTileSource] = useState('osm'); // 'osm' | 'voyager'
  const [mapViewMode, setMapViewMode] = useState('leaflet'); // 'leaflet' | 'schematic'
  const [selectedWaypoint, setSelectedWaypoint] = useState(null);

  // Geocoding Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchDebounceRef = useRef(null);

  // Live Location & GPS Telemetry State
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const followUserRef = useRef(true);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'waiting' | 'acquired' | 'low_accuracy' | 'denied' | 'unavailable' | 'timeout'
  const [gpsError, setGpsError] = useState(null);
  const [liveGps, setLiveGps] = useState(null);

  // GPS Watcher Tracking Refs
  const watchIdRef = useRef(null);
  const isFirstFixRef = useRef(true);

  // Keep followUserRef in sync with state for Leaflet event callbacks
  useEffect(() => {
    followUserRef.current = followUser;
  }, [followUser]);

  // Calculate default center if not explicitly provided
  const resolvedCenter = useMemo(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      return center;
    }
    const firstWpWithCoords = waypoints.find((w) => w.coords && w.coords.length === 2 && !isNaN(w.coords[0]));
    if (firstWpWithCoords) {
      return firstWpWithCoords.coords;
    }
    const firstZoneWithCoords = savedZones.find(
      (z) => (z.coords && z.coords.length === 2) || (z.lat != null && z.lng != null)
    );
    if (firstZoneWithCoords) {
      return firstZoneWithCoords.coords || [firstZoneWithCoords.lat, firstZoneWithCoords.lng];
    }
    return [28.6139, 77.2090]; // Neutral fallback center
  }, [center, waypoints, savedZones]);

  // =========================================================================
  // 1. LEAFLET MAP INITIALIZATION (MOUNT ONCE PER CONTAINER)
  // =========================================================================
  useEffect(() => {
    if (mapViewMode !== 'leaflet') return;
    if (!mapContainerRef.current) return;

    // Do NOT re-initialize if map instance already exists
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: resolvedCenter,
        zoom: zoom,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // LayerGroups for strict separation of concerns
      waypointsLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      staysLayerRef.current = L.layerGroup().addTo(map);
      placesLayerRef.current = L.layerGroup().addTo(map);
      zonesLayerRef.current = L.layerGroup().addTo(map);
      dangerZonesLayerRef.current = L.layerGroup().addTo(map);
      currentLocationLayerRef.current = L.layerGroup().addTo(map);
      liveLocationLayerRef.current = L.layerGroup().addTo(map);

      // Initialize OpenStreetMap or Voyager tile layer
      const tileUrl =
        mapTileSource === 'osm'
          ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const tileAttribution =
        mapTileSource === 'osm'
          ? '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: mapTileSource === 'osm' ? 'abc' : 'abcd',
        attribution: tileAttribution,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Detect manual user drag/pan to stop automatic following
      const handleUserDrag = () => {
        if (followUserRef.current) {
          followUserRef.current = false;
          setFollowUser(false);
        }
      };

      map.on('dragstart', handleUserDrag);

      // ResizeObserver to cleanly handle container sizing without repeated calls
      let resizeObserver = null;
      if (typeof window !== 'undefined' && window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
          }
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      // Initial layout tick
      setTimeout(() => {
        map.invalidateSize();
      }, 150);

      mapInstanceRef.current = map;

      return () => {
        if (resizeObserver) resizeObserver.disconnect();
        map.off('dragstart', handleUserDrag);
        map.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        waypointsLayerRef.current = null;
        routeLayerRef.current = null;
        staysLayerRef.current = null;
        placesLayerRef.current = null;
        zonesLayerRef.current = null;
        currentLocationLayerRef.current = null;
        liveLocationLayerRef.current = null;
        liveMarkerRef.current = null;
        liveCircleRef.current = null;
        searchMarkerRef.current = null;
      };
    } catch (err) {
      console.warn('Leaflet map initialization error, falling back to schematic:', err);
      setMapError(true);
      setMapViewMode('schematic');
    }
  }, [mapViewMode]);

  // =========================================================================
  // 2. SEAMLESS TILE SOURCE SWITCHING (NO MAP REMOUNT)
  // =========================================================================
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl =
      mapTileSource === 'osm'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [mapTileSource]);

  // =========================================================================
  // 3. WAYPOINTS, ROUTES, STAYS, PLACES & ZONES (ISOLATED FROM GPS)
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || mapViewMode !== 'leaflet') return;

    // Clear previous vector layers cleanly
    waypointsLayerRef.current?.clearLayers();
    routeLayerRef.current?.clearLayers();
    staysLayerRef.current?.clearLayers();
    placesLayerRef.current?.clearLayers();
    zonesLayerRef.current?.clearLayers();
    dangerZonesLayerRef.current?.clearLayers();
    currentLocationLayerRef.current?.clearLayers();

    const boundsLatLngs = [];

    // 1. Waypoints
    const totalWp = waypoints.length;
    waypoints.forEach((wp, index) => {
      if (!wp.coords || wp.coords.length !== 2 || isNaN(wp.coords[0]) || isNaN(wp.coords[1])) {
        return;
      }
      boundsLatLngs.push(wp.coords);

      const isOrigin = index === 0 || wp.isOrigin;
      const isDestination = index === totalWp - 1 || wp.isDestination;
      const isCompleted = wp.completed;
      const isNext = wp.isNext;

      let bg = '#1e293b';
      let borderColor = '#ffffff';
      let label = `${index + 1}`;
      let role = 'Stop';

      if (isOrigin) {
        bg = '#244C3A';
        borderColor = '#8FB99A';
        label = 'START';
        role = 'Origin';
      } else if (isDestination) {
        bg = '#1B382B';
        borderColor = '#DCE9DF';
        label = 'DEST';
        role = 'Destination';
      } else if (isCompleted) {
        bg = '#10b981';
        borderColor = '#a7f3d0';
      } else if (isNext) {
        bg = '#C7795B';
        borderColor = '#F9EFEA';
      }

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: ${isOrigin || isDestination ? '48px' : '32px'};
          height: 32px;
          padding: 0 6px;
          border-radius: 9999px;
          background: ${bg};
          border: 2px solid ${borderColor};
          color: #ffffff;
          font-weight: 800;
          font-size: ${isOrigin || isDestination ? '10px' : '12px'};
          letter-spacing: ${isOrigin || isDestination ? '0.05em' : 'normal'};
          box-shadow: 0 4px 14px rgba(0,0,0,0.6);
          cursor: pointer;
        ">
          ${label}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-wp-icon',
        iconSize: [isOrigin || isDestination ? 48 : 32, 32],
        iconAnchor: [isOrigin || isDestination ? 24 : 16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker(wp.coords, { icon: customIcon }).addTo(waypointsLayerRef.current);

      const popupContent = `
        <div style="min-width: 190px; padding: 4px;">
          <div style="font-size: 10px; text-transform: uppercase; color: ${
            isOrigin ? '#8FB99A' : isDestination ? '#DCE9DF' : '#C7795B'
          }; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 2px;">
            ${role.toUpperCase()} • Stop #${index + 1}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
            ${wp.title}
          </div>
          ${
            wp.time
              ? `<div style="font-size: 11px; color: #94a3b8; margin-bottom: 3px;">🕒 Planned: ${wp.time}</div>`
              : ''
          }
          ${
            wp.notes
              ? `<div style="font-size: 11px; color: #cbd5e1; background: #1e293b; padding: 4px 8px; border-radius: 6px; margin-top: 4px; border: 1px solid #334155;">${wp.notes}</div>`
              : ''
          }
          <div style="font-size: 10px; font-mono; color: #64748b; margin-top: 5px;">
            Coords: ${wp.coords[0].toFixed(4)}, ${wp.coords[1].toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedWaypoint(wp);
      });
    });

    // 2. Route Polyline
    const isRoadGeometry = Array.isArray(routeGeometry) && routeGeometry.length > 1;
    const polylineCoords = isRoadGeometry ? routeGeometry : boundsLatLngs.length > 1 ? boundsLatLngs : null;

    if (polylineCoords) {
      L.polyline(polylineCoords, {
        color: '#4E7A5A',
        weight: 4,
        opacity: 0.9,
        dashArray: isRoadGeometry ? undefined : '6, 8',
        lineCap: 'round',
      }).addTo(routeLayerRef.current);

      if (isRoadGeometry) {
        polylineCoords.forEach((pt) => {
          if (Array.isArray(pt) && pt.length === 2 && !isNaN(pt[0])) {
            boundsLatLngs.push(pt);
          }
        });
      }
    }

    // 3. Stays / Accommodations
    if (Array.isArray(stays) && stays.length > 0) {
      stays.forEach((stay) => {
        if (!stay.coords || stay.coords.length !== 2 || isNaN(stay.coords[0])) return;
        boundsLatLngs.push(stay.coords);

        const stayIconHtml = `
          <div style="
            display: flex; align-items: center; justify-content: center;
            width: 32px; height: 32px; border-radius: 9999px;
            background: #C7795B; border: 2px solid #F9EFEA;
            color: white; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          ">
            🏨
          </div>
        `;

        const stayMarker = L.marker(stay.coords, {
          icon: L.divIcon({ html: stayIconHtml, className: 'stay-marker', iconSize: [32, 32], iconAnchor: [16, 16] }),
        }).addTo(staysLayerRef.current);

        stayMarker.bindPopup(`
          <div style="min-width: 170px; padding: 2px;">
            <div style="font-size: 9px; text-transform: uppercase; color: #a5b4fc; font-weight: 800; margin-bottom: 2px;">ACCOMMODATION</div>
            <div style="font-size: 13px; font-weight: 700; color: white;">${stay.name}</div>
            ${stay.address ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${stay.address}</div>` : ''}
            ${stay.totalPrice ? `<div style="font-size: 11px; color: #34d399; font-weight: 700; margin-top: 4px;">${stay.currency || 'USD'} ${stay.totalPrice}</div>` : ''}
          </div>
        `);
      });
    }

    // 4. Places to Visit
    if (Array.isArray(places) && places.length > 0) {
      places.forEach((place) => {
        if (!place.coords || place.coords.length !== 2 || isNaN(place.coords[0])) return;
        boundsLatLngs.push(place.coords);

        const placeIconHtml = `
          <div style="
            display: flex; align-items: center; justify-content: center;
            width: 30px; height: 30px; border-radius: 9999px;
            background: #4E7A5A; border: 2px solid #DCE9DF;
            color: white; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.6);
          ">
            📍
          </div>
        `;

        const placeMarker = L.marker(place.coords, {
          icon: L.divIcon({ html: placeIconHtml, className: 'place-marker', iconSize: [30, 30], iconAnchor: [15, 15] }),
        }).addTo(placesLayerRef.current);

        placeMarker.bindPopup(`
          <div style="min-width: 170px; padding: 2px;">
            <div style="font-size: 9px; text-transform: uppercase; color: #fde68a; font-weight: 800; margin-bottom: 2px;">${(place.category || 'PLACE').toUpperCase()}</div>
            <div style="font-size: 13px; font-weight: 700; color: white;">${place.title}</div>
            ${place.address ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${place.address}</div>` : ''}
            ${place.visitTime ? `<div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">Time: ${place.visitTime}</div>` : ''}
          </div>
        `);
      });
    }

    // 5. Geofence Safe Zones
    if (savedZones && savedZones.length > 0) {
      savedZones.forEach((zone) => {
        const zoneCoords =
          zone.coords && zone.coords.length === 2
            ? zone.coords
            : zone.lat != null && zone.lng != null
            ? [parseFloat(zone.lat), parseFloat(zone.lng)]
            : null;

        if (!zoneCoords || isNaN(zoneCoords[0]) || isNaN(zoneCoords[1])) return;
        boundsLatLngs.push(zoneCoords);

        const radius = zone.radiusMeters || 250;
        const isInside = zone.currentStatus === 'inside';

        let zoneColor = '#10b981';
        if (zone.category === 'Checkpoint' || zone.category === 'Emergency') zoneColor = '#f43f5e';
        else if (zone.category === 'Hotel' || zone.category === 'Lodging') zoneColor = '#06b6d4';
        else if (zone.category === 'Tourist Spot' || zone.category === 'Sights') zoneColor = '#a855f7';
        else if (zone.category === 'Dining') zoneColor = '#f59e0b';
        else if (zone.category === 'Transit Hub' || zone.category === 'Transit') zoneColor = '#10b981';

        L.circle(zoneCoords, {
          radius: radius,
          color: zoneColor,
          fillColor: zoneColor,
          fillOpacity: isInside ? 0.3 : 0.12,
          weight: isInside ? 2.5 : 1.5,
          dashArray: isInside ? null : '5, 5',
        }).addTo(zonesLayerRef.current);

        const zoneMarkerHtml = `
          <div style="
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 9999px;
            background: #202923;
            border: 2px solid ${zoneColor};
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.8);
            cursor: pointer;
            white-space: nowrap;
            ${isInside ? 'box-shadow: 0 0 16px ' + zoneColor + ';' : ''}
          ">
            <span style="width: 7px; height: 7px; border-radius: 9999px; background: ${
              isInside ? '#10b981' : zoneColor
            };"></span>
            <span>${zone.name ? zone.name.split(' ')[0] : 'Zone'}</span>
            <span style="font-size: 9px; opacity: 0.8; font-family: monospace; background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 4px;">${radius}m</span>
          </div>
        `;

        const zoneDivIcon = L.divIcon({
          html: zoneMarkerHtml,
          className: 'custom-zone-icon',
          iconSize: [90, 28],
          iconAnchor: [45, 14],
          popupAnchor: [0, -16],
        });

        const zoneMarker = L.marker(zoneCoords, { icon: zoneDivIcon }).addTo(zonesLayerRef.current);

        const zonePopupHtml = `
          <div style="min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: ${zoneColor}; letter-spacing: 0.05em;">
                ${zone.category} • Safe Perimeter
              </span>
              <span style="font-size: 9px; font-family: monospace; background: ${
                isInside ? '#065f46' : '#334155'
              }; color: ${isInside ? '#6ee7b7' : '#94a3b8'}; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                ${isInside ? '● INSIDE ZONE' : '○ OUTSIDE ZONE'}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 4px;">
              ${zone.name}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
              📍 ${zone.address || zone.city || 'Saved Location'} • Radius: <strong>${radius}m</strong>
            </div>
            ${
              zone.notes
                ? `<div style="font-size: 11px; color: #cbd5e1; background: #1e293b; padding: 5px 8px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #334155;">"${zone.notes}"</div>`
                : ''
            }
            <div style="font-size: 10px; font-mono; color: #64748b; margin-bottom: 6px;">
              Lat: ${zoneCoords[0].toFixed(4)}, Lng: ${zoneCoords[1].toFixed(4)}
            </div>
            ${
              onSimulateGeofence
                ? `
              <div style="display: flex; gap: 6px; padding-top: 4px; border-top: 1px solid #334155;">
                <button data-action="simulate-entry" data-zone-id="${
                  zone.id || zone._id
                }" style="flex: 1; padding: 5px 8px; border-radius: 6px; background: #244C3A; color: #ffffff; font-size: 11px; font-weight: 700; border: none; cursor: pointer;">
                  Simulate Entry
                </button>
                <button data-action="simulate-exit" data-zone-id="${
                  zone.id || zone._id
                }" style="flex: 1; padding: 5px 8px; border-radius: 6px; background: #334155; color: #e2e8f0; font-size: 11px; font-weight: 700; border: none; cursor: pointer;">
                  Simulate Exit
                </button>
              </div>
            `
                : ''
            }
          </div>
        `;

        zoneMarker.bindPopup(zonePopupHtml);
      });

      // Simulation delegation
      map.on('popupopen', (e) => {
        const popupContainer = e.popup?._container;
        if (!popupContainer) return;
        const entryBtn = popupContainer.querySelector('[data-action="simulate-entry"]');
        const exitBtn = popupContainer.querySelector('[data-action="simulate-exit"]');
        const dangerBtn = popupContainer.querySelector('[data-action="simulate-danger-entry"]');
        if (entryBtn) {
          entryBtn.onclick = () => {
            const zid = entryBtn.getAttribute('data-zone-id');
            if (onSimulateGeofence) onSimulateGeofence(zid, 'ENTRY');
            map.closePopup();
          };
        }
        if (exitBtn) {
          exitBtn.onclick = () => {
            const zid = exitBtn.getAttribute('data-zone-id');
            if (onSimulateGeofence) onSimulateGeofence(zid, 'EXIT');
            map.closePopup();
          };
        }
        if (dangerBtn) {
          dangerBtn.onclick = () => {
            const dzId = dangerBtn.getAttribute('data-danger-id');
            if (simulateDangerZoneEntry) simulateDangerZoneEntry(dzId);
            map.closePopup();
          };
        }
      });
    }

    // 6. Monitored Danger Zones (Hazard perimeters with amber/crimson hatching & distinct marker)
    if (dangerZones && dangerZones.length > 0) {
      dangerZones.forEach((zone) => {
        if (!zone.isActive) return;
        const zoneCoords = zone.coords && zone.coords.length === 2
          ? zone.coords
          : zone.lat != null && zone.lng != null
          ? [parseFloat(zone.lat), parseFloat(zone.lng)]
          : null;

        if (!zoneCoords || isNaN(zoneCoords[0]) || isNaN(zoneCoords[1])) return;
        boundsLatLngs.push(zoneCoords);

        const radius = zone.radiusMeters || 300;
        const isBreached = activeDangerBreach && activeDangerBreach.zone.id === zone.id;

        // Circle perimeter with red/amber styling
        L.circle(zoneCoords, {
          radius: radius,
          color: isBreached ? '#dc2626' : '#ef4444',
          fillColor: isBreached ? '#b91c1c' : '#ef4444',
          fillOpacity: isBreached ? 0.35 : 0.16,
          weight: isBreached ? 3 : 2,
          dashArray: '6, 6',
        }).addTo(dangerZonesLayerRef.current);

        const hazardMarkerHtml = `
          <div style="
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 8px;
            border-radius: 9999px;
            background: #450a0a;
            border: 2px solid ${isBreached ? '#f87171' : '#ef4444'};
            color: #ffffff;
            font-weight: 800;
            font-size: 11px;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
            cursor: pointer;
            white-space: nowrap;
            ${isBreached ? 'box-shadow: 0 0 16px #ef4444;' : ''}
          ">
            <span>⚠️</span>
            <span>${zone.name ? zone.name.split(' ')[0] : 'Danger'}</span>
            <span style="font-size: 9px; opacity: 0.9; font-family: monospace; background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 4px;">${radius}m</span>
          </div>
        `;

        const hazardDivIcon = L.divIcon({
          html: hazardMarkerHtml,
          className: 'custom-hazard-icon',
          iconSize: [90, 28],
          iconAnchor: [45, 14],
          popupAnchor: [0, -16],
        });

        const hazardMarker = L.marker(zoneCoords, { icon: hazardDivIcon }).addTo(dangerZonesLayerRef.current);

        const hazardPopupHtml = `
          <div style="min-width: 220px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #ef4444; letter-spacing: 0.05em;">
                ⚠️ HAZARD PERIMETER
              </span>
              <span style="font-size: 9px; font-family: monospace; background: #7f1d1d; color: #fecaca; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
                ${zone.hazardType || 'Hazard Zone'}
              </span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #ffffff; margin-bottom: 3px;">
              ${zone.name}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
              Perimeter: <strong>${radius}m radius</strong>
            </div>
            ${zone.notes ? `<div style="font-size: 11px; color: #fecaca; background: #450a0a; padding: 5px 8px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #7f1d1d;">${zone.notes}</div>` : ''}
            <button
              type="button"
              data-action="simulate-danger-entry"
              data-danger-id="${zone.id}"
              style="width: 100%; padding: 6px 10px; background: #dc2626; color: #ffffff; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;"
            >
              Simulate GPS Entry (Test 60s Timer)
            </button>
          </div>
        `;

        hazardMarker.bindPopup(hazardPopupHtml);
      });
    }

    // 7. Optional Reported Expedition Position (Static Journey Prop)
    if (currentLocation && currentLocation.coords && currentLocation.coords.length === 2) {
      boundsLatLngs.push(currentLocation.coords);
      const radarHtml = `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(143, 185, 154, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 9999px; background: #8FB99A; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>
        </div>
      `;

      const radarIcon = L.divIcon({
        html: radarHtml,
        className: 'current-pos-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -14],
      });

      const currentMarker = L.marker(currentLocation.coords, { icon: radarIcon }).addTo(currentLocationLayerRef.current);
      currentMarker.bindPopup(`
        <div style="font-size: 13px; font-weight: 700; color: #8FB99A;">
          📍 Reported Expedition Position
          <div style="font-size: 11px; color: #cbd5e1; font-weight: 400; margin-top: 2px;">
            ${currentLocation.name || 'Waymark'}
          </div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">
            Updated: ${currentLocation.updatedAgo || 'Active'}
          </div>
        </div>
      `);
    }

    // STRICT FINGERPRINT CHECK: Only call fitBounds if waypoints or route actually changed
    // Never call fitBounds on live GPS telemetry updates!
    const boundsFingerprint = JSON.stringify(
      boundsLatLngs.map((c) => [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000])
    );

    if (boundsFingerprint !== lastBoundsFingerprintRef.current && boundsLatLngs.length > 0) {
      lastBoundsFingerprintRef.current = boundsFingerprint;
      if (boundsLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(boundsLatLngs), { padding: [40, 40], maxZoom: 16 });
      } else if (boundsLatLngs.length === 1) {
        map.setView(boundsLatLngs[0], 14);
      }
    }
  }, [waypoints, routeGeometry, stays, places, savedZones, dangerZones, activeDangerBreach, currentLocation, mapViewMode, onSimulateGeofence, simulateDangerZoneEntry]);

  // =========================================================================
  // 4. ROBUST LIVE GEOLOCATION WATCHER (SINGLE WATCHER, SMOOTH UPDATES)
  // =========================================================================
  useEffect(() => {
    // If live tracking is disabled, clean up watcher and marker immediately
    if (!isLiveTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (liveMarkerRef.current) {
        liveMarkerRef.current.remove();
        liveMarkerRef.current = null;
      }
      if (liveCircleRef.current) {
        liveCircleRef.current.remove();
        liveCircleRef.current = null;
      }
      setGpsStatus('idle');
      setGpsError(null);
      setLiveGps(null);
      return;
    }

    // Verify browser support
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsError('Geolocation is not supported by your browser.');
      setIsLiveTracking(false);
      return;
    }

    // Clear any pre-existing watcher before registering a new one
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsStatus('waiting');
    setGpsError(null);
    isFirstFixRef.current = true;

    const onGpsSuccess = (pos) => {
      const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords;

      // Filter obviously invalid or NaN coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return;
      }

      // Filter wild readings with accuracy > 5000m
      if (accuracy > 5000) {
        setGpsStatus('low_accuracy');
        return;
      }

      const isLowAcc = accuracy > 150;
      setGpsStatus(isLowAcc ? 'low_accuracy' : 'acquired');
      setLiveGps({
        lat,
        lng,
        coords: [lat, lng],
        accuracy: Math.round(accuracy),
        heading: heading != null ? Math.round(heading) : null,
        speed: speed != null ? Math.round(speed * 3.6) : null,
        timestamp: pos.timestamp,
      });

      // Real Danger-Zone Geofencing evaluation
      if (evaluateDangerZones) {
        evaluateDangerZones([lat, lng], accuracy);
      }

      const map = mapInstanceRef.current;
      if (!map || !liveLocationLayerRef.current) return;

      // 1. Single Live Location Marker: Update with setLatLng (NEVER recreate)
      if (!liveMarkerRef.current) {
        const liveDivIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(143, 185, 154, 0.45); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 16px; height: 16px; border-radius: 9999px; background: #8FB99A; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
            </div>
          `,
          className: 'user-live-gps-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([lat, lng], {
          icon: liveDivIcon,
          zIndexOffset: 1500,
        }).addTo(liveLocationLayerRef.current);

        marker.bindPopup(`
          <div style="min-width: 180px; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: #8FB99A; text-transform: uppercase; margin-bottom: 2px;">
              📡 Live Device Location
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #ffffff;">
              You are here
            </div>
            <div style="font-size: 11px; color: #cbd5e1; font-mono; margin-top: 4px;">
              ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E
            </div>
            <div style="font-size: 10px; color: #a6b0a5; margin-top: 2px;">
              GPS Accuracy: ±${Math.round(accuracy)}m
            </div>
          </div>
        `);

        liveMarkerRef.current = marker;
      } else {
        liveMarkerRef.current.setLatLng([lat, lng]);
        const popup = liveMarkerRef.current.getPopup();
        if (popup && popup.isOpen()) {
          popup.setContent(`
            <div style="min-width: 180px; padding: 4px;">
              <div style="font-size: 10px; font-weight: 800; color: #8FB99A; text-transform: uppercase; margin-bottom: 2px;">
                📡 Live Device Location
              </div>
              <div style="font-size: 13px; font-weight: 700; color: #ffffff;">
                You are here
              </div>
              <div style="font-size: 11px; color: #cbd5e1; font-mono; margin-top: 4px;">
                ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E
              </div>
              <div style="font-size: 10px; color: #a6b0a5; margin-top: 2px;">
                GPS Accuracy: ±${Math.round(accuracy)}m
              </div>
            </div>
          `);
        }
      }

      // 2. Single Accuracy Circle: Update with setLatLng & setRadius
      if (!liveCircleRef.current) {
        const circle = L.circle([lat, lng], {
          radius: Math.max(accuracy, 10),
          color: '#244C3A',
          fillColor: '#8FB99A',
          fillOpacity: 0.14,
          weight: 1.5,
          dashArray: '4, 4',
        }).addTo(liveLocationLayerRef.current);
        liveCircleRef.current = circle;
      } else {
        liveCircleRef.current.setLatLng([lat, lng]);
        liveCircleRef.current.setRadius(Math.max(accuracy, 10));
      }

      // 3. Smooth Camera Control (NEVER change zoom, NEVER call setView/flyTo on updates)
      if (isFirstFixRef.current) {
        isFirstFixRef.current = false;
        map.panTo([lat, lng], { animate: true, duration: 0.8 });
      } else if (followUserRef.current) {
        map.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
      // If followUser is false (e.g. user panned), the map stays exactly where user moved it!
    };

    const onGpsError = (err) => {
      let status = 'unavailable';
      let msg = 'Could not retrieve your location.';
      if (err.code === 1) {
        status = 'denied';
        msg = 'Location permission was denied. Please allow location access in your browser.';
      } else if (err.code === 2) {
        status = 'unavailable';
        msg = 'GPS or network position is unavailable.';
      } else if (err.code === 3) {
        status = 'timeout';
        msg = 'Location request timed out. Retrying GPS fix...';
      }
      setGpsStatus(status);
      setGpsError(msg);
    };

    // Exactly one single watcher registered
    const watchId = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isLiveTracking]);

  // Clean up watcher when component unmounts
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // 5. USER CONTROLS: LOCATE ME, FOLLOW ME & LIVE TRACKING
  // =========================================================================
  const handleToggleLiveTracking = useCallback(() => {
    setIsLiveTracking((prev) => {
      const next = !prev;
      if (next) {
        setFollowUser(true);
        followUserRef.current = true;
        isFirstFixRef.current = true;
      }
      return next;
    });
  }, []);

  const handleLocateMe = useCallback(() => {
    // If not live tracking yet, start it and center on user
    if (!isLiveTracking) {
      setIsLiveTracking(true);
      setFollowUser(true);
      followUserRef.current = true;
      isFirstFixRef.current = true;
    } else {
      // Re-center smoothly on current known GPS position and resume follow
      setFollowUser(true);
      followUserRef.current = true;
      if (liveGps && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([liveGps.lat, liveGps.lng], { animate: true, duration: 0.8 });
      }
    }
  }, [isLiveTracking, liveGps]);

  const handleToggleFollow = useCallback(() => {
    setFollowUser((prev) => {
      const next = !prev;
      followUserRef.current = next;
      if (next && liveGps && mapInstanceRef.current) {
        mapInstanceRef.current.panTo([liveGps.lat, liveGps.lng], { animate: true, duration: 0.6 });
      }
      return next;
    });
  }, [liveGps]);

  // =========================================================================
  // 6. GEOCODING SEARCH
  // =========================================================================
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(val);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSearchResult = (result) => {
    setSearchOpen(false);
    setSearchQuery(result.name);
    setSearchResults([]);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      map.flyTo([result.lat, result.lng], 15, { duration: 1.2 });

      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }

      const searchDivIcon = L.divIcon({
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 9999px;
            background: #244C3A;
            border: 3px solid #ffffff;
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
            cursor: pointer;
            animation: bounce 0.6s ease;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        className: 'search-pin-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const pin = L.marker([result.lat, result.lng], { icon: searchDivIcon }).addTo(map);
      pin.bindPopup(`
        <div style="min-width: 180px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 800; color: #8FB99A; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
            Geocoded Location
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 4px;">
            ${result.name}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
            ${result.displayName}
          </div>
          <div style="font-size: 10px; font-mono; color: #cbd5e1; background: #1e293b; padding: 3px 6px; border-radius: 4px;">
            Lat: ${result.lat.toFixed(4)}, Lng: ${result.lng.toFixed(4)}
          </div>
        </div>
      `).openPopup();

      searchMarkerRef.current = pin;
    }

    if (onLocationSelect) {
      onLocationSelect(result);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-travel bg-travel-card shadow-xl group">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Destination & Stops Pill */}
        <div className="pointer-events-auto bg-travel-card/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-travel shadow-lg flex items-center gap-2 text-xs font-semibold text-travel-secondary">
          <Navigation className="w-3.5 h-3.5 text-travel-accent shrink-0" />
          <span className="truncate max-w-[160px] sm:max-w-xs">{destinationTitle}</span>
          <span className="hidden sm:inline-block text-[10px] bg-travel-accent-soft text-travel-accent px-1.5 py-0.5 rounded font-mono">
            {waypoints.length} Stop{waypoints.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Right Controls: Search, Live GPS, Follow Toggle, Tile Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Geocoding Search Toggle */}
          <div className="relative">
            <div className="flex items-center bg-travel-card/95 backdrop-blur-md rounded-xl border border-travel shadow-lg p-1">
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                  searchOpen
                    ? 'btn-travel-primary'
                    : 'text-travel-secondary hover:text-travel-primary hover:bg-travel-subtle'
                }`}
                title="Search location via OpenStreetMap Nominatim"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px]">Search Map</span>
              </button>

              {searchOpen && (
                <div className="flex items-center gap-1 pl-1.5 pr-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search city, landmark..."
                    autoFocus
                    className="w-36 sm:w-48 bg-travel-subtle text-travel-primary placeholder:text-travel-muted text-xs px-2.5 py-1 rounded-lg border border-travel focus:outline-none focus:border-travel-accent"
                  />
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 text-travel-accent animate-spin" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-travel-muted hover:text-travel-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Geocoding Autocomplete Results Menu */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-travel-card backdrop-blur-md border border-travel rounded-xl shadow-2xl p-1.5 z-[500] space-y-1 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-travel-accent px-2 py-1">
                  OpenStreetMap Places
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-2 rounded-lg hover:bg-travel-subtle text-xs transition flex flex-col gap-0.5 group"
                  >
                    <span className="font-bold text-travel-primary group-hover:text-travel-accent flex items-center justify-between">
                      <span className="truncate">{res.name}</span>
                      <span className="text-[9px] font-mono text-travel-muted bg-travel-subtle px-1 py-0.5 rounded">
                        {res.type || 'place'}
                      </span>
                    </span>
                    <span className="text-[11px] text-travel-muted truncate">{res.displayName}</span>
                    <span className="text-[9px] font-mono text-travel-accent/80">
                      {res.lat.toFixed(4)}, {res.lng.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Live GPS / Locate Me Control */}
          {!isLiveTracking ? (
            <button
              type="button"
              onClick={handleLocateMe}
              className="pointer-events-auto p-1.5 px-2.5 rounded-xl bg-travel-card/95 backdrop-blur-md border border-travel shadow-lg text-xs font-medium text-travel-secondary hover:text-travel-accent hover:bg-travel-subtle transition flex items-center gap-1.5"
              title="Enable live GPS tracking & center on your location"
            >
              <Crosshair className="w-3.5 h-3.5 text-travel-accent" />
              <span className="hidden sm:inline text-[11px]">Live GPS</span>
            </button>
          ) : (
            <div className="pointer-events-auto flex items-center gap-1 bg-travel-card/95 backdrop-blur-md p-1 rounded-xl border border-travel shadow-lg">
              {/* Locate Me (Smooth Center) */}
              <button
                type="button"
                onClick={handleLocateMe}
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-travel-accent-soft text-travel-accent hover:bg-travel-accent-soft/80 transition flex items-center gap-1.5"
                title="Center on your current position"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px]">Locate Me</span>
              </button>

              {/* Follow Me Toggle */}
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                  followUser
                    ? 'btn-travel-primary text-[10px]'
                    : 'text-travel-muted hover:text-travel-primary hover:bg-travel-subtle text-[10px]'
                }`}
                title={followUser ? 'Follow Me is active (click to pause following)' : 'Follow Me is paused (click to resume)'}
              >
                {followUser ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span className="hidden md:inline">{followUser ? 'Following' : 'Free Pan'}</span>
              </button>

              {/* Stop Live GPS */}
              <button
                type="button"
                onClick={handleToggleLiveTracking}
                className="p-1 rounded-lg text-travel-muted hover:text-rose-400 hover:bg-travel-subtle transition"
                title="Turn off live GPS tracking"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Tile Source & Mode Selector */}
          <div className="pointer-events-auto bg-travel-card/95 backdrop-blur-md p-1 rounded-xl border border-travel shadow-lg flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMapViewMode('leaflet');
                setMapTileSource((prev) => (prev === 'osm' ? 'voyager' : 'osm'));
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 bg-travel-subtle hover:bg-travel-subtle text-travel-accent border border-travel"
              title={`Switch Tile Layer: currently ${mapTileSource.toUpperCase()}`}
            >
              <Layers className="w-3 h-3" />
              <span className="text-[10px] uppercase font-mono font-bold">{mapTileSource}</span>
            </button>
            <button
              type="button"
              onClick={() => setMapViewMode((prev) => (prev === 'leaflet' ? 'schematic' : 'leaflet'))}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                mapViewMode === 'schematic'
                  ? 'btn-travel-primary'
                  : 'text-travel-muted hover:text-travel-secondary hover:bg-travel-subtle'
              }`}
              title="Toggle Offline Schematic View"
            >
              <Compass className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Schematic</span>
            </button>
          </div>
        </div>
      </div>

      {/* GPS Status / Telemetry Overlay Banner */}
      {isLiveTracking && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto sm:max-w-md z-[400] pointer-events-none">
          <div className="pointer-events-auto bg-travel-card/95 backdrop-blur-md border border-travel px-3 py-1.5 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs">
            {gpsStatus === 'waiting' && (
              <div className="flex items-center gap-2 text-amber-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Waiting for GPS fix...</span>
              </div>
            )}
            {gpsStatus === 'acquired' && liveGps && (
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-300 font-semibold">Live GPS</span>
                  <span className="font-mono text-travel-secondary text-[11px]">
                    {liveGps.lat.toFixed(4)}, {liveGps.lng.toFixed(4)}
                  </span>
                  <span className="text-travel-muted text-[10px]">±{liveGps.accuracy}m</span>
                </div>
                {!followUser && (
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className="text-[11px] font-bold text-travel-accent hover:underline shrink-0"
                  >
                    Resume Follow
                  </button>
                )}
              </div>
            )}
            {gpsStatus === 'low_accuracy' && (
              <div className="flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Low GPS accuracy {liveGps ? `(±${liveGps.accuracy}m)` : ''} — acquiring stronger signal</span>
              </div>
            )}
            {gpsStatus === 'denied' && (
              <div className="flex items-center gap-2 text-rose-300">
                <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Location permission denied in browser</span>
              </div>
            )}
            {(gpsStatus === 'unavailable' || gpsStatus === 'timeout') && (
              <div className="flex items-center gap-2 text-rose-300">
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{gpsError || 'GPS location unavailable'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Map Render Target */}
      {mapViewMode === 'leaflet' && !mapError ? (
        <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0 bg-travel-card" />
      ) : (
        /* Graceful Offline / Vector Schematic Fallback */
        <div
          style={{ height }}
          className="relative w-full bg-travel-card p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(var(--accent-primary) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-travel-accent bg-travel-accent-soft px-3 py-1 rounded-full border border-travel">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Vector Schematic Mode (Tile Stream Inactive)</span>
            </div>
            <button
              onClick={() => {
                setMapError(false);
                setMapViewMode('leaflet');
              }}
              className="text-xs text-travel-muted hover:text-travel-accent flex items-center gap-1 bg-travel-subtle px-2.5 py-1 rounded-lg border border-travel transition"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Live OpenStreetMap Tiles
            </button>
          </div>

          {/* Schematic Waypoints Visual Path or Safe Zones Grid */}
          <div className="relative z-10 my-auto py-4">
            {waypoints.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {waypoints.map((wp, idx) => {
                  const isCompleted = wp.completed;
                  const isNext = wp.isNext;

                  return (
                    <div
                      key={wp.id || idx}
                      onClick={() => setSelectedWaypoint(wp)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 ${
                        selectedWaypoint?.id === wp.id
                          ? 'bg-travel-subtle border-travel-accent ring-2 ring-1 ring-travel-accent'
                          : isNext
                          ? 'bg-travel-accent-soft border-travel hover:border-travel-accent'
                          : isCompleted
                          ? 'bg-travel-subtle border-travel hover:border-travel'
                          : 'bg-travel-subtle/40 border-travel/50 hover:border-travel'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 || wp.isOrigin
                              ? 'btn-travel-primary font-bold'
                              : idx === waypoints.length - 1 || wp.isDestination
                              ? 'bg-emerald-500 text-slate-900 font-extrabold'
                              : isCompleted
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                              : isNext
                              ? 'bg-travel-accent-soft text-travel-accent border border-travel'
                              : 'bg-travel-subtle text-travel-muted'
                          }`}
                        >
                          {idx === 0 || wp.isOrigin
                            ? 'ORIGIN'
                            : idx === waypoints.length - 1 || wp.isDestination
                            ? 'DEST'
                            : `Stop #${idx + 1}`}
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isNext ? (
                          <span className="text-[10px] font-semibold text-travel-accent bg-travel-accent-soft px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-travel-muted" />
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-travel-secondary truncate mb-1" title={wp.title}>
                        {wp.title}
                      </h4>

                      <div className="text-[11px] text-travel-muted flex items-center justify-between">
                        <span>{wp.time || 'Flexible'}</span>
                        <span className="capitalize text-travel-muted">{wp.category || 'Transit'}</span>
                      </div>

                      {wp.coords && (
                        <div className="mt-2 text-[9px] font-mono text-travel-muted truncate">
                          {wp.coords[0].toFixed(3)}°N, {wp.coords[1].toFixed(3)}°E
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : savedZones.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {savedZones.map((zone) => {
                  const isInside = zone.currentStatus === 'inside';
                  const zCoords = zone.coords || [zone.lat, zone.lng];
                  return (
                    <div
                      key={zone.id || zone._id}
                      className={`rounded-xl p-3.5 border transition-all ${
                        isInside
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                          : 'bg-travel-subtle border-travel hover:border-travel'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-travel-accent">
                          {zone.category}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isInside ? 'bg-emerald-500 text-slate-900 font-bold' : 'bg-travel-subtle text-travel-muted'
                          }`}
                        >
                          {isInside ? '● INSIDE PERIMETER' : '○ OUTSIDE'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-travel-primary truncate" title={zone.name}>
                        {zone.name}
                      </h4>

                      <div className="text-[11px] text-travel-muted mt-1 flex items-center justify-between">
                        <span>Radius: {zone.radiusMeters || 250}m</span>
                        <span className="font-mono text-[10px] text-travel-muted">
                          {zCoords && zCoords[0] != null ? `${zCoords[0].toFixed(3)}, ${zCoords[1].toFixed(3)}` : ''}
                        </span>
                      </div>

                      {onSimulateGeofence && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-travel">
                          <button
                            type="button"
                            onClick={() => onSimulateGeofence(zone.id || zone._id, 'ENTRY')}
                            className="flex-1 py-1 rounded-lg btn-travel-primary text-[10px] font-bold transition"
                          >
                            Simulate Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => onSimulateGeofence(zone.id || zone._id, 'EXIT')}
                            className="flex-1 py-1 rounded-lg bg-travel-subtle hover:bg-travel-subtle text-travel-secondary text-[10px] font-bold transition"
                          >
                            Simulate Exit
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <Compass className="w-10 h-10 text-travel-accent/50 mx-auto" />
                <h4 className="text-sm font-bold text-travel-primary">No Coordinates Plotted</h4>
                <p className="text-xs text-travel-muted max-w-sm mx-auto">
                  Use the Search Map input in the top bar to locate places and drop pins with real OpenStreetMap coordinates.
                </p>
              </div>
            )}
          </div>

          {/* Schematic bottom legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-travel-muted border-t border-travel pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-travel-accent"></span> Current Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-travel-muted"></span> Upcoming
              </span>
            </div>

            {liveGps && (
              <div className="text-[11px] text-travel-accent font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
                Device GPS: {liveGps.lat.toFixed(4)}, {liveGps.lng.toFixed(4)} (±{liveGps.accuracy}m)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Waypoint Detail Pill if user clicked marker */}
      {selectedWaypoint && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[400] bg-travel-card backdrop-blur-md p-3.5 rounded-xl border border-travel shadow-2xl animate-fade-in flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-travel-accent bg-travel-accent-soft px-2 py-0.5 rounded border border-travel">
                Stop Detail
              </span>
              <span className="text-xs text-travel-muted">🕒 {selectedWaypoint.time || 'Day schedule'}</span>
            </div>
            <h4 className="text-sm font-bold text-travel-primary">{selectedWaypoint.title}</h4>
            {selectedWaypoint.notes && (
              <p className="text-xs text-travel-secondary mt-1 line-clamp-2">{selectedWaypoint.notes}</p>
            )}
            {selectedWaypoint.coords && (
              <p className="text-[10px] font-mono text-travel-accent mt-1">
                📍 {selectedWaypoint.coords[0].toFixed(4)}, {selectedWaypoint.coords[1].toFixed(4)}
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedWaypoint(null)}
            className="text-travel-muted hover:text-travel-primary text-xs px-2 py-1 rounded bg-travel-subtle"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
