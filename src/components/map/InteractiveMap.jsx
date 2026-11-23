import React, { useEffect, useRef, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { searchLocation, getCurrentBrowserPosition } from '../../services/geocoding';

// Fix for default Leaflet marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function InteractiveMap({
  waypoints = [],
  savedZones = [],
  onSimulateGeofence = null,
  center = null,
  zoom = 13,
  currentLocation = null,
  height = '460px',
  interactive = true,
  destinationTitle = 'Expedition Route Map',
  onLocationSelect = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const searchMarkerRef = useRef(null);
  const liveLocationMarkerRef = useRef(null);

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

  // Geolocation State
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [userGpsPosition, setUserGpsPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  // Calculate default center if not explicitly provided
  const resolvedCenter = React.useMemo(() => {
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
    // Neutral global overview center when no coords are known yet
    return [28.6139, 77.2090]; // Default New Delhi or neutral capital
  }, [center, waypoints, savedZones]);

  // Handle Geocoding Search Input with debounce
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

  // Select Search Location Result
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
            background: #0d9488;
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
          <div style="font-size: 10px; font-weight: 800; color: #2dd4bf; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
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

  // Explicit Browser Geolocation Request
  const handleLocateUser = async () => {
    setIsLocatingUser(true);
    setGpsError(null);

    try {
      const pos = await getCurrentBrowserPosition();
      setUserGpsPosition(pos);

      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        map.flyTo(pos.coords, 15, { duration: 1.2 });

        if (liveLocationMarkerRef.current) {
          liveLocationMarkerRef.current.remove();
        }

        const gpsDivIcon = L.divIcon({
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(20, 184, 166, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 16px; height: 16px; border-radius: 9999px; background: #06b6d4; border: 3px solid #ffffff; box-shadow: 0 0 14px #06b6d4;"></div>
            </div>
          `,
          className: 'user-gps-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -16],
        });

        const marker = L.marker(pos.coords, { icon: gpsDivIcon }).addTo(map);
        marker.bindPopup(`
          <div style="min-width: 170px; padding: 4px;">
            <div style="font-size: 10px; font-weight: 800; color: #38bdf8; text-transform: uppercase; margin-bottom: 2px;">
              📡 Live GPS Telemetry
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #ffffff;">
              Current Device Location
            </div>
            <div style="font-size: 11px; color: #94a3b8; font-mono; margin-top: 4px;">
              ${pos.lat.toFixed(5)}°N, ${pos.lng.toFixed(5)}°E
            </div>
            <div style="font-size: 10px; color: #6ee7b7; margin-top: 2px;">
              Accuracy: ±${Math.round(pos.accuracy)}m
            </div>
          </div>
        `).openPopup();

        liveLocationMarkerRef.current = marker;
      }
    } catch (err) {
      setGpsError(err.message || 'Unable to retrieve location.');
      setTimeout(() => setGpsError(null), 5000);
    } finally {
      setIsLocatingUser(false);
    }
  };

  // Initialize and update Leaflet map
  useEffect(() => {
    if (mapViewMode !== 'leaflet') return;
    if (!mapContainerRef.current) return;

    // Remove existing map instance cleanly
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: resolvedCenter,
        zoom: zoom,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Real OpenStreetMap Tiles with required attribution
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
      });

      tileLayer.on('tileerror', () => {
        setMapError(false);
      });

      tileLayer.addTo(map);

      // Feature Group for all markers to calculate bounds
      const boundsLatLngs = [];

      // 1. Plot Waypoints
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
          bg = '#0d9488';
          borderColor = '#2dd4bf';
          label = 'START';
          role = 'Origin';
        } else if (isDestination) {
          bg = '#059669';
          borderColor = '#6ee7b7';
          label = 'DEST';
          role = 'Destination';
        } else if (isCompleted) {
          bg = '#10b981';
          borderColor = '#a7f3d0';
        } else if (isNext) {
          bg = '#0284c7';
          borderColor = '#38bdf8';
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
            transition: transform 0.2s;
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

        const marker = L.marker(wp.coords, { icon: customIcon }).addTo(map);

        const popupContent = `
          <div style="min-width: 190px; padding: 4px;">
            <div style="font-size: 10px; text-transform: uppercase; color: ${
              isOrigin ? '#2dd4bf' : isDestination ? '#34d399' : '#38bdf8'
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

      // Route polyline connecting waypoints with coordinates
      if (boundsLatLngs.length > 1) {
        const polyline = L.polyline(boundsLatLngs, {
          color: '#14b8a6',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          lineCap: 'round',
        }).addTo(map);
        routeLayerRef.current = polyline;
      }

      // 2. Plot Saved Geofence Zones (if any)
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

          let zoneColor = '#14b8a6'; // teal
          if (zone.category === 'Checkpoint' || zone.category === 'Emergency') zoneColor = '#f43f5e';
          else if (zone.category === 'Hotel' || zone.category === 'Lodging') zoneColor = '#06b6d4';
          else if (zone.category === 'Tourist Spot' || zone.category === 'Sights') zoneColor = '#a855f7';
          else if (zone.category === 'Dining') zoneColor = '#f59e0b';
          else if (zone.category === 'Transit Hub' || zone.category === 'Transit') zoneColor = '#10b981';

          // Circle perimeter
          L.circle(zoneCoords, {
            radius: radius,
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: isInside ? 0.3 : 0.12,
            weight: isInside ? 2.5 : 1.5,
            dashArray: isInside ? null : '5, 5',
          }).addTo(map);

          // Marker icon
          const zoneMarkerHtml = `
            <div style="
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 4px 8px;
              border-radius: 9999px;
              background: #0b1120;
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

          const zoneMarker = L.marker(zoneCoords, { icon: zoneDivIcon }).addTo(map);

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
                  }" style="flex: 1; padding: 5px 8px; border-radius: 6px; background: #0d9488; color: #ffffff; font-size: 11px; font-weight: 700; border: none; cursor: pointer;">
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

        // Popup action handler for simulate entry / exit
        map.on('popupopen', (e) => {
          const popupContainer = e.popup?._container;
          if (!popupContainer) return;
          const entryBtn = popupContainer.querySelector('[data-action="simulate-entry"]');
          const exitBtn = popupContainer.querySelector('[data-action="simulate-exit"]');
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
        });
      }

      // 3. Optional Current Location telemetry marker
      if (currentLocation && currentLocation.coords && currentLocation.coords.length === 2) {
        boundsLatLngs.push(currentLocation.coords);
        const radarHtml = `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -8px; border-radius: 9999px; background: rgba(20, 184, 166, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 10px #06b6d4;"></div>
          </div>
        `;

        const radarIcon = L.divIcon({
          html: radarHtml,
          className: 'current-pos-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -14],
        });

        const currentMarker = L.marker(currentLocation.coords, { icon: radarIcon }).addTo(map);
        currentMarker.bindPopup(`
          <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">
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

      // Auto-fit bounds if we have 2 or more points
      if (boundsLatLngs.length > 1) {
        map.fitBounds(L.latLngBounds(boundsLatLngs), { padding: [40, 40], maxZoom: 16 });
      } else if (boundsLatLngs.length === 1) {
        map.setView(boundsLatLngs[0], 14);
      }

      // Invalidate size on mount to prevent gray tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      mapInstanceRef.current = map;
    } catch (err) {
      console.warn('Leaflet map initialization error, falling back to schematic:', err);
      setMapError(true);
      setMapViewMode('schematic');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [resolvedCenter, zoom, waypoints, savedZones, currentLocation, mapViewMode, mapTileSource, onSimulateGeofence]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0c1322] shadow-xl group">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Destination & Stops Pill */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Navigation className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate max-w-[160px] sm:max-w-xs">{destinationTitle}</span>
          <span className="hidden sm:inline-block text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">
            {waypoints.length} Stop{waypoints.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Right Controls: Geocoding Search, Geolocation, Tile Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          {/* Geocoding Search Bar Toggle */}
          <div className="relative">
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/70 shadow-lg p-1">
              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                className={`p-1.5 rounded-lg text-xs transition flex items-center gap-1 ${
                  searchOpen
                    ? 'bg-teal-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
                    className="w-36 sm:w-48 bg-slate-800 text-white placeholder-slate-400 text-xs px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-400"
                  />
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {/* Geocoding Autocomplete Results Menu */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-1.5 z-[500] space-y-1 max-h-64 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 px-2 py-1">
                  OpenStreetMap Places
                </div>
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800/90 text-xs transition flex flex-col gap-0.5 group"
                  >
                    <span className="font-bold text-white group-hover:text-teal-300 flex items-center justify-between">
                      <span className="truncate">{res.name}</span>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                        {res.type || 'place'}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">{res.displayName}</span>
                    <span className="text-[9px] font-mono text-teal-400/80">
                      {res.lat.toFixed(4)}, {res.lng.toFixed(4)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Locate Me (Browser Geolocation) Button */}
          <button
            type="button"
            onClick={handleLocateUser}
            disabled={isLocatingUser}
            className={`pointer-events-auto p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-lg text-xs font-medium transition flex items-center gap-1.5 ${
              isLocatingUser
                ? 'text-teal-400 animate-pulse'
                : 'text-slate-300 hover:text-teal-300 hover:bg-slate-800'
            }`}
            title="Use my device GPS location"
          >
            {isLocatingUser ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="hidden lg:inline text-[11px]">Locate Me</span>
          </button>

          {/* Tile Source & Mode Selector */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/70 shadow-lg flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMapViewMode('leaflet');
                setMapTileSource((prev) => (prev === 'osm' ? 'voyager' : 'osm'));
              }}
              className="px-2 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30"
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
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle Offline Schematic View"
            >
              <Compass className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Schematic</span>
            </button>
          </div>
        </div>
      </div>

      {/* GPS Error Alert Banner */}
      {gpsError && (
        <div className="absolute top-14 left-3 right-3 z-[400] bg-rose-950/90 backdrop-blur-md border border-rose-500/50 text-rose-200 text-xs p-2.5 rounded-xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
          <button onClick={() => setGpsError(null)} className="text-rose-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Main Map Render Target */}
      {mapViewMode === 'leaflet' && !mapError ? (
        <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0 bg-[#0c1322]" />
      ) : (
        /* Graceful Offline / Vector Schematic Fallback */
        <div
          style={{ height }}
          className="relative w-full bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#131d33] p-6 flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(#14b8a6 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Vector Schematic Mode (Tile Stream Inactive)</span>
            </div>
            <button
              onClick={() => {
                setMapError(false);
                setMapViewMode('leaflet');
              }}
              className="text-xs text-slate-400 hover:text-teal-400 flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 transition"
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
                          ? 'bg-slate-800 border-teal-400 ring-2 ring-teal-500/30'
                          : isNext
                          ? 'bg-teal-950/40 border-teal-500/50 hover:border-teal-400'
                          : isCompleted
                          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                          : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 || wp.isOrigin
                              ? 'bg-teal-500 text-slate-950 font-extrabold'
                              : idx === waypoints.length - 1 || wp.isDestination
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : isCompleted
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                              : isNext
                              ? 'bg-teal-900/60 text-teal-300 border border-teal-500/30'
                              : 'bg-slate-800 text-slate-400'
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
                          <span className="text-[10px] font-semibold text-teal-300 bg-teal-500/20 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 truncate mb-1" title={wp.title}>
                        {wp.title}
                      </h4>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{wp.time || 'Flexible'}</span>
                        <span className="capitalize text-slate-500">{wp.category || 'Transit'}</span>
                      </div>

                      {wp.coords && (
                        <div className="mt-2 text-[9px] font-mono text-slate-500 truncate">
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
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                          {zone.category}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            isInside ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isInside ? '● INSIDE PERIMETER' : '○ OUTSIDE'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate" title={zone.name}>
                        {zone.name}
                      </h4>

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>Radius: {zone.radiusMeters || 250}m</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {zCoords && zCoords[0] != null ? `${zCoords[0].toFixed(3)}, ${zCoords[1].toFixed(3)}` : ''}
                        </span>
                      </div>

                      {onSimulateGeofence && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => onSimulateGeofence(zone.id || zone._id, 'ENTRY')}
                            className="flex-1 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition"
                          >
                            Simulate Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => onSimulateGeofence(zone.id || zone._id, 'EXIT')}
                            className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition"
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
                <Compass className="w-10 h-10 text-teal-400/50 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Coordinates Plotted</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Use the Search Map input in the top bar to locate places and drop pins with real OpenStreetMap coordinates.
                </p>
              </div>
            )}
          </div>

          {/* Schematic bottom legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> Current Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Upcoming
              </span>
            </div>

            {userGpsPosition && (
              <div className="text-[11px] text-teal-300 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                Device GPS: {userGpsPosition.lat.toFixed(4)}, {userGpsPosition.lng.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Waypoint Detail Pill if user clicked marker */}
      {selectedWaypoint && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-[400] bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-teal-500/40 shadow-2xl animate-fade-in flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Stop Detail
              </span>
              <span className="text-xs text-slate-400">🕒 {selectedWaypoint.time || 'Day schedule'}</span>
            </div>
            <h4 className="text-sm font-bold text-white">{selectedWaypoint.title}</h4>
            {selectedWaypoint.notes && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{selectedWaypoint.notes}</p>
            )}
            {selectedWaypoint.coords && (
              <p className="text-[10px] font-mono text-teal-400 mt-1">
                📍 {selectedWaypoint.coords[0].toFixed(4)}, {selectedWaypoint.coords[1].toFixed(4)}
              </p>
            )}
          </div>
          <button
            onClick={() => setSelectedWaypoint(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
