import { NextRequest, NextResponse } from 'next/server';
import { disbandGroupInDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { memberId } = body;

    const group = await getGroupByCodeFromDb(code);
    if (!group) {
      return NextResponse.json({ success: true, message: 'Grup sudah tidak ada' });
    }

    const requester = group.members.find((m: any) => m.id === memberId);
    const isCaptain = requester?.role === 'Road Captain' || group.created_by === requester?.name;

    if (!isCaptain) {
      return NextResponse.json(
        { error: 'Hanya Road Captain yang berhak membubarkan grup konvoi.' },
        { status: 403 }
      );
    }

    // 1. Hapus dari Supabase Database (Tabel groups & group_members)
    await disbandGroupInDb(code);

    // 2. Hapus dari Memory Cache
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      globalThis.globalConvoyGroups.delete(code);
    }

    return NextResponse.json({ success: true, message: 'Grup konvoi berhasil dibubarkan' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
