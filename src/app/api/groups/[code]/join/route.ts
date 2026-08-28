import { NextRequest, NextResponse } from 'next/server';
import { GroupMember } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { name, motorcycleModel, licensePlate, avatarUrl, role } = body;

    const memberId = 'mbr-' + Date.now();

    const newMember: GroupMember = {
      id: memberId,
      group_code: code,
      name: name || 'Rider Konvoi',
      motorcycle_model: motorcycleModel || 'Motor Standar',
      license_plate: licensePlate || undefined,
      avatar_url: avatarUrl || '',
      role: role || 'Anggota Konvoi',
      latitude: -6.7025,
      longitude: 106.9942,
      accuracy: 10,
      speed: 0,
      battery_level: 100,
      is_charging: false,
      address: 'Baru bergabung ke grup konvoi...',
      updated_at: new Date().toISOString(),
      is_active: true
    };

    if (supabase) {
      try {
        await supabase.from('group_members').upsert({
          id: memberId,
          group_code: code,
          name: newMember.name,
          motorcycle_model: newMember.motorcycle_model,
          license_plate: newMember.license_plate,
          avatar_url: newMember.avatar_url,
          role: newMember.role,
          latitude: newMember.latitude,
          longitude: newMember.longitude,
          accuracy: newMember.accuracy,
          speed: 0,
          battery_level: 100,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      } catch (e) {}
    }

    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const group = globalThis.globalConvoyGroups.get(code)!;
      group.members = group.members.filter((m) => m.name.toLowerCase() !== name?.toLowerCase());
      group.members.push(newMember);
    }

    return NextResponse.json({ success: true, memberId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
