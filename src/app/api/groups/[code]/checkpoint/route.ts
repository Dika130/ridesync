import { NextRequest, NextResponse } from 'next/server';
import { updateGroupCheckpointInDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { name, latitude, longitude, description, memberId } = body;

    const currentGroup = await getGroupByCodeFromDb(code);
    const member = currentGroup?.members?.find((m: any) => m.id === memberId);

    // Validasi: Hanya Road Captain / Pembuat Grup yang boleh mengubah titik tujuan
    if (member && member.role !== 'Road Captain' && member.name !== currentGroup?.created_by) {
      return NextResponse.json(
        { error: 'Hanya Road Captain / Pembuat Grup yang berhak mengatur titik tujuan.' },
        { status: 403 }
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // 1. Simpan ke Supabase via REST
    await updateGroupCheckpointInDb(code, {
      name: name || 'Titik Kumpul',
      latitude: lat,
      longitude: lng,
      description: description || ''
    });

    // 2. Simpan ke memory
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const g = globalThis.globalConvoyGroups.get(code)!;
      g.checkpoint = {
        name: name || 'Titik Kumpul Konvoi',
        latitude: lat,
        longitude: lng,
        description: description || ''
      };
    }

    return NextResponse.json({
      success: true,
      checkpoint: { name, latitude: lat, longitude: lng, description }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
