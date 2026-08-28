'use client';

import React, { useState, useRef } from 'react';
import { Rider } from '@/lib/types';
import { lookupPhoneNumber } from '@/lib/phoneLookup';
import {
  X,
  UserPlus,
  Phone,
  Radio,
  MapPin,
  Sparkles,
  Upload,
  Trash2,
  Bike,
  ShieldAlert,
  User
} from 'lucide-react';

interface AddRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rider: Omit<Rider, 'id'>, convoyName: string, roadCaptainName: string) => Promise<void>;
}

export default function AddRiderModal({
  isOpen,
  onClose,
  onSubmit
}: AddRiderModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [motorcycleModel, setMotorcycleModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [role, setRole] = useState<'Road Captain' | 'Sweeper' | 'Anggota Konvoi' | 'Medis / Rescue' | 'Logistik'>('Anggota Konvoi');
  const [convoyName, setConvoyName] = useState('Touring Akhir Pekan');
  const [roadCaptainName, setRoadCaptainName] = useState('Road Captain (Anda)');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [notes, setNotes] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const phoneInfo = lookupPhoneNumber(phoneNumber);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !fullName) return;

    setLoading(true);
    try {
      await onSubmit(
        {
          full_name: fullName,
          phone_number: phoneInfo.formattedNumber || phoneNumber,
          motorcycle_model: motorcycleModel || 'Motor Standar',
          license_plate: licensePlate || undefined,
          avatar_url: avatarPreview || undefined,
          role,
          operator_name: phoneInfo.operator,
          region_origin: phoneInfo.region,
          emergency_contact: emergencyContact || undefined,
          notes: notes || undefined
        },
        convoyName,
        roadCaptainName
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800/90 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-inner">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tambah Rider Konvoi Baru</h3>
              <p className="text-xs text-slate-400">Daftarkan teman touring & buatkan tautan GPS Live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Upload Foto Rider / Motor (Opsional) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Foto Rider / Motor <span className="text-slate-500 font-normal">(Opsional)</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview Rider" className="w-full h-full object-cover" />
                ) : (
                  <Bike className="w-7 h-7 text-slate-600" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="rider-photo-upload"
                />
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="rider-photo-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-semibold text-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{avatarPreview ? 'Ganti Foto' : 'Pilih Foto'}</span>
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Foto akan muncul di icon marker motor di peta.
                </p>
              </div>
            </div>
          </div>

          {/* Nama Rider & Nomor HP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Nama Rider / Panggilan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Dani CBR / Eko"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Nomor WhatsApp Rider <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Model Motor & Plat Nomor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Model Motor (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: CBR250RR / NMAX / ZX25R"
                value={motorcycleModel}
                onChange={(e) => setMotorcycleModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Plat Nomor (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: B 1234 ABC"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition uppercase font-mono"
              />
            </div>
          </div>

          {/* Peran di Konvoi */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Peran / Posisi di Konvoi</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white focus:outline-none transition"
            >
              <option value="Anggota Konvoi">🏍️ Anggota Konvoi (Rider)</option>
              <option value="Road Captain">👑 Road Captain (Pemimpin Konvoi)</option>
              <option value="Sweeper">🛡️ Sweeper (Pengawal Belakang)</option>
              <option value="Medis / Rescue">🚑 Medis / Tim Rescue</option>
              <option value="Logistik">📦 Rider Logistik</option>
            </select>
          </div>

          {/* Kontak Darurat */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Kontak Darurat (Opsional)</label>
            <input
              type="tel"
              placeholder="Nomor telepon darurat..."
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-2xl py-2.5 px-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !phoneNumber || !fullName}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-blue-950 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Daftarkan Rider & Buat Link GPS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
