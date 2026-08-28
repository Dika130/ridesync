'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ConvoyGroup, GroupMember, Checkpoint } from '@/lib/types';
import CheckpointModal from '@/components/CheckpointModal';
import {
  Bike,
  Car,
  Flag,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Users,
  Crosshair,
  Gauge,
  Battery,
  BatteryCharging,
  Ruler,
  Compass,
  ArrowLeft,
  Sparkles,
  Radio,
  Play,
  StopCircle,
  MapPin,
  Clock
} from 'lucide-react';

const MultiplayerConvoyMap = dynamic(() => import('@/components/MultiplayerConvoyMap'), {
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

export default function ConvoyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const groupCode = rawCode?.toUpperCase();

  const [group, setGroup] = useState<ConvoyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vehicle Routing Mode: Motor vs Mobil
  const [vehicleMode, setVehicleMode] = useState<'motor' | 'mobil'>('motor');

  // My Member Identity in this room
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState('');
  const [joinMotor, setJoinMotor] = useState('');
  const [joinRole, setJoinRole] = useState<'Road Captain' | 'Sweeper' | 'Anggota Konvoi' | 'Medis' | 'Logistik'>('Anggota Konvoi');
  const [joinLoading, setJoinLoading] = useState(false);

  // Checkpoint Modal
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);

  // Share link state
  const [copied, setCopied] = useState(false);

  // Battery State
  const [batteryPct, setBatteryPct] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const watchIdRef = useRef<number | null>(null);

  // Load member ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && groupCode) {
      const saved = localStorage.getItem(`ridesync_member_${groupCode}`);
      if (saved) setMyMemberId(saved);
    }
  }, [groupCode]);

  // Read Battery
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        setBatteryPct(Math.round(b.level * 100));
        setIsCharging(b.charging);
        b.addEventListener('levelchange', () => setBatteryPct(Math.round(b.level * 100)));
        b.addEventListener('chargingchange', () => setIsCharging(b.charging));
      }).catch(() => {});
    }
  }, []);

  // Fetch Group Data & Poll
  useEffect(() => {
    if (!groupCode) return;

    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/${groupCode}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
          setError(null);
        } else {
          setError('Grup konvoi tidak ditemukan.');
        }
      } catch (e) {
        setError('Gagal memuat grup konvoi.');
      } finally {
        setLoading(false);
      }
    }

    fetchGroup();
    const interval = setInterval(fetchGroup, 2000);
    return () => clearInterval(interval);
  }, [groupCode]);

  // Broadcast My GPS Location continuously
  useEffect(() => {
    if (!myMemberId || !groupCode || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const speed = pos.coords.speed ? pos.coords.speed * 3.6 : 0;
      const accuracy = pos.coords.accuracy;

      let address = '';
      try {
        const geoRes = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
        if (geoRes.ok) {
          const d = await geoRes.json();
          address = d.address || '';
        }
      } catch (e) {}

      try {
        await fetch(`/api/groups/${groupCode}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: myMemberId,
            latitude: lat,
            longitude: lng,
            accuracy,
            speed,
            battery_level: batteryPct ?? undefined,
            is_charging: isCharging,
            address: address || undefined,
            is_active: true
          })
        });
      } catch (e) {}
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, () => {}, {
      enableHighAccuracy: true,
      timeout: 10000
    });

    const watchId = navigator.geolocation.watchPosition(onLocationSuccess, (err) => console.warn(err), {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    });

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [myMemberId, groupCode, batteryPct, isCharging]);

  // Handle Join Form
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName) return;

    setJoinLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: joinName,
          motorcycleModel: joinMotor || 'Motor Standar',
          role: joinRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMyMemberId(data.memberId);
        localStorage.setItem(`ridesync_member_${groupCode}`, data.memberId);
        if (data.group) setGroup(data.group);
      } else {
        alert('Gagal bergabung ke grup konvoi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCopyGroupLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(
      `🏍️ Yuk gabung ke Konvoi "${group?.name || 'Touring'}" di RideSync!\nBuka link ini untuk memantau & berbagi posisi motor real-time:\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveCheckpoint = async (cp: Checkpoint) => {
    try {
      const res = await fetch(`/api/groups/${groupCode}/checkpoint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cp)
      });
      if (res.ok) {
        const data = await res.json();
        if (group) setGroup({ ...group, checkpoint: data.checkpoint });
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold">Memuat Room Konvoi {groupCode}...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Grup Konvoi Tidak Ditemukan</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Kode grup konvoi <b className="text-cyan-400">{groupCode}</b> tidak valid atau telah selesai.
          </p>
          <button
            onClick={() => router.push('/')}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // JIKA PENGGUNA BELUM BERGABUNG KE GRUP (JOIN GATE SCREEN)
  // ==============================================================================
  if (!myMemberId) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-black relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl relative z-10 space-y-5">
          {/* Header Undangan Grup */}
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 mx-auto">
              <Bike className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-bold uppercase tracking-wider">
              Undangan Konvoi Motor
            </span>
            <h1 className="text-xl font-black text-white">{group.name}</h1>
            <p className="text-xs text-slate-400">
              Kode Room: <b className="text-cyan-400 font-mono">{group.code}</b> • Dibuat oleh: <b className="text-slate-200">{group.created_by}</b>
            </p>
          </div>

          {/* Info Checkpoint Tujuan */}
          {group.checkpoint && (
            <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
              <Flag className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400/80 block uppercase font-bold">Titik Tujuan Konvoi</span>
                <span className="font-bold text-white truncate block">{group.checkpoint.name}</span>
              </div>
            </div>
          )}

          {/* Form Gabung */}
          <form onSubmit={handleJoinSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nama Rider / Panggilan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi / Dani ZX25R"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Model Kendaraan</label>
              <input
                type="text"
                placeholder="Contoh: Honda CBR250RR / Yamaha NMAX / Mobil Avanza"
                value={joinMotor}
                onChange={(e) => setJoinMotor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Peran di Konvoi</label>
              <select
                value={joinRole}
                onChange={(e: any) => setJoinRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white focus:outline-none transition"
              >
                <option value="Anggota Konvoi">🏍️ Anggota Konvoi (Rider)</option>
                <option value="Sweeper">🛡️ Sweeper (Pengawal Belakang)</option>
                <option value="Road Captain">👑 Road Captain (Pemimpin)</option>
                <option value="Medis">🚑 Tim Medis / Rescue</option>
                <option value="Logistik">📦 Logistik</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={joinLoading || !joinName}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-cyan-950 transition flex items-center justify-center gap-2 transform active:scale-95"
            >
              {joinLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Gabung ke Peta Konvoi & Aktifkan GPS</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // MULTIPLAYER CONVOY ROOM DASHBOARD (Semua Rider Melihat Peta Bersama)
  // ==============================================================================
  const myMember = group.members.find((m) => m.id === myMemberId);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              title="Kembali ke Beranda"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">{group.name}</h1>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-mono font-bold">
                  {group.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {group.members.length} Rider Terhubung • Anda: <b className="text-cyan-400">{myMember?.name}</b>
              </p>
            </div>
          </div>

          {/* Action Buttons: Mode, Checkpoint, Share */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCheckpointModalOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Set Tujuan</span>
            </button>

            <button
              onClick={handleCopyGroupLink}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin Link'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Share WA</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Convoy Members Roster (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Active Checkpoint Banner */}
          {group.checkpoint && (
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-4 rounded-3xl flex items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Flag className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Titik Tujuan Bersama</span>
                  <h3 className="text-sm font-black text-white truncate">{group.checkpoint.name}</h3>
                  <p className="text-[11px] text-slate-400 truncate">{group.checkpoint.description || 'Titik Kumpul / Rest Area'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Convoy Members List */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Rombongan Konvoi ({group.members.length} Rider)</span>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {group.members.map((member) => {
                const isMe = member.id === myMemberId;
                const distanceToCp = group.checkpoint
                  ? calculateDistance(member.latitude, member.longitude, group.checkpoint.latitude, group.checkpoint.longitude)
                  : null;

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/40'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase overflow-hidden shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Bike className={`w-5 h-5 ${isMe ? 'text-emerald-400' : 'text-cyan-400'}`} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">
                            {member.name} {isMe && <span className="text-emerald-400">(Anda)</span>}
                          </h4>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${isMe ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-cyan-300'}`}>
                            {member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {member.motorcycle_model || 'Motor Rider'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-bold text-white">
                        <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{member.speed ? Math.round(member.speed) : 0} km/h</span>
                      </div>
                      {distanceToCp !== null && (
                        <span className="text-[10px] text-amber-400 block font-mono mt-0.5">
                          Ke Tujuan: {distanceToCp < 1 ? `${Math.round(distanceToCp * 1000)}m` : `${distanceToCp.toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Multiplayer Map (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex-1 h-full min-h-[500px] lg:min-h-[660px]">
            <MultiplayerConvoyMap
              members={group.members}
              currentMemberId={myMemberId}
              checkpoint={group.checkpoint}
              vehicleMode={vehicleMode}
              onToggleVehicleMode={setVehicleMode}
            />
          </div>
        </section>
      </main>

      {/* Checkpoint Modal */}
      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        currentCheckpoint={group.checkpoint}
        onSave={handleSaveCheckpoint}
        userCurrentLocation={myMember ? { latitude: myMember.latitude, longitude: myMember.longitude } : undefined}
      />
    </div>
  );
}
