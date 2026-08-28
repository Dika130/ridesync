'use client';

import React, { useState } from 'react';
import { Checkpoint } from '@/lib/types';
import { Flag, MapPin, X, Sparkles, Navigation, Crosshair, Info, Check, Leaf } from 'lucide-react';

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCheckpoint?: Checkpoint | null;
  onSave: (cp: Checkpoint) => Promise<void>;
  userCurrentLocation?: { latitude: number; longitude: number };
}

export default function CheckpointModal({
  isOpen,
  onClose,
  currentCheckpoint,
  onSave,
  userCurrentLocation,
}: CheckpointModalProps) {
  const [name, setName] = useState(currentCheckpoint?.name || 'Puncak Pass Rest Area');
  const [lat, setLat] = useState(currentCheckpoint?.latitude?.toString() || '-6.7025');
  const [lng, setLng] = useState(currentCheckpoint?.longitude?.toString() || '106.9942');
  const [description, setDescription] = useState(currentCheckpoint?.description || 'Titik kumpul & regrouping');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (userCurrentLocation) {
      setLat(userCurrentLocation.latitude.toFixed(6));
      setLng(userCurrentLocation.longitude.toFixed(6));
    } else {
      alert('Lokasi GPS Anda belum aktif.');
    }
  };

  const handleSelectPreset = (presetName: string, pLat: number, pLng: number) => {
    setName(presetName);
    setLat(pLat.toString());
    setLng(pLng.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lat || !lng) return;

    setLoading(true);
    try {
      await onSave({
        name,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        description,
        is_active: true,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#050d09] border border-emerald-900/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950 bg-[#030906]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Atur Titik Tujuan / Checkpoint</h3>
              <p className="text-xs text-emerald-400/60 font-mono">Tentukan koordinat lokasi tujuan akhir atau rest area konvoi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-400/60 hover:text-white p-1.5 rounded-xl hover:bg-emerald-950 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Preset Lokasi Populer */}
          <div>
            <label className="block text-emerald-300 font-semibold mb-1.5 font-mono">Preset Destinasi Populer:</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('Puncak Pass Bogor', -6.7025, 106.9942)}
                className="px-2.5 py-1 bg-[#020704] hover:bg-emerald-950 border border-emerald-900 rounded-xl text-[11px] text-emerald-300 transition cursor-pointer font-mono"
              >
                🌲 Puncak Pass
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('Rest Area KM 57 Tol Japek', -6.3683, 107.2917)}
                className="px-2.5 py-1 bg-[#020704] hover:bg-emerald-950 border border-emerald-900 rounded-xl text-[11px] text-emerald-300 transition cursor-pointer font-mono"
              >
                ⛽ Rest Area KM 57
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('Kawasan Bromo Probolinggo', -7.9425, 112.9530)}
                className="px-2.5 py-1 bg-[#020704] hover:bg-emerald-950 border border-emerald-900 rounded-xl text-[11px] text-emerald-300 transition cursor-pointer font-mono"
              >
                🌋 Gn. Bromo
              </button>
            </div>
          </div>

          {/* Nama Titik Tujuan */}
          <div>
            <label className="block text-emerald-200 font-semibold mb-1.5">
              Nama Lokasi Tujuan / Rest Area <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Puncak Pass Bogor / Pantai Klayar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition"
            />
          </div>

          {/* Titik Koordinat (Latitude & Longitude) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-emerald-200 font-semibold mb-1.5">
                Latitude <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="-6.702500"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition font-mono"
              />
            </div>
            <div>
              <label className="block text-emerald-200 font-semibold mb-1.5">
                Longitude <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="106.994200"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Tombol Gunakan Posisi Saya Saat Ini */}
          {userCurrentLocation && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="w-full py-2 px-3 bg-[#020704] hover:bg-emerald-950 border border-emerald-900 text-emerald-300 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-1.5 font-mono cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gunakan Koordinat GPS Saya ({userCurrentLocation.latitude.toFixed(4)}, {userCurrentLocation.longitude.toFixed(4)})</span>
            </button>
          )}

          {/* Keterangan Titik Kumpul */}
          <div>
            <label className="block text-emerald-200 font-semibold mb-1.5">Keterangan / Catatan Titik Kumpul</label>
            <textarea
              rows={2}
              placeholder="Contoh: Tempat isi bensin, istirahat kopi 30 menit, dan regrouping konvoi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#020704] border border-emerald-900 focus:border-emerald-400 rounded-2xl py-2 px-3.5 text-sm text-white placeholder:text-emerald-900 focus:outline-none transition resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !name || !lat || !lng}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-extrabold rounded-2xl text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Flag className="w-4 h-4 fill-current" />
                  <span>Pasang Titik Tujuan di Peta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
