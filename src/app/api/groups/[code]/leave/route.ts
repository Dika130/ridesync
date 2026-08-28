import { NextRequest, NextResponse } from 'next/server';
import { deleteMemberFromDb, getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'memberId diperlukan' }, { status: 400 });
    }

    // 1. Hapus dari Supabase Database
    await deleteMemberFromDb(memberId);

    // 2. Hapus dari Memory Cache
    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const group = globalThis.globalConvoyGroups.get(code)!;
      group.members = group.members.filter((m) => m.id !== memberId);
    }

    return NextResponse.json({ success: true, message: 'Berhasil keluar dari grup konvoi' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
