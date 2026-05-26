import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

export default function InteractiveMap({ 
  pickup = 'Powai Vihar', 
  destination = 'IIT Bombay', 
  onSelectLocations,
  height = '350px',
  interactive = false
}) {
  const [mapType, setMapType] = useState(window.L ? 'leaflet' : 'vector'); // Default to live leaflet map if loaded
  const [carPosition, setCarPosition] = useState(0); // 0 to 100 percentage for animated route
  const leafletMapRef = useRef(null);
  const mapContainerId = useRef(`map-${Math.random().toString(36).substr(2, 9)}`);

  // Animate car position on the vector map
  useEffect(() => {
    const interval = setInterval(() => {
      setCarPosition((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Initialize Leaflet map if selected
  useEffect(() => {
    let active = true;

    if (mapType === 'leaflet' && window.L) {
      try {
        // Clear previous instance
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }

        // Center around Mumbai initially
        const centerCoords = [19.1256, 72.9156];
        const map = window.L.map(mapContainerId.current).setView(centerCoords, 13);
        leafletMapRef.current = map;

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom modern icons
        const pickIcon = window.L.divIcon({
          html: `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: #ef4444; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white;"><span style="font-size: 14px;">📍</span></div>`,
          className: 'custom-map-marker-pickup',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        const destIcon = window.L.divIcon({
          html: `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 2px solid white;"><span style="font-size: 14px;">🎓</span></div>`,
          className: 'custom-map-marker-dest',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        // Geocoding helper
        const geocode = async () => {
          try {
            // Default mock coordinates (Mumbai)
            let pickLatLng = [19.1230, 72.9080];
            let destLatLng = [19.1330, 72.9150];

            // Try LocationIQ lookups for pickup
            const resPick = await fetch(`https://us1.locationiq.com/v1/search.php?key=pk.481323876891a2b0607386a3ef75c7a0&q=${encodeURIComponent(pickup + ', India')}&format=json`);
            if (resPick.ok) {
              const data = await resPick.json();
              if (data && data[0]) {
                pickLatLng = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              }
            }

            // Try LocationIQ lookups for destination
            const resDest = await fetch(`https://us1.locationiq.com/v1/search.php?key=pk.481323876891a2b0607386a3ef75c7a0&q=${encodeURIComponent(destination + ', India')}&format=json`);
            if (resDest.ok) {
              const data = await resDest.json();
              if (data && data[0]) {
                destLatLng = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              }
            }

            if (!active) return;

            // Render markers and polyline
            const pickupMarker = window.L.marker(pickLatLng, { icon: pickIcon, draggable: interactive })
              .addTo(map)
              .bindPopup(`<b>Pickup:</b> ${pickup}`)
              .openPopup();

            const destMarker = window.L.marker(destLatLng, { icon: destIcon })
              .addTo(map)
              .bindPopup(`<b>Destination:</b> ${destination}`);

            // Fit bounds
            const bounds = window.L.latLngBounds([pickLatLng, destLatLng]);
            map.fitBounds(bounds, { padding: [50, 50] });

            // Draw line
            window.L.polyline([pickLatLng, destLatLng], { color: '#6366f1', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);

            if (interactive && onSelectLocations) {
              pickupMarker.on('dragend', () => {
                const position = pickupMarker.getLatLng();
                onSelectLocations({
                  pickup: `Lat: ${position.lat.toFixed(4)}, Lng: ${position.lng.toFixed(4)}`,
                  destination
                });
              });
            }

          } catch (err) {
            console.error('LocationIQ geocoding failed, using defaults:', err);
            if (!active) return;
            window.L.marker([19.123, 72.908], { icon: pickIcon }).addTo(map).bindPopup(`<b>Pickup:</b> ${pickup}`).openPopup();
            window.L.marker([19.133, 72.915], { icon: destIcon }).addTo(map).bindPopup(`<b>Destination:</b> ${destination}`);
            window.L.polyline([[19.123, 72.908], [19.133, 72.915]], { color: '#6366f1', weight: 5, opacity: 0.9, lineJoin: 'round' }).addTo(map);
          }
        };

        geocode();

      } catch (err) {
        console.error('Leaflet initialization failed:', err);
        setMapType('vector');
      }
    }

    return () => {
      active = false;
    };
  }, [mapType, pickup, destination]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-800 dark:bg-slate-900" style={{ height }}>
      {/* Map Header Selector */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-premium dark:bg-slate-900/95 dark:text-slate-100 pointer-events-auto border border-slate-100 dark:border-slate-800">
          <Navigation size={13} className="text-brand-500 animate-pulse" />
          <span>Active Route View</span>
        </div>

        <div className="flex gap-1 rounded-xl bg-white/95 p-1 shadow-premium dark:bg-slate-900/95 pointer-events-auto border border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setMapType('vector')}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ${
              mapType === 'vector' 
                ? 'bg-brand-500 text-white' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Schematic
          </button>
          <button
            onClick={() => {
              if (window.L) {
                setMapType('leaflet');
              } else {
                alert('Leaflet Map is currently offline. Using interactive Vector Map instead.');
              }
            }}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all duration-200 ${
              mapType === 'leaflet' 
                ? 'bg-brand-500 text-white' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Live Map
          </button>
        </div>
      </div>

      {/* RENDER ENGINE 1: LEAFLET MAP */}
      {mapType === 'leaflet' && (
        <div id={mapContainerId.current} className="w-full h-full z-10"></div>
      )}

      {/* RENDER ENGINE 2: PREMIUM VECTOR SCHEMATIC MAP */}
      {mapType === 'vector' && (
        <div className="relative w-full h-full bg-[#eef2f6] dark:bg-slate-950 flex items-center justify-center p-4">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

          {/* SVG Map Lines and Roads */}
          <svg className="w-full h-full max-h-[300px] z-10" viewBox="0 0 400 200">
            {/* Sector Parks */}
            <rect x="20" y="20" width="80" height="50" rx="6" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeOpacity="0.15" />
            <rect x="280" y="120" width="100" height="60" rx="6" fill="#10b981" fillOpacity="0.08" stroke="#10b981" strokeOpacity="0.15" />
            
            {/* Campus Boundary */}
            <rect x="260" y="15" width="120" height="90" rx="10" fill="#3b82f6" fillOpacity="0.03" stroke="#3b82f6" strokeOpacity="0.1" strokeDasharray="4" />
            <text x="320" y="32" textAnchor="middle" className="text-[8px] font-bold fill-brand-500/60 dark:fill-brand-400/50">CAMPUS ZONE</text>

            {/* Road network */}
            <path d="M 40 150 L 160 150 L 160 50 L 320 50 L 320 120" fill="none" stroke="#94a3b8" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-800" />
            <path d="M 40 150 L 160 150 L 160 50 L 320 50 L 320 120" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-600" />
            
            <path d="M 160 150 L 280 150" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" className="dark:stroke-slate-800" />
            <path d="M 320 50 L 380 50" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" className="dark:stroke-slate-800" />

            {/* Route Highlight Path */}
            <path id="ride-route" d="M 40 150 L 160 150 L 160 50 L 320 50" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />

            {/* Landmarks labels */}
            <text x="70" y="175" className="text-[7px] font-bold fill-slate-500 dark:fill-slate-400">Metro Station</text>
            <text x="210" y="165" className="text-[7px] font-bold fill-slate-500 dark:fill-slate-400">Highway Hub</text>
            <text x="320" y="145" className="text-[7px] font-bold fill-slate-500 dark:fill-slate-400">{destination}</text>

            {/* Pickup Landmark */}
            <g transform="translate(40, 150)">
              <circle r="12" fill="#ef4444" fillOpacity="0.15" className="animate-ping" />
              <circle r="6" fill="#ef4444" />
              <circle r="2" fill="#fff" />
            </g>
            <text x="40" y="132" textAnchor="middle" className="text-[8px] font-extrabold fill-red-500 dark:fill-red-400">Pickup: {pickup}</text>

            {/* Destination Landmark */}
            <g transform="translate(320, 50)">
              <circle r="10" fill="#10b981" fillOpacity="0.15" />
              <circle r="6" fill="#10b981" />
              <circle r="2" fill="#fff" />
            </g>
            <text x="320" y="38" textAnchor="middle" className="text-[8px] font-extrabold fill-emerald-500 dark:fill-emerald-400">College Goal</text>

            {/* Animated Car Node */}
            <g transform="translate(40, 150)">
              {/* Path Follower simulation */}
              <animateMotion dur="8s" repeatCount="indefinite" path="M 0 0 L 120 0 L 120 -100 L 280 -100" />
              <circle r="8" fill="#3b82f6" shadow="md" />
              <text y="2.5" textAnchor="middle" className="text-[7px] fill-white">🚗</text>
            </g>
          </svg>

          {/* Location details overlay footer */}
          <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between bg-white/90 p-2.5 rounded-xl shadow-premium border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">From Location</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin size={11} className="text-red-500" /> {pickup}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">College Destination</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                <Compass size={11} className="text-emerald-500" /> {destination}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
