import { NextRequest, NextResponse } from 'next/server';
import { Checkpoint } from '@/lib/types';
import { supabase } from '@/lib/supabase';

declare global {
  var globalActiveCheckpoint: Checkpoint | null;
}

if (!globalThis.globalActiveCheckpoint) {
  // Default Checkpoint Awal (misal: Puncak Pass Bogor / Tugu Titik Kumpul)
  globalThis.globalActiveCheckpoint = {
    id: 'cp-default',
    name: 'Puncak Pass Rest Area',
    latitude: -6.7025,
    longitude: 106.9942,
    description: 'Titik kumpul istirahat & regrouping konvoi',
    is_active: true
  };
}

export async function GET() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (e) {}
  }

  return NextResponse.json(globalThis.globalActiveCheckpoint);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, latitude, longitude, description } = body;

    const newCheckpoint: Checkpoint = {
      id: 'cp-' + Date.now(),
      name: name || 'Titik Kumpul Konvoi',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      description: description || '',
      is_active: true
    };

    if (supabase) {
      try {
        await supabase.from('checkpoints').update({ is_active: false }).eq('is_active', true);
        await supabase.from('checkpoints').insert(newCheckpoint);
      } catch (e) {}
    }

    globalThis.globalActiveCheckpoint = newCheckpoint;
    return NextResponse.json(newCheckpoint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
