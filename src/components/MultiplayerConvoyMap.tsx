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
  Radio,
  Zap,
  Leaf,
  Eye
} from 'lucide-react';

interface MultiplayerConvoyMapProps {
  members: GroupMember[];
  currentMemberId?: string;
  focusedMemberId?: string;
  onSelectMember?: (memberId: string) => void;
  checkpoint?: Checkpoint | null;
  vehicleMode: 'motor' | 'mobil';
  onToggleVehicleMode: (mode: 'motor' | 'mobil') => void;
}

export default function MultiplayerConvoyMap({
  members = [],
  currentMemberId,
  focusedMemberId,
  onSelectMember,
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

  // Selected Rider to view navigation route
  const activeFocusMemberId = focusedMemberId || currentMemberId;

  // Routing Info State
  const [routeInfo, setRouteInfo] = useState<{
    distanceFormatted?: string;
    durationFormatted?: string;
    coordinates?: [number, number][];
  } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const activeFocusMember =
    members.find((m) => m.id === activeFocusMemberId) ||
    members.find((m) => m.id === currentMemberId) ||
    members[0];

  const defaultLat = activeFocusMember?.latitude ?? checkpoint?.latitude ?? -6.2088;
  const defaultLng = activeFocusMember?.longitude ?? checkpoint?.longitude ?? 106.8456;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Road Navigation Route when position or checkpoint or vehicleMode or activeFocusMember changes
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
  }, [activeFocusMember?.id, activeFocusMember?.latitude, activeFocusMember?.longitude, checkpoint?.latitude, checkpoint?.longitude, vehicleMode]);

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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Render Checkpoint Pin (Eco-Gold Flag)
    if (checkpoint) {
      const cpLatLng: [number, number] = [checkpoint.latitude, checkpoint.longitude];
      const checkpointIcon = L.divIcon({
        className: 'custom-checkpoint-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-14 h-14 bg-emerald-400/20 rounded-full animate-ping"></div>
            <div class="relative w-11 h-11 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 border-2 border-white rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.5)] text-slate-950 font-black text-base">
              🚩
            </div>
            <div class="absolute -bottom-2 w-3 h-3 bg-teal-600 rotate-45 border-r border-b border-white"></div>
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
        <div style="font-family: sans-serif; font-size: 13px; color: #042f2e; min-width: 180px;">
          <div style="font-weight: 900; color: #059669; font-size: 14px;">🚩 Titik Tujuan: ${checkpoint.name}</div>
          <div style="font-size: 11px; color: #0f766e; margin-top: 4px;">${checkpoint.description || 'Titik Kumpul / Finish Konvoi'}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">
            ${checkpoint.latitude.toFixed(5)}, ${checkpoint.longitude.toFixed(5)}
          </div>
        </div>
      `);
    }

    // 2. Render SEMUA Anggota Konvoi (Multiplayer Riders)
    const activeMemberIds = new Set(members.map((m) => m.id));
    memberMarkersRef.current.forEach((marker, id) => {
      if (!activeMemberIds.has(id)) {
        map.removeLayer(marker);
        memberMarkersRef.current.delete(id);
      }
    });

    members.forEach((member) => {
      const isMe = member.id === currentMemberId;
      const isFocused = member.id === activeFocusMemberId;
      const latLng: [number, number] = [member.latitude, member.longitude];

      const riderIcon = L.divIcon({
        className: `custom-member-${member.id}`,
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 ${isFocused ? 'bg-emerald-400/50 animate-ping' : isMe ? 'bg-emerald-400/30' : 'bg-teal-400/20'} rounded-full"></div>
            <div class="relative w-10 h-10 ${
              isFocused
                ? 'bg-gradient-to-tr from-emerald-300 via-teal-400 to-cyan-300 text-black border-2 border-white scale-115 shadow-[0_0_30px_rgba(52,211,153,1)]'
                : isMe
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-black border-2 border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-gradient-to-tr from-teal-800 via-emerald-900 to-slate-900 text-white border-2 border-teal-500'
            } rounded-2xl flex items-center justify-center font-black text-xs overflow-hidden transition transform">
              ${
                member.avatar_url
                  ? `<img src="${member.avatar_url}" class="w-full h-full object-cover" />`
                  : isMe
                  ? `<span>Anda</span>`
                  : `<span class="uppercase">${member.name.substring(0, 2)}</span>`
              }
            </div>
            <div class="absolute -bottom-2 w-2.5 h-2.5 ${isFocused || isMe ? 'bg-emerald-400' : 'bg-teal-800'} rotate-45 border-r border-b border-emerald-300"></div>
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
          if (onSelectMember) onSelectMember(member.id);
        });
        memberMarkersRef.current.set(member.id, marker);
      } else {
        marker.setLatLng(latLng);
        marker.setIcon(riderIcon);
      }

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #022c22; min-width: 190px;">
          <div style="font-weight: 900; color: ${isMe ? '#059669' : '#0284c7'}; font-size: 14px;">
            ${isMe ? '👑 (Anda) ' : '🏍️ '}${member.name}
          </div>
          <div style="font-size: 11px; color: #0f766e; margin-bottom: 4px;">${member.motorcycle_model || 'Motor'} • ${member.role}</div>
          <div style="font-size: 12px; margin-bottom: 2px;">⚡ Kecepatan: <b>${member.speed ? Math.round(member.speed) + ' km/h' : '0 km/h'}</b></div>
          <div style="font-size: 12px; margin-bottom: 2px;">🔋 Baterai HP: <b>${member.battery_level ?? '-'}%</b></div>
          <div style="font-size: 11px; color: #475569; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            ${member.address || 'Memuat lokasi...'}
          </div>
        </div>
      `);
    });

    // 3. Render Garis Jalur Tercepat Jalan Raya (OSRM Real Route Polyline)
    if (routeInfo && routeInfo.coordinates && routeInfo.coordinates.length > 0) {
      const routeColor = vehicleMode === 'motor' ? '#10b981' : '#06b6d4';
      
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
  }, [mounted, members, currentMemberId, activeFocusMemberId, checkpoint, routeInfo, vehicleMode, defaultLat, defaultLng]);

  const handleCenterMe = () => {
    const me = members.find((m) => m.id === currentMemberId);
    if (mapInstanceRef.current && me) {
      if (onSelectMember) onSelectMember(me.id);
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
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[660px] bg-[#020604] rounded-3xl overflow-hidden border border-emerald-900/60 shadow-[0_10px_35px_rgba(0,0,0,0.9)]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Toolbar Navigasi di Kanan Atas */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[500] flex flex-col gap-2 items-end">
        {/* Toggle Mode Jalur Motor vs Mobil */}
        <div className="flex bg-[#040c08]/95 backdrop-blur-xl border border-emerald-900/80 p-1 rounded-2xl shadow-xl">
          <button
            onClick={() => onToggleVehicleMode('motor')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              vehicleMode === 'motor'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black shadow-md'
                : 'text-emerald-400/60 hover:text-emerald-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motor</span>
          </button>
          <button
            onClick={() => onToggleVehicleMode('mobil')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              vehicleMode === 'mobil'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-emerald-400/60 hover:text-emerald-200'
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
            className="flex items-center gap-1.5 px-3 py-2 bg-[#040c08]/95 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95 cursor-pointer"
          >
            <Flag className="w-4 h-4 text-emerald-400" />
            <span>Titik Tujuan</span>
          </button>
        )}

        <button
          onClick={handleCenterMe}
          title="Pusatkan ke Posisi Anda"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#040c08]/95 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95 cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span>Posisi Saya</span>
        </button>

        <button
          onClick={handleFitAll}
          title="Lihat Seluruh Anggota Konvoi & Jalur"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#040c08]/90 backdrop-blur border border-emerald-900 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-2xl shadow-xl transition text-xs font-semibold cursor-pointer"
        >
          <Maximize2 className="w-4 h-4 text-emerald-400" />
          <span>Lihat Rute</span>
        </button>
      </div>

      {/* Info Route & ETA Banner di Kiri Atas */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[500] flex flex-col gap-2 max-w-[250px] sm:max-w-[310px]">
        {routeInfo && routeInfo.distanceFormatted ? (
          <div className="bg-[#030906]/95 backdrop-blur-2xl border border-emerald-500/40 p-3 sm:p-3.5 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] space-y-2 animate-in fade-in">
            {/* Header Title */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Navigation2 className="w-3.5 h-3.5 rotate-45 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-black tracking-tight text-emerald-300 truncate">
                  Jalur {isShowingMyRoute ? 'Anda' : activeFocusMember?.name}
                </span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md font-bold font-mono uppercase shrink-0">
                {vehicleMode === 'motor' ? '🏍️ MOTOR' : '🚗 MOBIL'}
              </span>
            </div>

            {/* Metrik Jarak & ETA dalam 2 Kotak Bersih Terpisah */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-950/80">
              <div className="bg-[#020704] border border-emerald-900/60 p-2 rounded-xl text-left">
                <div className="flex items-center gap-1 text-[10px] text-emerald-400/70 font-mono mb-0.5">
                  <Ruler className="w-3 h-3 text-emerald-400" />
                  <span>Jarak</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-white font-mono block truncate">
                  {routeInfo.distanceFormatted}
                </span>
              </div>

              <div className="bg-[#020704] border border-emerald-900/60 p-2 rounded-xl text-left">
                <div className="flex items-center gap-1 text-[10px] text-teal-400/70 font-mono mb-0.5">
                  <Clock className="w-3 h-3 text-teal-400" />
                  <span>Estimasi</span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-teal-300 font-mono block truncate">
                  {routeInfo.durationFormatted}
                </span>
              </div>
            </div>

            {/* Tombol Kembalikan ke Rute Saya jika sedang melihat rider lain */}
            {!isShowingMyRoute && (
              <button
                onClick={handleCenterMe}
                className="w-full py-1 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-[10px] font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Kembali ke Rute Anda</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#030906]/95 backdrop-blur-xl border border-emerald-900/80 rounded-full shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-bold text-emerald-300 font-mono">
              Eco-Convoy Telemetry Active
            </span>
          </div>
        )}
      </div>

      {/* Legend Marker di Kiri Bawah - Rapi & Bersih */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-[500] bg-[#030906]/95 backdrop-blur-xl border border-emerald-900/80 text-xs px-3 py-2 rounded-2xl text-emerald-300 flex items-center gap-3 sm:gap-4 shadow-xl font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 border border-white" />
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200">Anda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-600 to-slate-800 border border-emerald-400" />
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300">Teman</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 border border-white" />
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200">Tujuan</span>
        </div>
      </div>
    </div>
  );
}
