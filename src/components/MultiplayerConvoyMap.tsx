'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GroupMember, Checkpoint } from '@/lib/types';
import {
  Flag,
  Crosshair,
  Maximize2,
  Bike,
  Car,
  Compass,
  Ruler,
  Clock,
  Navigation2,
  Layers,
  Sparkles,
  Radio
} from 'lucide-react';

interface MultiplayerConvoyMapProps {
  members: GroupMember[];
  currentMemberId?: string;
  checkpoint?: Checkpoint | null;
  vehicleMode: 'motor' | 'mobil';
  onToggleVehicleMode: (mode: 'motor' | 'mobil') => void;
}

export default function MultiplayerConvoyMap({
  members = [],
  currentMemberId,
  checkpoint,
  vehicleMode,
  onToggleVehicleMode,
}: MultiplayerConvoyMapProps) {
  const [mounted, setMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const memberMarkersRef = useRef<Map<string, any>>(new Map());
  const checkpointMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Selected Rider to view navigation route (defaults to current viewer)
  const [selectedFocusMemberId, setSelectedFocusMemberId] = useState<string | undefined>(currentMemberId);

  // Routing Info State
  const [routeInfo, setRouteInfo] = useState<{
    distanceFormatted?: string;
    durationFormatted?: string;
    coordinates?: [number, number][];
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (currentMemberId && !selectedFocusMemberId) {
      setSelectedFocusMemberId(currentMemberId);
    }
  }, [currentMemberId, selectedFocusMemberId]);

  const activeFocusMember =
    members.find((m) => m.id === selectedFocusMemberId) ||
    members.find((m) => m.id === currentMemberId) ||
    members[0];

  const defaultLat = activeFocusMember?.latitude ?? checkpoint?.latitude ?? -6.2088;
  const defaultLng = activeFocusMember?.longitude ?? checkpoint?.longitude ?? 106.8456;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch OSRM Road Navigation Route when position or checkpoint or vehicleMode changes
  useEffect(() => {
    if (!activeFocusMember || !checkpoint) return;
    const destLat = checkpoint.latitude;
    const destLng = checkpoint.longitude;
    const fromLat = activeFocusMember.latitude;
    const fromLng = activeFocusMember.longitude;

    async function fetchRoute() {
      setRouteLoading(true);
      try {
        const res = await fetch(
          `/api/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${destLat}&toLng=${destLng}&vehicleMode=${vehicleMode}`
        );
        if (res.ok) {
          const data = await res.json();
          setRouteInfo({
            distanceFormatted: data.distanceFormatted,
            durationFormatted: data.durationFormatted,
            coordinates: data.coordinates
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRouteLoading(false);
      }
    }

    fetchRoute();
  }, [activeFocusMember?.latitude, activeFocusMember?.longitude, checkpoint?.latitude, checkpoint?.longitude, vehicleMode]);

  // Leaflet Map Render
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const L = require('leaflet');

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Render Checkpoint Pin
    if (checkpoint) {
      const cpLatLng: [number, number] = [checkpoint.latitude, checkpoint.longitude];
      const checkpointIcon = L.divIcon({
        className: 'custom-checkpoint-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-14 h-14 bg-amber-400/30 rounded-full animate-ping"></div>
            <div class="relative w-11 h-11 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 border-2 border-white rounded-2xl flex items-center justify-center shadow-2xl text-slate-950 font-black text-base">
              🚩
            </div>
            <div class="absolute -bottom-2 w-3 h-3 bg-red-600 rotate-45 border-r border-b border-white"></div>
          </div>
        `,
        iconSize: [44, 50],
        iconAnchor: [22, 50],
        popupAnchor: [0, -50],
      });

      if (!checkpointMarkerRef.current) {
        checkpointMarkerRef.current = L.marker(cpLatLng, { icon: checkpointIcon }).addTo(map);
      } else {
        checkpointMarkerRef.current.setLatLng(cpLatLng);
        checkpointMarkerRef.current.setIcon(checkpointIcon);
      }

      checkpointMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #78350f; min-width: 180px;">
          <div style="font-weight: 900; color: #b45309; font-size: 14px;">🚩 Titik Tujuan: ${checkpoint.name}</div>
          <div style="font-size: 11px; color: #92400e; margin-top: 4px;">${checkpoint.description || 'Titik Kumpul / Finish Konvoi'}</div>
          <div style="font-size: 10px; color: #a8a29e; margin-top: 4px; font-family: monospace;">
            ${checkpoint.latitude.toFixed(5)}, ${checkpoint.longitude.toFixed(5)}
          </div>
        </div>
      `);
    }

    // 2. Render SEMUA Anggota Konvoi (Multiplayer Riders)
    // Bersihkan marker anggota yang sudah keluar dari grup
    const activeMemberIds = new Set(members.map((m) => m.id));
    memberMarkersRef.current.forEach((marker, id) => {
      if (!activeMemberIds.has(id)) {
        map.removeLayer(marker);
        memberMarkersRef.current.delete(id);
      }
    });

    members.forEach((member) => {
      const isMe = member.id === currentMemberId;
      const isFocused = member.id === selectedFocusMemberId;
      const latLng: [number, number] = [member.latitude, member.longitude];

      const riderIcon = L.divIcon({
        className: `custom-member-${member.id}`,
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 ${isMe ? 'bg-emerald-400/40 animate-pulse' : 'bg-cyan-500/30 animate-ping'} rounded-full"></div>
            <div class="relative w-10 h-10 ${
              isMe
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500'
                : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500'
            } border-2 ${isFocused ? 'border-amber-400 scale-110' : 'border-white'} rounded-2xl flex items-center justify-center shadow-2xl text-white font-black text-xs overflow-hidden transition transform">
              ${
                member.avatar_url
                  ? `<img src="${member.avatar_url}" class="w-full h-full object-cover" />`
                  : isMe
                  ? `<span>Anda</span>`
                  : `<span class="uppercase">${member.name.substring(0, 2)}</span>`
              }
            </div>
            <div class="absolute -bottom-2 w-2.5 h-2.5 ${isMe ? 'bg-emerald-700' : 'bg-indigo-700'} rotate-45 border-r border-b border-white"></div>
          </div>
        `,
        iconSize: [40, 46],
        iconAnchor: [20, 46],
        popupAnchor: [0, -46],
      });

      let marker = memberMarkersRef.current.get(member.id);
      if (!marker) {
        marker = L.marker(latLng, { icon: riderIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedFocusMemberId(member.id);
        });
        memberMarkersRef.current.set(member.id, marker);
      } else {
        marker.setLatLng(latLng);
        marker.setIcon(riderIcon);
      }

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; min-width: 190px;">
          <div style="font-weight: 900; color: ${isMe ? '#047857' : '#0284c7'}; font-size: 14px;">
            ${isMe ? '👑 (Anda) ' : '🏍️ '}${member.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${member.motorcycle_model || 'Motor'} • ${member.role}</div>
          <div style="font-size: 12px; margin-bottom: 2px;">⚡ Kecepatan: <b>${member.speed ? Math.round(member.speed) + ' km/h' : '0 km/h'}</b></div>
          <div style="font-size: 12px; margin-bottom: 2px;">🔋 Baterai HP: <b>${member.battery_level ?? '-'}%</b></div>
          <div style="font-size: 11px; color: #475569; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            ${member.address || 'Memuat jalan...'}
          </div>
        </div>
      `);
    });

    // 3. Render Garis Jalur Tercepat Jalan Raya (OSRM Real Route Polyline)
    if (routeInfo && routeInfo.coordinates && routeInfo.coordinates.length > 0) {
      const routeColor = vehicleMode === 'motor' ? '#06b6d4' : '#6366f1';
      
      if (!routePolylineRef.current) {
        routePolylineRef.current = L.polyline(routeInfo.coordinates, {
          color: routeColor,
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
        }).addTo(map);
      } else {
        routePolylineRef.current.setLatLngs(routeInfo.coordinates);
        routePolylineRef.current.setStyle({ color: routeColor });
      }
    }
  }, [mounted, members, currentMemberId, selectedFocusMemberId, checkpoint, routeInfo, vehicleMode, defaultLat, defaultLng]);

  const handleCenterMe = () => {
    const me = members.find((m) => m.id === currentMemberId);
    if (mapInstanceRef.current && me) {
      setSelectedFocusMemberId(me.id);
      mapInstanceRef.current.setView([me.latitude, me.longitude], 16, { animate: true });
      const marker = memberMarkersRef.current.get(me.id);
      if (marker) marker.openPopup();
    } else {
      alert('Lokasi GPS Anda belum aktif.');
    }
  };

  const handleCenterCheckpoint = () => {
    if (mapInstanceRef.current && checkpoint) {
      mapInstanceRef.current.setView([checkpoint.latitude, checkpoint.longitude], 16, { animate: true });
      if (checkpointMarkerRef.current) checkpointMarkerRef.current.openPopup();
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const L = require('leaflet');
    const pts: [number, number][] = [];
    members.forEach((m) => pts.push([m.latitude, m.longitude]));
    if (checkpoint) pts.push([checkpoint.latitude, checkpoint.longitude]);
    if (routeInfo && routeInfo.coordinates) {
      routeInfo.coordinates.forEach((c) => pts.push(c));
    }

    if (pts.length > 0) {
      const bounds = L.latLngBounds(pts);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const isShowingMyRoute = activeFocusMember?.id === currentMemberId;

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[660px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Toolbar Navigasi di Kanan Atas */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Toggle Mode Jalur Motor vs Mobil */}
        <div className="flex bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-1 rounded-2xl shadow-xl">
          <button
            onClick={() => onToggleVehicleMode('motor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              vehicleMode === 'motor'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motor</span>
          </button>
          <button
            onClick={() => onToggleVehicleMode('mobil')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              vehicleMode === 'mobil'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Mobil</span>
          </button>
        </div>

        {checkpoint && (
          <button
            onClick={handleCenterCheckpoint}
            title="Pusatkan ke Titik Tujuan"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 text-amber-300 hover:text-white hover:bg-amber-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95"
          >
            <Flag className="w-4 h-4 text-amber-400" />
            <span>Titik Tujuan</span>
          </button>
        )}

        <button
          onClick={handleCenterMe}
          title="Pusatkan ke Posisi Anda"
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Posisi Saya</span>
        </button>

        <button
          onClick={handleFitAll}
          title="Lihat Seluruh Anggota Konvoi & Jalur"
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-2xl shadow-xl transition text-xs font-semibold"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span>Lihat Rute</span>
        </button>
      </div>

      {/* Info Route & ETA Banner di Kiri Atas */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2 max-w-xs sm:max-w-sm">
        {/* Banner Navigasi Rute Tercepat */}
        {routeInfo && routeInfo.distanceFormatted ? (
          <div className="bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 p-3 rounded-2xl shadow-2xl space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-cyan-400">
                <Navigation2 className="w-3.5 h-3.5 rotate-45" />
                <span>
                  Jalur {isShowingMyRoute ? 'Anda' : activeFocusMember?.name} ({vehicleMode === 'motor' ? '🏍️ Motor' : '🚗 Mobil'})
                </span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.2 rounded-full font-bold">
                JALUR TERCEPAT
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Ruler className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-white font-mono">{routeInfo.distanceFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-amber-300 font-mono">ETA: {routeInfo.durationFormatted}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-full shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-200">
              Multiplayer Convoy GPS Active
            </span>
          </div>
        )}
      </div>

      {/* Legend Marker di Kiri Bawah */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-950/90 backdrop-blur border border-slate-800 text-xs px-3.5 py-2.5 rounded-2xl text-slate-300 flex flex-wrap items-center gap-4 shadow-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">👑 Anda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">🏍️ Teman Konvoi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">🚩 Checkpoint</span>
        </div>
      </div>
    </div>
  );
}
