import { NextRequest, NextResponse } from 'next/server';
import { ConvoyGroup } from '@/lib/types';
import { supabase } from '@/lib/supabase';

declare global {
  var globalConvoyGroups: Map<string, ConvoyGroup>;
}

if (!globalThis.globalConvoyGroups) {
  globalThis.globalConvoyGroups = new Map<string, ConvoyGroup>();
}

// Demo Group Awal
const DEMO_CODE = 'SUNMORI-99';
if (!globalThis.globalConvoyGroups.has(DEMO_CODE)) {
  globalThis.globalConvoyGroups.set(DEMO_CODE, {
    id: 'grp-demo-01',
    code: DEMO_CODE,
    name: 'Touring Puncak Sunmori',
    created_by: 'Road Captain (Dika)',
    created_at: new Date().toISOString(),
    checkpoint: {
      name: 'Puncak Pass Rest Area',
      latitude: -6.7025,
      longitude: 106.9942,
      description: 'Titik kumpul istirahat & regrouping'
    },
    members: [
      {
        id: 'mbr-cap-01',
        group_code: DEMO_CODE,
        name: 'Dika (Captain)',
        motorcycle_model: 'Kawasaki ZX25R',
        license_plate: 'B 2500 RAC',
        avatar_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
        role: 'Road Captain',
        latitude: -6.7150,
        longitude: 106.9800,
        accuracy: 5,
        speed: 60,
        battery_level: 92,
        is_charging: false,
        address: 'Jl. Raya Puncak, Cisarua',
        updated_at: new Date().toISOString(),
        is_active: true
      },
      {
        id: 'mbr-rdr-02',
        group_code: DEMO_CODE,
        name: 'Budi (Sweeper)',
        motorcycle_model: 'Yamaha NMAX 155',
        license_plate: 'B 1555 NMX',
        avatar_url: '',
        role: 'Sweeper',
        latitude: -6.7220,
        longitude: 106.9720,
        accuracy: 8,
        speed: 55,
        battery_level: 78,
        is_charging: false,
        address: 'Jl. Raya Puncak KM 80',
        updated_at: new Date().toISOString(),
        is_active: true
      }
    ]
  });
}

export async function GET() {
  const groups = Array.from(globalThis.globalConvoyGroups.values());
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, creatorName, motorcycleModel, avatarUrl, role, checkpoint } = body;

    // Generate readable code (e.g. TOURING-4829)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = name
      ? name.trim().split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 7) || 'CONVOY'
      : 'CONVOY';
    const code = `${prefix}-${randomNum}`;

    const memberId = 'mbr-' + Date.now();
    const creatorMember = {
      id: memberId,
      group_code: code,
      name: creatorName || 'Road Captain',
      motorcycle_model: motorcycleModel || 'Motor Standar',
      avatar_url: avatarUrl || '',
      role: role || 'Road Captain',
      latitude: -6.7025,
      longitude: 106.9942,
      accuracy: 10,
      speed: 0,
      battery_level: 100,
      is_charging: false,
      address: 'Menunggu sinyal GPS...',
      updated_at: new Date().toISOString(),
      is_active: true
    };

    const newGroup: ConvoyGroup = {
      id: 'grp-' + Date.now(),
      code,
      name: name || 'Touring Konvoi Motor',
      created_by: creatorName || 'Road Captain',
      created_at: new Date().toISOString(),
      checkpoint: checkpoint || {
        name: 'Puncak Pass Rest Area',
        latitude: -6.7025,
        longitude: 106.9942,
        description: 'Titik kumpul istirahat & regrouping'
      },
      members: [creatorMember]
    };

    globalThis.globalConvoyGroups.set(code, newGroup);

    return NextResponse.json({
      success: true,
      group: newGroup,
      currentMemberId: memberId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
