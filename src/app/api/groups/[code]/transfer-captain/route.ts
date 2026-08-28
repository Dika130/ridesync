import { NextRequest, NextResponse } from 'next/server';
import { transferCaptainInDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { requesterMemberId, newCaptainMemberId } = body;

    if (!requesterMemberId || !newCaptainMemberId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const group = await getGroupByCodeFromDb(code);
    if (!group) {
      return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
    }

    const requester = group.members.find((m: any) => m.id === requesterMemberId);
    const isCaptain = requester?.role === 'Road Captain' || group.created_by === requester?.name;

    if (!isCaptain) {
      return NextResponse.json(
        { error: 'Hanya Road Captain saat ini yang berhak memindahkan jabatan Captain.' },
        { status: 403 }
      );
    }

    const newCaptain = group.members.find((m: any) => m.id === newCaptainMemberId);
    if (!newCaptain) {
      return NextResponse.json({ error: 'Rider tujuan tidak ditemukan' }, { status: 404 });
    }

    // 1. Update di Supabase Database
    await transferCaptainInDb(code, newCaptain.name, requesterMemberId, newCaptainMemberId);

    // 2. Update di memory cache
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const g = globalThis.globalConvoyGroups.get(code)!;
      g.created_by = newCaptain.name;
      g.members.forEach((m) => {
        if (m.id === newCaptainMemberId) m.role = 'Road Captain';
        if (m.id === requesterMemberId) m.role = 'Rider';
      });
    }

    const updatedGroup = await getGroupByCodeFromDb(code);

    return NextResponse.json({
      success: true,
      message: `Jabatan Road Captain berhasil dipindahkan ke ${newCaptain.name}`,
      group: updatedGroup
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
