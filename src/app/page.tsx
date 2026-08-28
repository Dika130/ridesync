'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Car,
  Users,
  Compass,
  Zap,
  Leaf,
  Shield,
  ArrowRight,
  Sparkles,
  MapPin,
  Share2,
  Lock,
  PlusCircle,
  LogIn,
  Layers,
  BatteryCharging
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Form Create Group
  const [groupName, setGroupName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [vehicleType, setVehicleType] = useState<'Motor' | 'Mobil'>('Motor');
  const [vehicleDetail, setVehicleDetail] = useState('');
  const [checkpointName, setCheckpointName] = useState('Puncak Pass Rest Area');
  const [checkpointLat, setCheckpointLat] = useState('-6.7025');
  const [checkpointLng, setCheckpointLng] = useState('106.9942');
  const [createLoading, setCreateLoading] = useState(false);

  // Form Join Group
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !creatorName) return;

    setCreateLoading(true);
    try {
      const fullVehicleName = vehicleDetail.trim()
        ? `${vehicleType} (${vehicleDetail.trim()})`
        : vehicleType;

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          creatorName,
          motorcycleModel: fullVehicleName,
          role: 'Road Captain',
          checkpoint: {
            name: checkpointName || 'Titik Kumpul Konvoi',
            latitude: parseFloat(checkpointLat) || -6.7025,
            longitude: parseFloat(checkpointLng) || 106.9942,
            description: 'Titik tujuan utama konvoi motor'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`ridesync_member_${data.group.code}`, data.currentMemberId);
        localStorage.setItem(`ridesync_group_cache_${data.group.code}`, JSON.stringify(data.group));
        router.push(`/room/${data.group.code}`);
      } else {
        alert('Gagal membuat grup konvoi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Silakan masukkan kode grup konvoi');
      return;
    }
    router.push(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-[#030705] text-emerald-50 selection:bg-emerald-400 selection:text-black flex flex-col font-sans relative">
      {/* Background Decorators with isolated overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b10_1px,transparent_1px),linear-gradient(to_bottom,#064e3b10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Fully Sticky Topbar with z-[1000] */}
      <header className="sticky top-0 z-[1000] w-full border-b border-emerald-950/80 bg-[#040806]/95 backdrop-blur-2xl shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1.5px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full bg-[#040d09] rounded-[14px] flex items-center justify-center">
                <Bike className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  RideSync
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full font-bold uppercase tracking-wider">
                  ECO-TELEMETRY 2.0
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 font-mono">Clean • Low-Energy GPS Convoy</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-full text-[11px] text-emerald-400 font-mono">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>OLED Low-Power Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero & Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center relative z-10">
        {/* Futuristic Hero Title */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Smart Real-Time Convoy GPS & Road Telemetry</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Pelacak Konvoi Motor{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Futuristik & Hemat Daya
            </span>
          </h1>

          <p className="text-sm sm:text-base text-emerald-200/60 leading-relaxed max-w-xl mx-auto">
            Pantau seluruh rider rombongan secara live di satu peta, temukan jalur tercepat bebas tol, dan capai titik kumpul bersama tanpa terpisah.
          </p>
        </div>

        {/* Tab Switcher: Buat Grup vs Gabung Kode */}
        <div className="w-full max-w-md bg-[#06100c]/90 p-1.5 rounded-2xl border border-emerald-900/60 flex shadow-2xl mb-6 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-emerald-400/60 hover:text-emerald-300'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Grup Konvoi</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'text-emerald-400/60 hover:text-emerald-300'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Gabung Kode Room</span>
          </button>
        </div>

        {/* Action Card Container */}
        <div className="w-full max-w-md bg-[#050d09]/95 border border-emerald-900/70 rounded-3xl p-6 sm:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {activeTab === 'create' ? (
            /* ================= FORM BUAT GRUP ================= */
            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              <div>
                <label className="block text-emerald-200 font-semibold mb-1.5">
                  Nama Acara / Grup Konvoi <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sunmori Puncak Pass / Touring Bali"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition font-sans"
                />
              </div>

              <div>
                <label className="block text-emerald-200 font-semibold mb-1.5">
                  Nama Anda (Road Captain) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dika (Captain)"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition font-sans"
                />
              </div>

              {/* Pilihan Jenis Kendaraan: Motor vs Mobil */}
              <div>
                <label className="block text-emerald-200 font-semibold mb-1.5 font-mono">Jenis Kendaraan Anda</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setVehicleType('Motor')}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      vehicleType === 'Motor'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>🏍️ Motor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehicleType('Mobil')}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 font-bold transition cursor-pointer ${
                      vehicleType === 'Mobil'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-[#020704] border-emerald-900 text-emerald-400/60'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>🚗 Mobil</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Detail tipe (opsional, misal: NMAX / ZX25R / Avanza)"
                  value={vehicleDetail}
                  onChange={(e) => setVehicleDetail(e.target.value)}
                  className="w-full bg-[#020704] border border-emerald-900/80 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition font-sans"
                />
              </div>

              {/* Titik Checkpoint Awal */}
              <div className="pt-2 border-t border-emerald-950 space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider font-mono">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Titik Tujuan / Kumpul Konvoi</span>
                </div>

                <div>
                  <label className="block text-emerald-300/80 mb-1">Nama Tempat Tujuan</label>
                  <input
                    type="text"
                    value={checkpointName}
                    onChange={(e) => setCheckpointName(e.target.value)}
                    placeholder="Contoh: Rest Area KM 57 / Puncak Pass"
                    className="w-full bg-[#020704] border border-emerald-900/80 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-emerald-300/80 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={checkpointLat}
                      onChange={(e) => setCheckpointLat(e.target.value)}
                      placeholder="-6.7025"
                      className="w-full bg-[#020704] border border-emerald-900/80 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-300/80 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={checkpointLng}
                      onChange={(e) => setCheckpointLng(e.target.value)}
                      placeholder="106.9942"
                      className="w-full bg-[#020704] border border-emerald-900/80 focus:border-emerald-400 rounded-2xl py-2 px-3 text-xs text-white placeholder:text-emerald-900 focus:outline-none transition font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading || !groupName || !creatorName}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black rounded-2xl text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {createLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Buka Room Konvoi & Generate Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ================= FORM GABUNG KODE ================= */
            <form onSubmit={handleJoinByCode} className="space-y-4 text-xs">
              <div className="text-center py-2 space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <LogIn className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Masukkan Kode Room Konvoi</h3>
                <p className="text-[11px] text-emerald-400/60">Dapatkan kode room dari Road Captain / teman Anda</p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="CONTOH: SUNMORI-4829"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                    setJoinError('');
                  }}
                  className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-3 px-3.5 text-center font-mono text-base font-bold tracking-widest text-emerald-300 placeholder:text-emerald-900 focus:outline-none transition uppercase"
                />
                {joinError && <p className="text-[11px] text-red-400 mt-1.5 text-center font-medium">{joinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black rounded-2xl text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <span>Masuk ke Peta Konvoi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-[#040d09]/60 border border-emerald-950/80 flex items-center gap-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Non-Toll Motor Routing</h4>
              <p className="text-[11px] text-emerald-400/50">Jalur bebas tol cerdas khusus roda dua.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#040d09]/60 border border-emerald-950/80 flex items-center gap-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Multiplayer Live Map</h4>
              <p className="text-[11px] text-emerald-400/50">Pantau seluruh rider & kecepatan km/h.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#040d09]/60 border border-emerald-950/80 flex items-center gap-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Eco-OLED Energy Saver</h4>
              <p className="text-[11px] text-emerald-400/50">Hemat baterai HP saat touring jarak jauh.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-950/60 py-4 text-center text-xs text-emerald-600/70 font-mono">
        RideSync Telemetry Engine • Powered by OpenStreetMap & Next.js 13.5
      </footer>
    </div>
  );
}
