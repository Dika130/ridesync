'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  getConvoySessions,
  createConvoySession,
  deleteConvoySession,
  getActiveCheckpoint,
  saveActiveCheckpoint,
  supabase
} from '@/lib/supabase';
import { ConvoySession, RiderLocation, Rider, Checkpoint } from '@/lib/types';
import RiderCard from '@/components/RiderCard';
import AddRiderModal from '@/components/AddRiderModal';
import CheckpointModal from '@/components/CheckpointModal';
import RiderList from '@/components/RiderList';
import {
  Compass,
  Plus,
  Flag,
  Bike,
  Crosshair,
  Radio,
  MapPin,
  Sparkles,
  Users,
  Shield,
  Ruler,
  Navigation
} from 'lucide-react';

const ConvoyMapViewer = dynamic(() => import('@/components/ConvoyMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[520px] bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-slate-500 border border-slate-800">
      <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-semibold">Memuat Peta Konvoi & Satelit GPS...</span>
    </div>
  ),
});

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

export default function RideSyncDashboard() {
  const [sessions, setSessions] = useState<ConvoySession[]>([]);
  const [activeSession, setActiveSession] = useState<ConvoySession | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RiderLocation | undefined>(undefined);
  const [routeHistory, setRouteHistory] = useState<[number, number][]>([]);

  // Checkpoint Titik Tujuan Konvoi
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);

  // Modals
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);

  // Road Captain (Anda) Live Geolocation
  const [captainLocation, setCaptainLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | undefined>(undefined);
  const [isCaptainLocActive, setIsCaptainLocActive] = useState<boolean>(true);

  // Load Road Captain Location
  useEffect(() => {
    if (!isCaptainLocActive || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCaptainLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.warn('GPS Road Captain warning:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isCaptainLocActive]);

  // Load Initial Data (Sessions & Checkpoint)
  useEffect(() => {
    async function loadData() {
      try {
        const [sData, cpData] = await Promise.all([
          getConvoySessions(),
          getActiveCheckpoint(),
        ]);

        setSessions(sData);
        if (sData.length > 0) {
          setActiveSession(sData[0]);
          if (sData[0].latest_location) {
            setCurrentLocation(sData[0].latest_location);
            setRouteHistory([[sData[0].latest_location.latitude, sData[0].latest_location.longitude]]);
          }
        }

        if (cpData) {
          setActiveCheckpoint(cpData);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadData();
  }, []);

  // Polling / Realtime Rider GPS Sync
  useEffect(() => {
    if (!activeSession) return;

    if (supabase) {
      const channel = supabase
        .channel(`convoy-${activeSession.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'rider_locations',
            filter: `session_id=eq.${activeSession.id}`
          },
          (payload) => {
            const newLog = payload.new as RiderLocation;
            setCurrentLocation(newLog);
            setRouteHistory((prev) => [...prev, [newLog.latitude, newLog.longitude]]);
          }
        )
        .subscribe();

      return () => {
        if (supabase) supabase.removeChannel(channel);
      };
    } else {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/locations?sessionId=${activeSession.id || activeSession.token}`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.latitude && data.longitude) {
              setCurrentLocation(data);
              setRouteHistory((prev) => {
                const last = prev[prev.length - 1];
                if (!last || last[0] !== data.latitude || last[1] !== data.longitude) {
                  return [...prev, [data.latitude, data.longitude]];
                }
                return prev;
              });
            }
          }
        } catch (e) {}
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const handleSelectSession = (session: ConvoySession) => {
    setActiveSession(session);
    if (session.latest_location) {
      setCurrentLocation(session.latest_location);
      setRouteHistory([[session.latest_location.latitude, session.latest_location.longitude]]);
    } else {
      setCurrentLocation(undefined);
      setRouteHistory([]);
    }
  };

  const handleCreateRider = async (riderData: Omit<Rider, 'id'>, convoyName: string, roadCaptainName: string) => {
    const newSession = await createConvoySession(riderData, convoyName, roadCaptainName);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSession(newSession);
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteConvoySession(sessionId);
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId && s.token !== sessionId);
      if (activeSession?.id === sessionId || activeSession?.token === sessionId) {
        const next = updated[0] || null;
        setActiveSession(next);
        if (next?.latest_location) {
          setCurrentLocation(next.latest_location);
          setRouteHistory([[next.latest_location.latitude, next.latest_location.longitude]]);
        } else {
          setCurrentLocation(undefined);
          setRouteHistory([]);
        }
      }
      return updated;
    });
  };

  const handleSaveCheckpoint = async (cp: Checkpoint) => {
    const saved = await saveActiveCheckpoint(cp);
    setActiveCheckpoint(saved);
  };

  const captainToCpDist = captainLocation && activeCheckpoint
    ? calculateDistance(captainLocation.latitude, captainLocation.longitude, activeCheckpoint.latitude, activeCheckpoint.longitude)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">RideSync</h1>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full font-bold">
                  CONVOY GPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Real-Time Motorcycle Convoy & Touring Tracker</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* GPS Road Captain Toggle */}
            <button
              onClick={() => setIsCaptainLocActive(!isCaptainLocActive)}
              title={isCaptainLocActive ? 'GPS Anda Aktif' : 'Aktifkan GPS Anda'}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition ${
                isCaptainLocActive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className={`w-3.5 h-3.5 ${isCaptainLocActive ? 'text-emerald-400' : ''}`} />
              <span>{isCaptainLocActive ? 'GPS Captain: ON' : 'GPS Captain: OFF'}</span>
            </button>

            {/* Set Titik Tujuan Checkpoint */}
            <button
              onClick={() => setIsCheckpointModalOpen(true)}
              className="flex items-center gap-2 py-2 px-3.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-bold transition shadow-lg shadow-amber-950/40"
            >
              <Flag className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Set Titik Tujuan</span>
              <span className="sm:hidden">Tujuan</span>
            </button>

            {/* Tambah Rider Baru */}
            <button
              onClick={() => setIsRiderModalOpen(true)}
              className="flex items-center gap-2 py-2 px-3.5 sm:px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-extrabold shadow-xl shadow-cyan-950 transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rider</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rider Card & Convoy List (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Card Titik Tujuan Aktif */}
          {activeCheckpoint && (
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Titik Tujuan / Finish</span>
                  </div>
                  <h3 className="text-sm font-black text-white truncate">{activeCheckpoint.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeCheckpoint.description || `${activeCheckpoint.latitude.toFixed(4)}, ${activeCheckpoint.longitude.toFixed(4)}`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">Jarak Captain</span>
                <span className="text-xs font-black text-amber-300 font-mono">
                  {captainToCpDist !== null
                    ? captainToCpDist < 1
                      ? `${Math.round(captainToCpDist * 1000)} m`
                      : `${captainToCpDist.toFixed(1)} km`
                    : '-'}
                </span>
              </div>
            </div>
          )}

          {/* Panel Rider Terpilih */}
          {activeSession ? (
            <RiderCard
              session={activeSession}
              location={currentLocation}
              captainLocation={captainLocation}
              checkpoint={activeCheckpoint}
            />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-sm font-medium">Pilih rider atau daftarkan anggota baru untuk mulai memantau.</p>
            </div>
          )}

          {/* Sesi Anggota Konvoi */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Anggota Konvoi Motor ({sessions.length})</span>
              </div>
            </div>

            <RiderList
              sessions={sessions}
              activeSessionId={activeSession?.id}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
            />
          </div>
        </section>

        {/* Right Column: Live Map (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex-1 h-full min-h-[500px] lg:min-h-[660px]">
            <ConvoyMapViewer
              riderLocation={currentLocation}
              rider={activeSession?.rider}
              routeHistory={routeHistory}
              captainLocation={isCaptainLocActive ? captainLocation : undefined}
              checkpoint={activeCheckpoint}
            />
          </div>
        </section>
      </main>

      {/* Modals */}
      <AddRiderModal
        isOpen={isRiderModalOpen}
        onClose={() => setIsRiderModalOpen(false)}
        onSubmit={handleCreateRider}
      />

      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        currentCheckpoint={activeCheckpoint}
        onSave={handleSaveCheckpoint}
        userCurrentLocation={captainLocation}
      />
    </div>
  );
}
