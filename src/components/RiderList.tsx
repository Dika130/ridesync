'use client';

import React from 'react';
import { ConvoySession } from '@/lib/types';
import { Bike, ChevronRight, Phone, Trash2, Shield, Radio } from 'lucide-react';

interface RiderListProps {
  sessions: ConvoySession[];
  activeSessionId?: string;
  onSelectSession: (session: ConvoySession) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export default function RiderList({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: RiderListProps) {
  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
        Belum ada rider terdaftar di konvoi.
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, id: string, name?: string) => {
    e.stopPropagation();
    if (confirm(`Hapus rider konvoi "${name || 'ini'}"?`)) {
      if (onDeleteSession) onDeleteSession(id);
    }
  };

  return (
    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
      {sessions.map((s) => {
        const isSelected = s.id === activeSessionId || s.token === activeSessionId;
        const rider = s.rider;

        return (
          <div
            key={s.id}
            onClick={() => onSelectSession(s)}
            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
              isSelected
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase overflow-hidden">
                  {rider?.avatar_url ? (
                    <img src={rider.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Bike className="w-5 h-5 text-cyan-400" />
                  )}
                </div>
                {s.status === 'active' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate">
                    {rider?.full_name || 'Rider Konvoi'}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-cyan-300 rounded font-semibold">
                    {rider?.role}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="text-slate-300 font-medium truncate">{rider?.motorcycle_model || 'Motor'}</span>
                  {rider?.license_plate && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-400">{rider.license_plate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onDeleteSession && (
                <button
                  type="button"
                  title="Hapus rider dari konvoi"
                  onClick={(e) => handleDelete(e, s.id, rider?.full_name)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <ChevronRight className={`w-4 h-4 text-slate-500 transition ${isSelected ? 'text-cyan-400 transform translate-x-0.5' : ''}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
