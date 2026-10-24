import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Send,
  Truck,
  RotateCcw,
  Compass,
  Sliders,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Navigation,
  ExternalLink,
} from 'lucide-react';
import type { DumpReport, HeatmapPoint } from './types';
import { DumpPhoto } from './DumpPhoto';

interface HeatmapViewProps {
  dumps: DumpReport[];
  onSelectDump: (dump: DumpReport) => void;
  onOpenGovernmentModal: (dump: DumpReport) => void;
  onOpenSnapModal: () => void;
  onUpdateStatus: (id: string, status: any) => void;
  onRefreshDumps: () => void;
  /** Dump to select and fly to when the map opens (from a globe pin) */
  focusDumpId?: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  dumps,
  onSelectDump,
  onOpenGovernmentModal,
  onOpenSnapModal,
  onUpdateStatus,
  onRefreshDumps,
  focusDumpId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  // Heatmap customization
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showSweeperRoute, setShowSweeperRoute] = useState(false);
  const [heatRadius, setHeatRadius] = useState(45);
  const [heatIntensity, setHeatIntensity] = useState(1.0);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'uncleaned' | 'dispatched' | 'cleaned'>('uncleaned');
  const [selectedDump, setSelectedDump] = useState<DumpReport | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<Array<{ title: string; uri: string; snippets: string[] }>>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);

  // Filtered dumps
  const filteredDumps = dumps.filter((d) => {
    if (severityFilter !== 'all' && d.severity !== severityFilter) return false;
    if (statusFilter === 'uncleaned' && d.status === 'cleaned') return false;
    if (statusFilter === 'dispatched' && d.status !== 'dispatched_to_government') return false;
    if (statusFilter === 'cleaned' && d.status !== 'cleaned') return false;
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on SF / initial coordinates
    const defaultLat = dumps.length > 0 ? dumps[0].location.lat : 37.7749;
    const defaultLng = dumps.length > 0 ? dumps[0].location.lng : -122.4194;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      zoomControl: false,
    });

    // OpenStreetMap's own tiles (CARTO's now need an API key)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Map resize trigger
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showMarkers) return;

    filteredDumps.forEach((dump) => {
      // Color coded by severity/status
      let markerBg = 'bg-amber-500';
      let borderBg = 'border-amber-600';
      if (dump.status === 'cleaned') {
        markerBg = 'bg-emerald-500';
        borderBg = 'border-emerald-600';
      } else if (dump.severity === 'critical') {
        markerBg = 'bg-red-600';
        borderBg = 'border-red-700';
      } else if (dump.severity === 'high') {
        markerBg = 'bg-orange-500';
        borderBg = 'border-orange-600';
      } else if (dump.severity === 'low') {
        markerBg = 'bg-blue-500';
        borderBg = 'border-blue-600';
      }

      const isDispatched = dump.status === 'dispatched_to_government';

      // Custom HTML Marker Pin
      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-8 h-8 rounded-full ${markerBg} text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white transform hover:scale-110 transition-transform">
            ${dump.severity === 'critical' ? '!' : dump.estimatedWeightKg >= 100 ? `${Math.round(dump.estimatedWeightKg)}kg` : `${dump.estimatedWeightKg}k`}
          </div>
          ${isDispatched ? '<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 border border-white rounded-full flex items-center justify-center text-[8px] text-white font-bold">G</div>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-pin-container',
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([dump.location.lat, dump.location.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedDump(dump);
        setNearbyFacilities([]);
      });

      group.addLayer(marker);
    });
  }, [filteredDumps, showMarkers]);

  // Open a dump picked elsewhere (e.g. a pin on the Home globe)
  useEffect(() => {
    if (!focusDumpId) return;
    const dump = dumps.find((d) => d.id === focusDumpId);
    if (!dump) return;
    setSelectedDump(dump);
    mapInstanceRef.current?.flyTo([dump.location.lat, dump.location.lng], 16);
  }, [focusDumpId, dumps]);

  // Sweeper Route Calculation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (showSweeperRoute && filteredDumps.length > 1) {
      // Sort active uncleaned dumps by severity and proximity (TSP heuristic)
      const activeUncleaned = filteredDumps
        .filter((d) => d.status !== 'cleaned')
        .sort((a, b) => {
          const scoreA = (a.severity === 'critical' ? 3 : a.severity === 'high' ? 2 : 1) * a.estimatedWeightKg;
          const scoreB = (b.severity === 'critical' ? 3 : b.severity === 'high' ? 2 : 1) * b.estimatedWeightKg;
          return scoreB - scoreA;
        });

      if (activeUncleaned.length > 1) {
        const latLngs: L.LatLngExpression[] = activeUncleaned.map((d) => [d.location.lat, d.location.lng]);

        const polyline = L.polyline(latLngs, {
          color: '#2563EB',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
        }).addTo(map);

        routeLayerRef.current = polyline;
      }
    }
  }, [showSweeperRoute, filteredDumps]);

  // Draw Smooth Density Heatmap onto Canvas
  const drawHeatmap = () => {
    const map = mapInstanceRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas || !showHeatmap) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const size = map.getSize();
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter points for heatmap (active dumps contribute to heat)
    const points = filteredDumps.filter((d) => d.status !== 'cleaned');
    if (points.length === 0) return;

    // Create an offscreen canvas for alpha intensity blending
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const radius = heatRadius;

    // 1. Draw radial gradient intensity spots
    points.forEach((dump) => {
      const containerPoint = map.latLngToContainerPoint([dump.location.lat, dump.location.lng]);

      // Weight factor
      let weight = 0.4;
      if (dump.severity === 'critical') weight = 1.0;
      else if (dump.severity === 'high') weight = 0.8;
      else if (dump.severity === 'medium') weight = 0.6;

      const alpha = Math.min(1.0, weight * heatIntensity * 0.7);

      const radGrad = offCtx.createRadialGradient(
        containerPoint.x,
        containerPoint.y,
        0,
        containerPoint.x,
        containerPoint.y,
        radius
      );

      radGrad.addColorStop(0, `rgba(0,0,0,${alpha})`);
      radGrad.addColorStop(0.5, `rgba(0,0,0,${alpha * 0.5})`);
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = radGrad;
      offCtx.beginPath();
      offCtx.arc(containerPoint.x, containerPoint.y, radius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // 2. Colorize alpha channel with Thermal Heatmap Palette
    // Palette lookup gradient
    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const pCtx = paletteCanvas.getContext('2d');
    if (!pCtx) return;

    const pGrad = pCtx.createLinearGradient(0, 0, 256, 1);
    pGrad.addColorStop(0.0, 'rgba(0, 240, 255, 0)');
    pGrad.addColorStop(0.2, 'rgba(0, 255, 128, 0.4)');
    pGrad.addColorStop(0.45, 'rgba(255, 255, 0, 0.7)');
    pGrad.addColorStop(0.7, 'rgba(255, 128, 0, 0.85)');
    pGrad.addColorStop(0.9, 'rgba(255, 20, 20, 0.95)');
    pGrad.addColorStop(1.0, 'rgba(180, 0, 0, 1.0)');

    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 256, 1);
    const paletteData = pCtx.getImageData(0, 0, 256, 1).data;

    // Map image data
    const imgData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]; // alpha is the accumulated density
      if (alpha > 0) {
        const offset = alpha * 4;
        data[i] = paletteData[offset]; // R
        data[i + 1] = paletteData[offset + 1]; // G
        data[i + 2] = paletteData[offset + 2]; // B
        data[i + 3] = Math.min(240, Math.floor(paletteData[offset + 3] * (alpha / 255) * 1.4));
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Wire Map Move / Zoom events to re-render heatmap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMapChange = () => {
      drawHeatmap();
    };

    map.on('move', onMapChange);
    map.on('zoom', onMapChange);
    map.on('resize', onMapChange);

    drawHeatmap();

    return () => {
      map.off('move', onMapChange);
      map.off('zoom', onMapChange);
      map.off('resize', onMapChange);
    };
  }, [filteredDumps, showHeatmap, heatRadius, heatIntensity]);

  // Center on current GPS
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocatingUser(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 15);
        }

        // Prompt to seed demo dump cluster around user's location if none exist
        try {
          await fetch('/api/dumps/seed-cluster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, cityName: 'Your Local Area' }),
          });
          onRefreshDumps();
        } catch (e) {
          console.error(e);
        }
      },
      (err) => {
        setLocatingUser(false);
        console.warn('Geolocation error:', err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Preset location jumper
  const handleJumpToPreset = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 14);
    }
  };

  // Metrics for HUD
  const activeCount = filteredDumps.filter((d) => d.status !== 'cleaned').length;
  const criticalCount = filteredDumps.filter((d) => d.severity === 'critical' && d.status !== 'cleaned').length;
  const totalTonnageKg = filteredDumps
    .filter((d) => d.status !== 'cleaned')
    .reduce((acc, cur) => acc + cur.estimatedWeightKg, 0);

  return (
    <div className="relative isolate w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* Map Area */}
      <div className="relative flex-1 h-full">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Canvas density overlay */}
        <canvas
          ref={canvasRef}
          className="density-canvas-layer"
          style={{ display: showHeatmap ? 'block' : 'none' }}
        />

        {/* Top Floating Controls Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Sweeper Density HUD Badge */}
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-md border border-slate-200 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-slate-900 block uppercase tracking-wider">
                  Roadside Sweeper Heatmap
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {activeCount} active dumps · <span className="font-mono font-semibold">{totalTonnageKg} kg</span> accumulated
                </span>
              </div>
            </div>

            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{criticalCount} Critical Hotspots</span>
              </div>
            )}
          </div>

          {/* Quick Tools & Location presets */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={handleUseCurrentLocation}
              disabled={locatingUser}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white/95 hover:bg-slate-50 backdrop-blur-md rounded-lg shadow-sm border border-slate-200 active:scale-95 transition-all"
              title="Locate my position & seed dumps"
            >
              <Compass className={`w-3.5 h-3.5 text-emerald-600 ${locatingUser ? 'animate-spin' : ''}`} />
              <span>{locatingUser ? 'Locating...' : 'My Live Location'}</span>
            </button>

            <button
              onClick={() => handleJumpToPreset(37.7749, -122.4194)}
              className="hidden sm:inline-flex px-2.5 py-2 text-xs font-medium text-slate-700 bg-white/95 hover:bg-slate-50 backdrop-blur-md rounded-lg shadow-sm border border-slate-200"
            >
              San Francisco
            </button>
            <button
              onClick={() => handleJumpToPreset(40.7128, -74.006)}
              className="hidden sm:inline-flex px-2.5 py-2 text-xs font-medium text-slate-700 bg-white/95 hover:bg-slate-50 backdrop-blur-md rounded-lg shadow-sm border border-slate-200"
            >
              New York
            </button>
          </div>
        </div>

        {/* Floating Map Legend & Layer Controls */}
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200 max-w-xs text-xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" /> Layer Controls
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  showHeatmap ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Heatmap
              </button>
              <button
                onClick={() => setShowMarkers(!showMarkers)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  showMarkers ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pins
              </button>
            </div>
          </div>

          {/* Sweeper Route Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showSweeperRoute}
                onChange={(e) => setShowSweeperRoute(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Sweeper Truck Route</span>
            </label>
            <Truck className="w-3.5 h-3.5 text-blue-600" />
          </div>

          {/* Heatmap Radius Slider */}
          {showHeatmap && (
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Density Radius</span>
                <span className="font-mono">{heatRadius}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={heatRadius}
                onChange={(e) => setHeatRadius(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          )}

          {/* Thermal Color Gradient Key */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Dump Severity Gradient</span>
            <div className="h-2.5 rounded-full w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-600" />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Low (scatter)</span>
              <span>Medium</span>
              <span className="text-red-600 font-bold">Critical Dump</span>
            </div>
          </div>
        </div>

        {/* Snap Floating CTA on Mobile */}
        <div className="md:hidden absolute bottom-6 right-4 z-20">
          <button
            onClick={onOpenSnapModal}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar: Selected Dump Detail / Sweeper Priority Feed */}
      <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-80 lg:h-full z-20 overflow-y-auto">
        {selectedDump ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <button
                onClick={() => setSelectedDump(null)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                &larr; Back to all dump sites
              </button>
              <span className="text-xs font-mono text-slate-400">{selectedDump.id}</span>
            </div>

            {/* Photo preview */}
            <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <DumpPhoto
                src={selectedDump.imageUrl}
                alt={selectedDump.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-md bg-black/60">
                {selectedDump.severity} severity
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {selectedDump.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span>{selectedDump.location.address || `${selectedDump.location.lat.toFixed(5)}, ${selectedDump.location.lng.toFixed(5)}`}</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedDump.description}
            </p>

            {/* Metrics strip */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-medium">Estimated Weight</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedDump.estimatedWeightKg} kg</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block font-medium">Hazard Score</span>
                <span className="font-mono font-bold text-red-600 text-sm">{selectedDump.hazardScore} / 10</span>
              </div>
            </div>

            {/* Waste Categories */}
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">Identified Materials</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedDump.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md border border-slate-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* FEATURE 1: SEND TO GOVERNMENT BODY BUTTON */}
            <div className="pt-2 border-t border-slate-100">
              {selectedDump.status === 'dispatched_to_government' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Dispatched to Government Authority</span>
                  </div>
                  <div className="text-[11px] text-blue-800 space-y-0.5 font-mono">
                    <div>Ticket: <span className="font-bold">{selectedDump.governmentDispatch?.ticketNumber}</span></div>
                    <div>Authority: {selectedDump.governmentDispatch?.departmentName}</div>
                    <div>Officer: {selectedDump.governmentDispatch?.assignedOfficer}</div>
                  </div>
                  <button
                    onClick={() => onOpenGovernmentModal(selectedDump)}
                    className="w-full text-center text-xs font-semibold text-blue-700 hover:text-blue-900 underline pt-1 block"
                  >
                    View Official Grievance Dossier & Letter &rarr;
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onOpenGovernmentModal(selectedDump)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Report to Government Body</span>
                </button>
              )}
            </div>

            {/* Sweeper quick status change */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">Sweeper Field Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onUpdateStatus(selectedDump.id, 'in_progress')}
                  className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => onUpdateStatus(selectedDump.id, 'cleaned')}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                >
                  Mark Cleaned
                </button>
              </div>
            </div>

            {/* Google Maps Grounded Nearby Facilities */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Nearby Recycling Centers (Google Maps)
                </span>
                <button
                  onClick={async () => {
                    try {
                      setLoadingFacilities(true);
                      const res = await fetch('/api/nearby-facilities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lat: selectedDump.location.lat,
                          lng: selectedDump.location.lng,
                          address: selectedDump.location.address,
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.places) {
                        setNearbyFacilities(data.places);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setLoadingFacilities(false);
                    }
                  }}
                  disabled={loadingFacilities}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 underline"
                >
                  {loadingFacilities ? 'Searching Maps...' : 'Find Facilities'}
                </button>
              </div>

              {nearbyFacilities.length > 0 && (
                <div className="space-y-2 pt-1">
                  {nearbyFacilities.map((facility, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <a
                        href={facility.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 leading-snug"
                      >
                        <span>{facility.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {facility.snippets && facility.snippets.length > 0 && (
                        <p className="text-[11px] text-slate-600 leading-tight italic">
                          "{facility.snippets[0]}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col h-full">
            {/* Header & Filter Controls */}
            <div className="pb-3 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" /> Sweeper Priority Queue
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500">
                  {filteredDumps.length} sites
                </span>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('uncleaned')}
                  className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
                    statusFilter === 'uncleaned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Active ({dumps.filter((d) => d.status !== 'cleaned').length})
                </button>
                <button
                  onClick={() => setStatusFilter('dispatched')}
                  className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
                    statusFilter === 'dispatched' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  With Gov
                </button>
                <button
                  onClick={() => setStatusFilter('cleaned')}
                  className={`flex-1 py-1 text-center font-medium rounded-md transition-all ${
                    statusFilter === 'cleaned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            {/* List of dumps */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {filteredDumps.map((dump) => (
                <div
                  key={dump.id}
                  onClick={() => setSelectedDump(dump)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-slate-300 hover:shadow-xs ${
                    dump.severity === 'critical'
                      ? 'border-red-200 bg-red-50/40'
                      : dump.status === 'dispatched_to_government'
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <DumpPhoto
                      src={dump.imageUrl}
                      alt={dump.title}
                      className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            dump.severity === 'critical'
                              ? 'text-red-700'
                              : dump.severity === 'high'
                              ? 'text-orange-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {dump.severity} · {dump.estimatedWeightKg}kg
                        </span>
                        {dump.status === 'dispatched_to_government' && (
                          <span className="text-[10px] font-mono font-semibold bg-blue-100 text-blue-700 px-1 rounded">
                            Gov Dispatched
                          </span>
                        )}
                        {dump.status === 'cleaned' && (
                          <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-700 px-1 rounded">
                            Cleaned
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {dump.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {dump.location.address || `${dump.location.lat.toFixed(4)}, ${dump.location.lng.toFixed(4)}`}
                      </p>
                    </div>
                  </div>

                  {/* Immediate report to government shortcut button */}
                  {dump.status !== 'dispatched_to_government' && dump.status !== 'cleaned' && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Needs Clearance</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGovernmentModal(dump);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        <Send className="w-3 h-3" /> Report to Government
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredDumps.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No dump reports match this filter.
                </div>
              )}
            </div>

            {/* Bottom snap dump button */}
            <div className="pt-3 border-t border-slate-200">
              <button
                onClick={onOpenSnapModal}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" /> Snap Geo-Tagged Roadside Dump
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
