import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RiderLocation } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const log = (await req.json()) as RiderLocation;

    if (supabase) {
      try {
        await supabase.from('rider_locations').insert(log);
      } catch (e) {}
    }

    if (!globalThis.globalRiderLogs) {
      globalThis.globalRiderLogs = new Map<string, RiderLocation[]>();
    }

    const existing = globalThis.globalRiderLogs.get(log.session_id) || [];
    globalThis.globalRiderLogs.set(log.session_id, [log, ...existing].slice(0, 50));

    if (globalThis.globalConvoySessions) {
      const session = globalThis.globalConvoySessions.get(log.session_id);
      if (session) {
        session.latest_location = log;
        globalThis.globalConvoySessions.set(session.token, session);
        globalThis.globalConvoySessions.set(session.id, session);
      }
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('rider_locations')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return NextResponse.json(data);
    } catch (e) {}
  }

  if (globalThis.globalRiderLogs && globalThis.globalRiderLogs.has(sessionId)) {
    const logs = globalThis.globalRiderLogs.get(sessionId) || [];
    return NextResponse.json(logs[0] || null);
  }

  return NextResponse.json(null);
}
