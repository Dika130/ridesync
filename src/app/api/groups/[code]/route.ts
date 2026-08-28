import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  if (!globalThis.globalConvoyGroups) {
    return NextResponse.json({ error: 'Grup tidak ditemukan' }, { status: 404 });
  }

  const group = globalThis.globalConvoyGroups.get(code);
  if (!group) {
    return NextResponse.json({ error: 'Grup konvoi tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json(group);
}
