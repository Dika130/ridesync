'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RiderLocation, Rider, Checkpoint } from '@/lib/types';
import { Flag, Navigation, Crosshair, Maximize2, Bike, Ruler, Compass } from 'lucide-react';

interface ConvoyMapViewerProps {
  riderLocation?: RiderLocation;
  rider?: Rider;
  routeHistory?: [number, number][];
  captainLocation?: { latitude: number; longitude: number; accuracy?: number };
  checkpoint?: Checkpoint | null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ConvoyMapViewer({
  riderLocation,
  rider,
  routeHistory = [],
  captainLocation,
  checkpoint,
}: ConvoyMapViewerProps) {
  const [mounted, setMounted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const riderMarkerRef = useRef<any>(null);
  const captainMarkerRef = useRef<any>(null);
  const checkpointMarkerRef = useRef<any>(null);

  const riderCircleRef = useRef<any>(null);
  const captainCircleRef = useRef<any>(null);

  const polylineRef = useRef<any>(null);
  const lineCaptainToRiderRef = useRef<any>(null);
  const lineRiderToCheckpointRef = useRef<any>(null);

  const defaultLat = riderLocation?.latitude ?? captainLocation?.latitude ?? checkpoint?.latitude ?? -6.7025;
  const defaultLng = riderLocation?.longitude ?? captainLocation?.longitude ?? checkpoint?.longitude ?? 106.9942;

  useEffect(() => {
    setMounted(true);
  }, []);

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

    // 1. Icon Custom Teman Rider (Biru/Cyan dengan Avatar & Motor)
    const riderIcon = L.divIcon({
      className: 'custom-rider-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-cyan-500/30 rounded-full animate-ping"></div>
          <div class="relative w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 border-2 border-white rounded-2xl flex items-center justify-center shadow-2xl text-white font-bold text-xs overflow-hidden">
            ${rider?.avatar_url 
              ? `<img src="${rider.avatar_url}" class="w-full h-full object-cover" />`
              : `<span class="uppercase font-black">${rider?.full_name ? rider.full_name.substring(0, 2) : '🏍️'}</span>`
            }
          </div>
          <div class="absolute -bottom-2 w-2.5 h-2.5 bg-indigo-700 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [40, 46],
      iconAnchor: [20, 46],
      popupAnchor: [0, -46],
    });

    // 2. Icon Custom Road Captain / Anda (Hijau Emerald)
    const captainIcon = L.divIcon({
      className: 'custom-captain-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 bg-emerald-400/40 rounded-full animate-pulse"></div>
          <div class="relative w-10 h-10 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 border-2 border-white rounded-2xl flex items-center justify-center shadow-2xl text-white font-black text-[11px]">
            👑 Anda
          </div>
          <div class="absolute -bottom-2 w-2.5 h-2.5 bg-emerald-700 rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [40, 46],
      iconAnchor: [20, 46],
      popupAnchor: [0, -46],
    });

    // 3. Icon Custom Titik Tujuan / Checkpoint (Bendera Emas / Merah)
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

    // Render Rider Marker
    if (riderLocation) {
      const rLatLng: [number, number] = [riderLocation.latitude, riderLocation.longitude];

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker(rLatLng, { icon: riderIcon }).addTo(map);
      } else {
        riderMarkerRef.current.setLatLng(rLatLng);
        riderMarkerRef.current.setIcon(riderIcon);
      }

      riderMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; min-width: 190px;">
          <div style="font-weight: 900; color: #0284c7; font-size: 14px;">🏍️ ${rider?.full_name || 'Rider Konvoi'}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">${rider?.motorcycle_model || 'Motor'} • ${rider?.role || 'Anggota'}</div>
          <div style="font-size: 12px; margin-bottom: 2px;">⚡ Kecepatan: <b>${riderLocation.speed ? Math.round(riderLocation.speed) + ' km/h' : '0 km/h'}</b></div>
          <div style="font-size: 12px; margin-bottom: 2px;">🔋 Baterai HP: <b>${riderLocation.battery_level ?? '-'}%</b></div>
          <div style="font-size: 11px; color: #475569; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            ${riderLocation.address || 'Memuat jalan...'}
          </div>
        </div>
      `);

      if (riderLocation.accuracy) {
        if (!riderCircleRef.current) {
          riderCircleRef.current = L.circle(rLatLng, {
            radius: riderLocation.accuracy,
            color: '#06b6d4',
            fillColor: '#22d3ee',
            fillOpacity: 0.15,
            weight: 1.5,
          }).addTo(map);
        } else {
          riderCircleRef.current.setLatLng(rLatLng);
          riderCircleRef.current.setRadius(riderLocation.accuracy);
        }
      }

      // Breadcrumbs
      const allPoints = [...routeHistory, rLatLng];
      if (allPoints.length > 1) {
        if (!polylineRef.current) {
          polylineRef.current = L.polyline(allPoints, {
            color: '#0284c7',
            weight: 4,
            opacity: 0.7,
            dashArray: '6, 8',
          }).addTo(map);
        } else {
          polylineRef.current.setLatLngs(allPoints);
        }
      }
    }

    // Render Captain Marker
    if (captainLocation) {
      const cLatLng: [number, number] = [captainLocation.latitude, captainLocation.longitude];

      if (!captainMarkerRef.current) {
        captainMarkerRef.current = L.marker(cLatLng, { icon: captainIcon }).addTo(map);
      } else {
        captainMarkerRef.current.setLatLng(cLatLng);
        captainMarkerRef.current.setIcon(captainIcon);
      }

      captainMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 13px; color: #064e3b; min-width: 170px;">
          <div style="font-weight: 900; color: #047857; font-size: 14px;">👑 Posisi Anda (Road Captain)</div>
          <div style="font-size: 11px; color: #059669; margin-top: 3px;">Akurasi GPS: ±${Math.round(captainLocation.accuracy || 10)}m</div>
        </div>
      `);
    }

