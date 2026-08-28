import { NextRequest, NextResponse } from 'next/server';
import { GroupMember } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  if (!globalThis.globalConvoyGroups || !globalThis.globalConvoyGroups.has(code)) {
    return NextResponse.json({ error: 'Grup konvoi tidak ditemukan' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, motorcycleModel, licensePlate, avatarUrl, role } = body;

    const group = globalThis.globalConvoyGroups.get(code)!;
    const memberId = 'mbr-' + Date.now();

    const newMember: GroupMember = {
      id: memberId,
      group_code: code,
      name: name || 'Rider Konvoi',
      motorcycle_model: motorcycleModel || 'Motor',
      license_plate: licensePlate || undefined,
      avatar_url: avatarUrl || '',
      role: role || 'Anggota Konvoi',
      latitude: group.checkpoint?.latitude || -6.7025,
      longitude: group.checkpoint?.longitude || 106.9942,
      accuracy: 10,
      speed: 0,
      battery_level: 100,
      is_charging: false,
      address: 'Baru bergabung ke grup konvoi...',
      updated_at: new Date().toISOString(),
      is_active: true
    };

    // Update or append member
    const existingIdx = group.members.findIndex((m) => m.name.toLowerCase() === name?.toLowerCase());
    if (existingIdx !== -1) {
      group.members[existingIdx] = { ...group.members[existingIdx], ...newMember, id: group.members[existingIdx].id };
      return NextResponse.json({ success: true, memberId: group.members[existingIdx].id, group });
    } else {
      group.members.push(newMember);
      return NextResponse.json({ success: true, memberId, group });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
