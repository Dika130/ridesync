import { NextRequest, NextResponse } from 'next/server';

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
    const { name, latitude, longitude, description } = body;

    const group = globalThis.globalConvoyGroups.get(code)!;
    group.checkpoint = {
      name: name || 'Titik Kumpul Konvoi',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: description || ''
    };

    return NextResponse.json({ success: true, checkpoint: group.checkpoint });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
