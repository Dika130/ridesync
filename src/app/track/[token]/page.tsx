'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getConvoySessionByToken, saveRiderLocation, getActiveCheckpoint } from '@/lib/supabase';
import { ConvoySession, Checkpoint } from '@/lib/types';
import {
  Bike,
  MapPin,
  Battery,
  BatteryCharging,
  CheckCircle2,
  AlertTriangle,
  Radio,
  StopCircle,
  Play,
  Share2,
  Lock,
  Gauge,
  Flag,
  Ruler,
  Compass
} from 'lucide-react';

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

export default function RiderMobileTrackPage() {
  const params = useParams();
  const token = params?.token as string;

  const [session, setSession] = useState<ConvoySession | null>(null);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Load session data & active checkpoint
  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        const [found, cp] = await Promise.all([
          getConvoySessionByToken(token),
          getActiveCheckpoint()
        ]);

        if (!found) {
          setError('Tautan sesi touring tidak valid atau telah kedaluwarsa.');
        } else {
          setSession(found);
        }

        if (cp) setCheckpoint(cp);
      } catch (err: any) {
        setError('Gagal memuat informasi sesi touring.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // Read Battery API
  useEffect(() => {
    async function initBattery() {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setBatteryPct(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryPct(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        } catch (e) {
          console.warn('Battery API warning:', e);
        }
      }
    }

    initBattery();
  }, []);

  const handleStartSharing = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Perangkat Anda tidak mendukung Geolocation.');
      return;
    }

    setIsSharing(true);

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = pos.coords.accuracy;
      const speed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;

      setCurrentCoords({ lat, lng, accuracy, speed });

      // Geocoding
      let address = '';
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (res.ok) {
          const data = await res.json();
          address = data.address || '';
          setCurrentAddress(address);
        }
      } catch (e) {}

      // Battery
      let currentBattery = batteryPct;
      let currentCharging = isCharging;
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const b = await (navigator as any).getBattery();
          currentBattery = Math.round(b.level * 100);
          currentCharging = b.charging;
          setBatteryPct(currentBattery);
          setIsCharging(currentCharging);
        } catch (e) {}
      }

      if (session) {
        await saveRiderLocation({
          session_id: session.id,
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading: pos.coords.heading || undefined,
          altitude: pos.coords.altitude || undefined,
          battery_level: currentBattery ?? undefined,
          is_charging: currentCharging,
          address: address || undefined,
          created_at: new Date().toISOString()
        });
        setLastSentTime(new Date().toLocaleTimeString('id-ID'));
      }
    };

    const onLocationError = async (err: GeolocationPositionError) => {
      console.warn('GPS High Accuracy timeout/error, fallback standar:', err);

      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.latitude && ipData.longitude) {
            const fakePos: any = {
              coords: {
                latitude: ipData.latitude,
                longitude: ipData.longitude,
                accuracy: 500,
                speed: 0,
                heading: null,
                altitude: null
              }
            };
            await onLocationSuccess(fakePos);
            return;
          }
        }
      } catch (e) {}

      alert(`Akses GPS: ${err.message}. Pastikan izin lokasi browser telah diizinkan.`);
      setIsSharing(false);
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      () => {
        navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 10000
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    const watchId = navigator.geolocation.watchPosition(
      onLocationSuccess,
      (err) => console.warn('Watch position warning:', err),
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 5000
      }
    );

    watchIdRef.current = watchId;
  };

  const handleStopSharing = async () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsSharing(false);

    if (session && currentCoords) {
      try {
        await saveRiderLocation({
          session_id: session.id,
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          accuracy: currentCoords.accuracy,
          speed: 0,
          battery_level: batteryPct ?? undefined,
          is_charging: isCharging,
          address: currentAddress ? `[Berhenti Berbagi] ${currentAddress}` : '[Rider Berhenti Berbagi]',
          created_at: new Date(0).toISOString()
        });
      } catch (e) {}
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Menghubungkan ke Sesi Touring RideSync...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Sesi Touring Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'Tautan pelacakan telah kedaluwarsa atau tidak valid.'}
          </p>
        </div>
      </div>
    );
  }

  const rider = session.rider;

  const distanceToCheckpoint = currentCoords && checkpoint
    ? calculateDistance(currentCoords.lat, currentCoords.lng, checkpoint.latitude, checkpoint.longitude)
    : null;

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header Branding Touring */}
        <div className="text-center space-y-1.5">
          <div className="w-16 h-16 bg-cyan-600/15 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-950">
            <Bike className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-black text-white">RideSync Convoy GPS</h1>
          <p className="text-xs text-slate-400">
            Konvoi: <b className="text-cyan-400">{session.convoy_name}</b> • Captain: <b className="text-slate-200">{session.road_captain_name}</b>
          </p>
        </div>

        {/* Profile Rider */}
        {rider && (
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shrink-0 shadow-md">
              {rider.avatar_url ? (
                <img src={rider.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-white text-sm uppercase">
                  {rider.full_name?.substring(0, 2)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm truncate">{rider.full_name}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded-full font-bold">
                  {rider.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-semibold mt-0.5">
                {rider.motorcycle_model || 'Motor Rider'} {rider.license_plate ? `(${rider.license_plate})` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Info Titik Tujuan Checkpoint */}
        {checkpoint && (
          <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <Flag className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Tujuan: {checkpoint.name}</span>
            </div>
            {distanceToCheckpoint !== null && (
              <span className="text-xs font-black text-amber-300 font-mono shrink-0">
                {distanceToCheckpoint < 1 ? `${Math.round(distanceToCheckpoint * 1000)} m` : `${distanceToCheckpoint.toFixed(1)} km`}
              </span>
            )}
          </div>
        )}

        {/* Live GPS Sharing State */}
        {isSharing ? (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>GPS Konvoi Aktif Terhubung</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-300">
                {isCharging ? <BatteryCharging className="w-3.5 h-3.5 text-amber-400" /> : <Battery className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{batteryPct !== null ? `${batteryPct}%` : '-'}</span>
              </div>
            </div>

            {/* Speedometer & Stats */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Kecepatan Anda</span>
                <span className="text-base font-black text-cyan-400 font-mono">
                  {currentCoords?.speed ? Math.round(currentCoords.speed) : 0} <span className="text-xs font-normal">km/h</span>
                </span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Akurasi GPS</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ±{currentCoords?.accuracy ? Math.round(currentCoords.accuracy) : 5} <span className="text-xs font-normal">m</span>
                </span>
              </div>
            </div>

            {currentAddress && (
              <div className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Jalan Saat Ini:</span>
                {currentAddress}
              </div>
            )}

            <button
              onClick={handleStopSharing}
              className="w-full py-2.5 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              <span>Hentikan Berbagi GPS</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-950/50 border border-slate-800 p-3.5 rounded-2xl space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Navigasi Konvoi Terproteksi</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tekan tombol di bawah untuk membagikan kecepatan dan lokasi motor Anda secara live ke Road Captain konvoi.
              </p>
            </div>

            <button
              onClick={handleStartSharing}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-cyan-950 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Mulai Berbagi GPS Touring</span>
            </button>
          </div>
        )}

        <div className="text-center pt-1">
          <span className="text-[10px] text-slate-600">
            RideSync &copy; 2026 • Real-Time Convoy Tracking Platform
          </span>
        </div>
      </div>
    </main>
  );
}
