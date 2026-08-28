import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { name, latitude, longitude, description } = body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (supabase) {
      try {
        await supabase
          .from('groups')
          .update({
            checkpoint_name: name || 'Titik Kumpul',
            checkpoint_lat: lat,
            checkpoint_lng: lng,
            checkpoint_desc: description || '',
            updated_at: new Date().toISOString()
          })
          .eq('code', code);
      } catch (e) {}
    }

    if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
      const group = globalThis.globalConvoyGroups.get(code)!;
      group.checkpoint = {
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
