'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Plus,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  Shield,
  Flag,
  Share2,
  MapPin,
  Radio,
  Navigation
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  // Create Group State
  const [groupName, setGroupName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [motorcycleModel, setMotorcycleModel] = useState('');
  const [destName, setDestName] = useState('Puncak Pass Rest Area');
  const [createLoading, setCreateLoading] = useState(false);

  // Join Group State
  const [joinCode, setJoinCode] = useState('');

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !creatorName) return;

    setCreateLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: groupName,
          creatorName,
          motorcycleModel: motorcycleModel || 'Motor Road Captain',
          role: 'Road Captain',
          checkpoint: {
            name: destName || 'Puncak Pass Rest Area',
            latitude: -6.7025,
            longitude: 106.9942,
            description: 'Titik kumpul istirahat & finish konvoi'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Save current member ID
        localStorage.setItem(`ridesync_member_${data.group.code}`, data.currentMemberId);
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
    if (!joinCode) return;
    const clean = joinCode.trim().toUpperCase();
    router.push(`/room/${clean}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/10 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white tracking-tight">RideSync</span>
                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full font-bold">
                  GROUP CONVOY GPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multiplayer Motorcycle Convoy & Touring Tracker</p>
            </div>
          </div>

          <button
            onClick={() => router.push('/room/SUNMORI-99')}
            className="hidden sm:inline-flex items-center gap-2 py-2 px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 rounded-2xl text-xs font-semibold transition"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Lihat Demo Konvoi (SUNMORI-99)</span>
          </button>
        </div>
      </header>

      {/* Hero & Group Gateway */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-300 text-xs font-semibold mb-1 shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Satu Link untuk Seluruh Rombongan Konvoi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Pantau Posisi Semua Teman Touring di <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Peta yang Sama</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Buat grup konvoi, bagikan 1 link ke grup WhatsApp, dan pantau lokasi GPS, kecepatan motor, serta jarak ke titik tujuan bersama secara real-time.
          </p>
        </div>

        {/* Card Switcher: Buat Grup vs Gabung Kode */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl space-y-5">
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Grup Konvoi</span>
            </button>

            <button
              onClick={() => setActiveTab('join')}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gabung Kode</span>
            </button>
          </div>

          {/* TAB 1: FORM BUAT GRUP BARU */}
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Acara / Konvoi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Touring Puncak Sunmori / Geng CBR"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nama Anda (Captain) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dika (Captain)"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Model Motor Anda</label>
                  <input
                    type="text"
                    placeholder="Contoh: ZX25R / NMAX"
                    value={motorcycleModel}
                    onChange={(e) => setMotorcycleModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Titik Tujuan / Rest Area</label>
                <input
                  type="text"
                  placeholder="Contoh: Puncak Pass Rest Area / KM 57"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading || !groupName || !creatorName}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-cyan-950 transition flex items-center justify-center gap-2 transform active:scale-95"
              >
                {createLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Buat Grup Konvoi & Dapatkan Link</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: FORM GABUNG DENGAN KODE */
            <form onSubmit={handleJoinByCode} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Masukkan Kode Room Konvoi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SUNMORI-99 / PUNCAK-57"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl py-3 px-3.5 text-base text-white placeholder:text-slate-600 focus:outline-none transition uppercase font-mono tracking-wider font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={!joinCode}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-cyan-950 transition flex items-center justify-center gap-2 transform active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Masuk ke Room Konvoi</span>
              </button>
            </form>
          )}
        </div>

        {/* Demo Fast Access Link */}
        <div className="mt-6 text-center">
          <span className="text-xs text-slate-500">
            Ingin mencoba langsung? Buka room demo:{' '}
            <button
              onClick={() => router.push('/room/SUNMORI-99')}
              className="text-cyan-400 hover:underline font-bold"
            >
              SUNMORI-99
            </button>
          </span>
        </div>
      </main>
    </div>
  );
}
