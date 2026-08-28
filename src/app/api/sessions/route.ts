import { NextRequest, NextResponse } from 'next/server';
import { Rider, ConvoySession, RiderLocation } from '@/lib/types';
import { supabase } from '@/lib/supabase';

declare global {
  var globalConvoySessions: Map<string, ConvoySession>;
  var globalRiderLogs: Map<string, RiderLocation[]>;
}

if (!globalThis.globalConvoySessions) {
  globalThis.globalConvoySessions = new Map<string, ConvoySession>();
}

if (!globalThis.globalRiderLogs) {
  globalThis.globalRiderLogs = new Map<string, RiderLocation[]>();
}

// Demo Rider Awal
const INITIAL_DEMO_RIDER: Rider = {
  id: 'rdr-01',
  phone_number: '+6281234567890',
  full_name: 'Budi (CBR250RR)',
  motorcycle_model: 'Honda CBR250RR Red Racing',
  license_plate: 'L 2500 CBR',
  avatar_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
  role: 'Anggota Konvoi',
  operator_name: 'Telkomsel (SimPATI)',
  region_origin: 'Surabaya',
  emergency_contact: '+6281399887766',
  notes: 'Posisi di belakang Road Captain'
};

const INITIAL_DEMO_SESSION: ConvoySession = {
  id: 'ses-01',
  token: 'demo-touring-token-123',
  rider_id: INITIAL_DEMO_RIDER.id,
  rider: INITIAL_DEMO_RIDER,
  convoy_name: 'Touring Jalur Selatan',
  road_captain_name: 'Road Captain (Anda)',
  status: 'active',
  created_at: new Date().toISOString(),
  latest_location: {
    session_id: 'ses-01',
    latitude: -6.7085,
    longitude: 106.9850,
    accuracy: 6,
    speed: 55, // 55 km/h
    heading: 120,
    altitude: 1250,
    battery_level: 88,
    is_charging: false,
    address: 'Jl. Raya Puncak KM 84, Cisarua, Bogor',
    created_at: new Date().toISOString()
  }
};

if (globalThis.globalConvoySessions.size === 0) {
  globalThis.globalConvoySessions.set(INITIAL_DEMO_SESSION.token, INITIAL_DEMO_SESSION);
  globalThis.globalConvoySessions.set(INITIAL_DEMO_SESSION.id, INITIAL_DEMO_SESSION);
}

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('convoy_sessions')
        .select('*, rider:riders(*)')
        .order('created_at', { ascending: false });

      if (!error && data) return NextResponse.json(data);
    } catch (e) {}
  }

  const uniqueSessions = Array.from(new Set(Array.from(globalThis.globalConvoySessions.values())));
  return NextResponse.json(uniqueSessions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { riderData, convoyName, roadCaptainName } = body;

    const token = 'ride-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    if (supabase) {
      try {
        const { data: rResult, error: rErr } = await supabase
          .from('riders')
          .insert(riderData)
          .select()
          .single();

        if (rErr) throw rErr;

        const { data: sResult, error: sErr } = await supabase
          .from('convoy_sessions')
          .insert({
            token,
            rider_id: rResult.id,
            convoy_name: convoyName || 'Touring Konvoi Motor',
            road_captain_name: roadCaptainName || 'Road Captain',
            status: 'active'
          })
          .select('*, rider:riders(*)')
          .single();

        if (sErr) throw sErr;
        return NextResponse.json(sResult);
      } catch (e) {}
    }

    const riderId = 'rdr-' + Date.now();
    const rider: Rider = {
      ...riderData,
      id: riderId,
      created_at: new Date().toISOString()
    };

    const newSession: ConvoySession = {
      id: 'ses-' + Date.now(),
      token,
      rider_id: riderId,
      rider,
      convoy_name: convoyName || 'Touring Konvoi Motor',
      road_captain_name: roadCaptainName || 'Road Captain',
      status: 'active',
      created_at: new Date().toISOString()
    };

    globalThis.globalConvoySessions.set(token, newSession);
    globalThis.globalConvoySessions.set(newSession.id, newSession);

    return NextResponse.json(newSession);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
