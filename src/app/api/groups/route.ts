import { NextRequest, NextResponse } from 'next/server';
import { ConvoyGroup } from '@/lib/types';
import { insertGroupToDb, upsertMemberToDb } from '@/lib/supabaseRest';

declare global {
  var globalConvoyGroups: Map<string, ConvoyGroup>;
}

if (!globalThis.globalConvoyGroups) {
  globalThis.globalConvoyGroups = new Map<string, ConvoyGroup>();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, creatorName, motorcycleModel, avatarUrl, role, checkpoint } = body;

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
      role: (role || 'Road Captain') as any,
      latitude: checkpoint?.latitude || -6.7025,
      longitude: checkpoint?.longitude || 106.9942,
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

    // 1. Simpan ke Supabase via REST API
    await insertGroupToDb({
      code,
      name: newGroup.name,
      created_by: newGroup.created_by,
      checkpoint_name: newGroup.checkpoint?.name,
      checkpoint_lat: newGroup.checkpoint?.latitude,
      checkpoint_lng: newGroup.checkpoint?.longitude,
      checkpoint_desc: newGroup.checkpoint?.description
    });

    await upsertMemberToDb(creatorMember);

    // 2. Simpan ke memory
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
