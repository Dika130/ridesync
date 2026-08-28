import { NextRequest, NextResponse } from 'next/server';
import { updateMemberLocationInDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { memberId, latitude, longitude, accuracy, speed, heading, battery_level, is_charging, address, is_active } = body;

    // 1. Simpan ke Supabase via REST
    await updateMemberLocationInDb(memberId, {
      latitude,
      longitude,
      accuracy: accuracy ?? 10,
      speed: speed ?? 0,
      heading: heading ?? undefined,
      battery_level: battery_level ?? undefined,
      is_charging: is_charging ?? false,
      address: address ?? undefined,
      is_active: is_active ?? true
    });

    // 2. Simpan ke memory
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const group = globalThis.globalConvoyGroups.get(code)!;
      const member = group.members.find((m) => m.id === memberId);
      if (member) {
        member.latitude = latitude;
        member.longitude = longitude;
        if (accuracy !== undefined) member.accuracy = accuracy;
        if (speed !== undefined) member.speed = speed;
        if (heading !== undefined) member.heading = heading;
        if (battery_level !== undefined) member.battery_level = battery_level;
        if (is_charging !== undefined) member.is_charging = is_charging;
        if (address !== undefined) member.address = address;
        if (is_active !== undefined) member.is_active = is_active;
        member.updated_at = new Date().toISOString();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
