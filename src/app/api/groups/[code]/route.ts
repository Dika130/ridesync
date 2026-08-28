import { NextRequest, NextResponse } from 'next/server';
import { getGroupByCodeFromDb } from '@/lib/supabaseRest';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  // 1. Ambil dari Supabase Cloud Database (REST API)
  const dbGroup = await getGroupByCodeFromDb(code);
  if (dbGroup) {
    if (globalThis.globalConvoyGroups) {
      globalThis.globalConvoyGroups.set(code, dbGroup as any);
    }
    return NextResponse.json(dbGroup);
  }

  // 2. Cek dari Memory Cache
  if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
    return NextResponse.json(globalThis.globalConvoyGroups.get(code));
  }

  return NextResponse.json({ error: 'Grup konvoi tidak ditemukan' }, { status: 404 });
}
