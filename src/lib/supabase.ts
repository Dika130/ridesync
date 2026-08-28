import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Rider, ConvoySession, RiderLocation, Checkpoint } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function getConvoySessions(): Promise<ConvoySession[]> {
  try {
    const res = await fetch('/api/sessions', { cache: 'no-store' });
    if (res.ok) return (await res.json()) as ConvoySession[];
  } catch (e) {}
  return [];
}

export async function createConvoySession(
  riderData: Omit<Rider, 'id'>,
  convoyName: string,
  roadCaptainName: string
): Promise<ConvoySession> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riderData, convoyName, roadCaptainName })
  });
  if (!res.ok) throw new Error('Gagal membuat sesi konvoi');
  return await res.json();
}

export async function getConvoySessionByToken(token: string): Promise<ConvoySession | null> {
  try {
    const res = await fetch(`/api/sessions/${token}`, { cache: 'no-store' });
    if (res.ok) return (await res.json()) as ConvoySession;
  } catch (e) {}
  return null;
}

export async function saveRiderLocation(log: RiderLocation): Promise<void> {
  try {
    await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
  } catch (e) {}
}

export async function deleteConvoySession(sessionId: string): Promise<void> {
  try {
    await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  } catch (e) {}
}

export async function getActiveCheckpoint(): Promise<Checkpoint | null> {
  try {
    const res = await fetch('/api/checkpoints', { cache: 'no-store' });
    if (res.ok) return (await res.json()) as Checkpoint;
  } catch (e) {}
  return null;
}

export async function saveActiveCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint> {
  const res = await fetch('/api/checkpoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkpoint)
  });
  if (!res.ok) throw new Error('Gagal menyimpan titik tujuan');
  return await res.json();
}
