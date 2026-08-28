import { NextRequest, NextResponse } from 'next/server';
import { ConvoyGroup } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  // 1. Cek dari Supabase Database dulu
  if (supabase) {
    try {
      const { data: gData, error: gErr } = await supabase
        .from('groups')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (!gErr && gData) {
        const { data: mData } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_code', code)
          .order('updated_at', { ascending: false });

        const fullGroup: ConvoyGroup = {
          id: gData.id,
          code: gData.code,
          name: gData.name,
          created_by: gData.created_by,
          created_at: gData.created_at,
          checkpoint: gData.checkpoint_lat && gData.checkpoint_lng ? {
            name: gData.checkpoint_name || 'Titik Kumpul',
            latitude: gData.checkpoint_lat,
            longitude: gData.checkpoint_lng,
            description: gData.checkpoint_desc || ''
          } : null,
          members: mData || []
        };

        if (globalThis.globalConvoyGroups) {
          globalThis.globalConvoyGroups.set(code, fullGroup);
        }

        return NextResponse.json(fullGroup);
      }
    } catch (e) {}
  }

  // 2. Cek dari Memory Cache
  if (globalThis.globalConvoyGroups && globalThis.globalConvoyGroups.has(code)) {
    return NextResponse.json(globalThis.globalConvoyGroups.get(code));
  }

  return NextResponse.json({ error: 'Grup konvoi tidak ditemukan' }, { status: 404 });
}
