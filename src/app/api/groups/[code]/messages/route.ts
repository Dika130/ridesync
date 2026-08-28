import { NextRequest, NextResponse } from 'next/server';
import { ConvoyMessage } from '@/lib/types';

// Global memory store for live chat messages
declare global {
  var globalConvoyMessages: Map<string, ConvoyMessage[]> | undefined;
}

if (!globalThis.globalConvoyMessages) {
  globalThis.globalConvoyMessages = new Map();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puaccwdicgvlyhqplbdf.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MLypoVmoj6hQfv36lgTUng_7ynz5g0X';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    // 1. Coba ambil dari Supabase
    let messages: ConvoyMessage[] = [];
    try {
      const url = `${SUPABASE_URL}/rest/v1/group_messages?group_code=eq.${encodeURIComponent(code)}&select=*&order=created_at.asc&limit=50`;
      const res = await fetch(url, { headers, cache: 'no-store' });
      if (res.ok) {
        messages = await res.json();
      }
    } catch (e) {}

    // 2. Jika di database belum ada tabel group_messages, gunakan memory store
    if (!messages || messages.length === 0) {
      messages = globalThis.globalConvoyMessages?.get(code) || [];
    } else {
      // Sync memory store
      globalThis.globalConvoyMessages?.set(code, messages);
    }

    return NextResponse.json({ messages });
  } catch (error: any) {
    const memoryMsgs = globalThis.globalConvoyMessages?.get(code) || [];
    return NextResponse.json({ messages: memoryMsgs });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();

  try {
    const body = await request.json();
    const { senderId, senderName, vehicleType, message, isUrgent } = body;

    if (!senderId || !senderName || !message?.trim()) {
      return NextResponse.json({ error: 'Data chat tidak lengkap' }, { status: 400 });
    }

    const newMessage: ConvoyMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      group_code: code,
      sender_id: senderId,
      sender_name: senderName,
      vehicle_type: vehicleType || 'Motor',
      message: message.trim(),
      is_urgent: !!isUrgent,
      created_at: new Date().toISOString()
    };

    // 1. Simpan di memory store seketika untuk low-latency
    const currentMsgs = globalThis.globalConvoyMessages?.get(code) || [];
    currentMsgs.push(newMessage);
    if (currentMsgs.length > 100) currentMsgs.shift(); // Keep last 100
    globalThis.globalConvoyMessages?.set(code, currentMsgs);

    // 2. Simpan ke Supabase jika tabel ada
    try {
      const url = `${SUPABASE_URL}/rest/v1/group_messages`;
      await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(newMessage)
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
