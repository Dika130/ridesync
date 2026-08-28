import { NextRequest, NextResponse } from 'next/server';
import { GroupMember } from '@/lib/types';
import { upsertMemberToDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { name, motorcycleModel, licensePlate, avatarUrl, role, latitude, longitude } = body;

    const memberId = 'mbr-' + Date.now();

    const lat = typeof latitude === 'number' && !isNaN(latitude) ? latitude : -6.2088;
    const lng = typeof longitude === 'number' && !isNaN(longitude) ? longitude : 106.8456;

    const newMember: GroupMember = {
      id: memberId,
      group_code: code,
      name: name || 'Rider Konvoi',
      motorcycle_model: motorcycleModel || 'Motor Standar',
      license_plate: licensePlate || undefined,
      avatar_url: avatarUrl || '',
      role: role || 'Anggota Konvoi',
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      speed: 0,
      battery_level: 100,
      is_charging: false,
      address: 'Baru bergabung ke grup konvoi...',
      updated_at: new Date().toISOString(),
      is_active: true
    };

    // 1. Simpan ke Supabase via REST
    await upsertMemberToDb(newMember);

    // 2. Simpan ke memory
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const group = globalThis.globalConvoyGroups.get(code)!;
      group.members = group.members.filter((m) => m.name.toLowerCase() !== name?.toLowerCase());
      group.members.push(newMember);
    }

    const updatedGroup = await getGroupByCodeFromDb(code);

    return NextResponse.json({ success: true, memberId, group: updatedGroup });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
