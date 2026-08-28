import { NextRequest, NextResponse } from 'next/server';
import { updateMemberVehicleInDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { memberId, vehicleModel } = body;

    if (!memberId || !vehicleModel) {
      return NextResponse.json({ error: 'memberId dan vehicleModel diperlukan' }, { status: 400 });
    }

    // 1. Update ke Supabase
    await updateMemberVehicleInDb(memberId, vehicleModel);

    // 2. Update ke memory cache
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const g = globalThis.globalConvoyGroups.get(code)!;
      const m = g.members.find((mb) => mb.id === memberId);
      if (m) m.motorcycle_model = vehicleModel;
    }

    const updatedGroup = await getGroupByCodeFromDb(code);

    return NextResponse.json({
      success: true,
      message: 'Informasi kendaraan berhasil diperbarui',
      group: updatedGroup
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
