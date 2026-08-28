import { NextRequest, NextResponse } from 'next/server';
import { deleteMemberFromDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { requesterMemberId, targetMemberId } = body;

    if (!targetMemberId) {
      return NextResponse.json({ error: 'targetMemberId diperlukan' }, { status: 400 });
    }

    const group = await getGroupByCodeFromDb(code);
    if (!group) {
      return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
    }

    const requester = group.members.find((m: any) => m.id === requesterMemberId);
    const isCaptain = requester?.role === 'Road Captain' || group.created_by === requester?.name;

    if (!isCaptain) {
      return NextResponse.json(
        { error: 'Hanya Road Captain yang berhak mengeluarkan anggota konvoi.' },
        { status: 403 }
      );
    }

    // 1. Hapus target rider dari Supabase Database
    await deleteMemberFromDb(targetMemberId);

    // 2. Hapus target rider dari Memory Cache
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const g = globalThis.globalConvoyGroups.get(code)!;
      g.members = g.members.filter((m) => m.id !== targetMemberId);
    }

    const updatedGroup = await getGroupByCodeFromDb(code);

    return NextResponse.json({
      success: true,
      message: 'Anggota berhasil dikeluarkan dari konvoi',
      group: updatedGroup
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
