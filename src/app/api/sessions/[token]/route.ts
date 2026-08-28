import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('convoy_sessions')
        .select('*, rider:riders(*)')
        .eq('token', token)
        .maybeSingle();

      if (!error && data) return NextResponse.json(data);
    } catch (e) {}
  }

  if (globalThis.globalConvoySessions && globalThis.globalConvoySessions.has(token)) {
    return NextResponse.json(globalThis.globalConvoySessions.get(token));
  }

  return NextResponse.json({ error: 'Sesi touring tidak ditemukan' }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const idOrToken = params.token;

  if (supabase) {
    try {
      await supabase.from('convoy_sessions').delete().or(`id.eq.${idOrToken},token.eq.${idOrToken}`);
    } catch (e) {}
  }

  if (globalThis.globalConvoySessions) {
    globalThis.globalConvoySessions.delete(idOrToken);
    for (const [key, val] of Array.from(globalThis.globalConvoySessions.entries())) {
      if (val.id === idOrToken || val.token === idOrToken) {
        globalThis.globalConvoySessions.delete(key);
      }
    }
  }

  return NextResponse.json({ success: true });
}