    // Render Checkpoint Destination Marker
    if (checkpoint) {
      const cpLatLng: [number, number] = [checkpoint.latitude, checkpoint.longitude];

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

    // Garis Jarak: Captain -> Rider
    if (captainLocation && riderLocation) {
      const cPoints: [number, number][] = [
        [captainLocation.latitude, captainLocation.longitude],
        [riderLocation.latitude, riderLocation.longitude],
      ];
      if (!lineCaptainToRiderRef.current) {
        lineCaptainToRiderRef.current = L.polyline(cPoints, {
          color: '#10b981',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.8,
        }).addTo(map);
      } else {
        lineCaptainToRiderRef.current.setLatLngs(cPoints);
      }
    }

    // Garis Jarak: Rider -> Checkpoint
    if (riderLocation && checkpoint) {
      const rPoints: [number, number][] = [
        [riderLocation.latitude, riderLocation.longitude],
        [checkpoint.latitude, checkpoint.longitude],
      ];
      if (!lineRiderToCheckpointRef.current) {
        lineRiderToCheckpointRef.current = L.polyline(rPoints, {
          color: '#f59e0b',
          weight: 3,
          dashArray: '8, 8',
          opacity: 0.85,
        }).addTo(map);
      } else {
        lineRiderToCheckpointRef.current.setLatLngs(rPoints);
      }
    }
  }, [mounted, riderLocation, rider, routeHistory, captainLocation, checkpoint, defaultLat, defaultLng]);

  const handleCenterRider = () => {
    if (mapInstanceRef.current && riderLocation) {
      mapInstanceRef.current.setView([riderLocation.latitude, riderLocation.longitude], 16, { animate: true });
      if (riderMarkerRef.current) riderMarkerRef.current.openPopup();
    }
  };

  const handleCenterCaptain = () => {
    if (mapInstanceRef.current && captainLocation) {
      mapInstanceRef.current.setView([captainLocation.latitude, captainLocation.longitude], 16, { animate: true });
      if (captainMarkerRef.current) captainMarkerRef.current.openPopup();
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
    const points: [number, number][] = [];
    if (riderLocation) points.push([riderLocation.latitude, riderLocation.longitude]);
    if (captainLocation) points.push([captainLocation.latitude, captainLocation.longitude]);
    if (checkpoint) points.push([checkpoint.latitude, checkpoint.longitude]);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60] });
    }
  };

  const distToCaptain = riderLocation && captainLocation
    ? calculateDistance(captainLocation.latitude, captainLocation.longitude, riderLocation.latitude, riderLocation.longitude)
    : null;

  const distToCheckpoint = riderLocation && checkpoint
    ? calculateDistance(riderLocation.latitude, riderLocation.longitude, checkpoint.latitude, checkpoint.longitude)
    : null;

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[660px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Toolbar Navigasi di Kanan Atas */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
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

        {riderLocation && (
          <button
            onClick={handleCenterRider}
            title="Pusatkan ke Rider Teman"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/50 text-cyan-300 hover:text-white hover:bg-cyan-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95"
          >
            <Bike className="w-4 h-4 text-cyan-400" />
            <span>Rider Teman</span>
          </button>
        )}

        {captainLocation && (
          <button
            onClick={handleCenterCaptain}
            title="Pusatkan ke Lokasi Anda (Road Captain)"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 text-emerald-300 hover:text-white hover:bg-emerald-600 rounded-2xl shadow-xl transition text-xs font-bold transform active:scale-95"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span>Lokasi Anda</span>
          </button>
        )}

        <button
          onClick={handleFitAll}
          title="Lihat Semua Titik Konvoi"
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-300 hover:text-white hover:bg-indigo-600 rounded-2xl shadow-xl transition text-xs font-semibold"
        >
          <Maximize2 className="w-4 h-4 text-indigo-400" />
          <span>Lihat Rute</span>
        </button>
      </div>

      {/* Info Badges di Kiri Atas */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-full shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-200">
            RideSync Convoy GPS Active
          </span>
        </div>

        {checkpoint && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/90 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold shadow-lg backdrop-blur">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span>Tujuan: {checkpoint.name}</span>
          </div>
        )}
      </div>

      {/* Legend Marker di Kiri Bawah */}
      <div className="absolute bottom-4 left-4 z-[500] bg-slate-950/90 backdrop-blur border border-slate-800 text-xs px-3.5 py-2.5 rounded-2xl text-slate-300 flex flex-wrap items-center gap-4 shadow-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">👑 Anda (Captain)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">🏍️ Rider Teman</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-500 to-red-500 border border-white" />
          <span className="text-[11px] font-bold text-slate-300">🚩 Checkpoint</span>
        </div>
      </div>
    </div>
  );
}
