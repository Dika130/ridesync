'use client';

import React, { useState } from 'react';
import { ConvoySession, RiderLocation, Checkpoint } from '@/lib/types';
import {
  Bike,
  Phone,
  Radio,
  MapPin,
  Battery,
  BatteryCharging,
  Gauge,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare,
  Clock,
  Ruler,
  Flag,
  WifiOff,
  StopCircle,
  Shield
} from 'lucide-react';

interface RiderCardProps {
  session?: ConvoySession;
  location?: RiderLocation;
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

export default function RiderCard({
  session,
  location,
  captainLocation,
  checkpoint,
}: RiderCardProps) {
  const [copied, setCopied] = useState(false);
  const rider = session?.rider;

  if (!rider) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
        <Bike className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-medium">Pilih rider atau daftarkan anggota konvoi baru untuk dipantau.</p>
      </div>
    );
  }

  const trackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${session?.token}`
    : `/track/${session?.token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = rider.phone_number.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Halo Bro ${rider.full_name}, buka tautan GPS RideSync ini agar posisi motormu terpantau di konvoi: ${trackUrl}`
    );
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const batteryPct = location?.battery_level;
  const isCharging = location?.is_charging ?? false;

  // Analisis Status Berbagi Lokasi
  let isStopped = false;
  let isLiveActive = false;
  let isIdle = false;

  if (location && location.created_at) {
    const logTime = new Date(location.created_at).getTime();
    const now = Date.now();
    const isSpecialStopped = logTime === 0 || location.address?.includes('[Berhenti Berbagi]');

    if (isSpecialStopped) {
      isStopped = true;
    } else if (now - logTime < 35000) {
      isLiveActive = true;
    } else {
      isIdle = true;
    }
  }

  // Jarak Rider ke Road Captain
  const distanceToCaptain = location && captainLocation && !isStopped
    ? calculateDistance(
        captainLocation.latitude,
        captainLocation.longitude,
        location.latitude,
        location.longitude
      )
    : null;

  // Sisa Jarak Rider ke Titik Tujuan / Checkpoint
  const distanceToCheckpoint = location && checkpoint && !isStopped
    ? calculateDistance(
        location.latitude,
        location.longitude,
        checkpoint.latitude,
        checkpoint.longitude
      )
    : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4">
      {/* Live Status Banner */}
      {isStopped ? (
        <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-2xl flex items-center justify-between text-red-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <StopCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Rider Menghentikan Berbagi Lokasi</span>
          </div>
          <span className="text-[11px] bg-red-500/20 px-2 py-0.5 rounded-full font-bold text-red-300">
            OFF
          </span>
        </div>
      ) : isLiveActive ? (
        <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between text-emerald-300 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Rider Sedang Touring (Live GPS)</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold text-emerald-300">
            AKTIF
          </span>
        </div>
      ) : isIdle ? (
        <div className="bg-amber-950/50 border border-amber-500/40 p-3 rounded-2xl flex items-center justify-between text-amber-300 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sinyal GPS Rider Terputus / Berhenti</span>
          </div>
          <span className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold text-amber-300">
            IDLE
          </span>
        </div>
      ) : (
        <div className="bg-blue-950/40 border border-blue-500/30 p-3 rounded-2xl flex items-center justify-between text-blue-300 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Radio className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
            <span>Menunggu Rider Membuka Link GPS</span>
          </div>
          <span className="text-[11px] bg-blue-500/20 px-2 py-0.5 rounded-full font-bold text-blue-300">
            STANDBY
          </span>
        </div>
      )}

      {/* Header Profile Rider & Motor */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg">
            {rider.avatar_url ? (
              <img
                src={rider.avatar_url}
                alt={rider.full_name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 rounded-2xl flex items-center justify-center text-xl font-black text-white uppercase">
                {rider.full_name.substring(0, 2)}
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            {isLiveActive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </>
            ) : isStopped ? (
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-900"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-900"></span>
            )}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white truncate">{rider.full_name}</h2>
            <span className="px-2.5 py-0.5 bg-blue-500/15 border border-blue-500/30 text-cyan-400 text-[11px] rounded-full font-bold">
              {rider.role}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-semibold mt-0.5 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-cyan-400" />
            <span>{rider.motorcycle_model || 'Motor Rider'}</span>
            {rider.license_plate && (
              <span className="bg-slate-800 px-1.5 py-0.2 rounded text-[10px] text-slate-300 font-mono">
                {rider.license_plate}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{rider.phone_number}</p>
        </div>
      </div>

      {/* Grid Jarak: Ke Road Captain & Ke Titik Tujuan */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
            <Ruler className="w-3.5 h-3.5" />
            <span>Jarak ke Captain</span>
          </div>
          <span className="text-sm font-black text-emerald-300 font-mono">
            {distanceToCaptain !== null
              ? distanceToCaptain < 1
                ? `${Math.round(distanceToCaptain * 1000)} m`
                : `${distanceToCaptain.toFixed(2)} km`
              : '-'}
          </span>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold mb-1">
            <Flag className="w-3.5 h-3.5" />
            <span>Sisa ke Checkpoint</span>
          </div>
          <span className="text-sm font-black text-amber-300 font-mono">
            {distanceToCheckpoint !== null
              ? distanceToCheckpoint < 1
                ? `${Math.round(distanceToCheckpoint * 1000)} m`
                : `${distanceToCheckpoint.toFixed(2)} km`
              : '-'}
          </span>
        </div>
      </div>

      {/* Telemetri Perangkat: Speedometer & Baterai */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center">
          <Gauge className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-[11px] text-slate-400">Kecepatan</span>
          <span className="text-sm font-extrabold text-white font-mono">
            {location?.speed && !isStopped ? `${Math.round(location.speed)} km/h` : '0 km/h'}
          </span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center">
          {isCharging ? (
            <BatteryCharging className="w-5 h-5 text-amber-400 mb-1" />
          ) : (
            <Battery className="w-5 h-5 text-emerald-400 mb-1" />
          )}
          <span className="text-[11px] text-slate-400">Baterai HP</span>
          <span className="text-sm font-extrabold text-white font-mono">
            {batteryPct !== undefined && batteryPct !== null ? `${batteryPct}%` : '-'}
          </span>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center">
          <MapPin className="w-5 h-5 text-indigo-400 mb-1" />
          <span className="text-[11px] text-slate-400">Akurasi GPS</span>
          <span className="text-sm font-extrabold text-white font-mono">
            ±{location?.accuracy ? Math.round(location.accuracy) : 5}m
          </span>
        </div>
      </div>

      {/* Alamat Terkini */}
      <div className="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="font-semibold text-slate-300">Posisi / Jalan yang Dilewati</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-medium">
          {location?.address || 'Mengambil data posisi jalan...'}
        </p>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-slate-800 flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition border border-slate-700 shadow-md"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin!' : 'Salin Link GPS'}</span>
        </button>

        <button
          onClick={handleShareWhatsApp}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-emerald-950"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Kirim WA</span>
        </button>
      </div>
    </div>
  );
}
