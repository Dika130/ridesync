import { NextRequest, NextResponse } from 'next/server';
import { ConvoyGroup } from '@/lib/types';
import { supabase } from '@/lib/supabase';

declare global {
  var globalConvoyGroups: Map<string, ConvoyGroup>;
}

if (!globalThis.globalConvoyGroups) {
  globalThis.globalConvoyGroups = new Map<string, ConvoyGroup>();
}

export async function GET() {
  if (supabase) {
    try {
      const { data: gData, error: gErr } = await supabase.from('groups').select('*');
      const { data: mData, error: mErr } = await supabase.from('group_members').select('*');

      if (!gErr && gData) {
        const fullGroups: ConvoyGroup[] = gData.map((g: any) => ({
          id: g.id,
          code: g.code,
          name: g.name,
          created_by: g.created_by,
          created_at: g.created_at,
          checkpoint: g.checkpoint_lat && g.checkpoint_lng ? {
            name: g.checkpoint_name || 'Titik Kumpul',
            latitude: g.checkpoint_lat,
            longitude: g.checkpoint_lng,
            description: g.checkpoint_desc || ''
          } : null,
          members: (mData || []).filter((m: any) => m.group_code === g.code)
        }));
        return NextResponse.json(fullGroups);
      }
    } catch (e) {}
  }

  const groups = Array.from(globalThis.globalConvoyGroups.values());
  return NextResponse.json(groups);
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
      role: role || 'Road Captain',
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

    // Simpan ke Supabase jika tersedia
    if (supabase) {
      try {
        await supabase.from('groups').insert({
          code,
          name: newGroup.name,
          created_by: newGroup.created_by,
          checkpoint_name: newGroup.checkpoint?.name,
          checkpoint_lat: newGroup.checkpoint?.latitude,
          checkpoint_lng: newGroup.checkpoint?.longitude,
          checkpoint_desc: newGroup.checkpoint?.description
        });

        await supabase.from('group_members').insert({
          id: creatorMember.id,
          group_code: code,
          name: creatorMember.name,
          motorcycle_model: creatorMember.motorcycle_model,
          role: creatorMember.role,
          latitude: creatorMember.latitude,
          longitude: creatorMember.longitude,
          accuracy: creatorMember.accuracy,
          speed: 0,
          battery_level: 100,
          is_active: true
        });
      } catch (e) {}
    }

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
