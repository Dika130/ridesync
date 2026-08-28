const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puaccwdicgvlyhqplbdf.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MLypoVmoj6hQfv36lgTUng_7ynz5g0X';

const headers = {
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

// 1. Ambil Grup beserta Semua Anggotanya
export async function getGroupByCodeFromDb(code: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/groups?code=eq.${encodeURIComponent(code)}&select=*`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    const group = data[0];

    // Ambil semua anggota grup
    const mUrl = `${SUPABASE_URL}/rest/v1/group_members?group_code=eq.${encodeURIComponent(code)}&select=*&order=updated_at.desc`;
    const mRes = await fetch(mUrl, { headers, cache: 'no-store' });
    const members = mRes.ok ? await mRes.json() : [];

    return {
      id: group.id,
      code: group.code,
      name: group.name,
      created_by: group.created_by,
      created_at: group.created_at,
      checkpoint: group.checkpoint_lat && group.checkpoint_lng ? {
        name: group.checkpoint_name || 'Titik Kumpul',
        latitude: group.checkpoint_lat,
        longitude: group.checkpoint_lng,
        description: group.checkpoint_desc || ''
      } : null,
      members: members || []
    };
  } catch (e) {
    console.error('getGroupByCodeFromDb error:', e);
    return null;
  }
}

// 2. Buat Grup Baru di Supabase
export async function insertGroupToDb(group: {
  code: string;
  name: string;
  created_by: string;
  checkpoint_name?: string;
  checkpoint_lat?: number;
  checkpoint_lng?: number;
  checkpoint_desc?: string;
}) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/groups`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(group)
    });
    return res.ok;
  } catch (e) {
    console.error('insertGroupToDb error:', e);
    return false;
  }
}

// 3. Tambah / Update Anggota Grup
export async function upsertMemberToDb(member: {
  id: string;
  group_code: string;
  name: string;
  motorcycle_model?: string;
  license_plate?: string;
  avatar_url?: string;
  role: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  is_charging?: boolean;
  address?: string;
  is_active?: boolean;
}) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/group_members`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        ...member,
        updated_at: new Date().toISOString()
      })
    });
    return res.ok;
  } catch (e) {
    console.error('upsertMemberToDb error:', e);
    return false;
  }
}

// 4. Update Koordinat GPS Anggota
export async function updateMemberLocationInDb(
  memberId: string,
  loc: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    battery_level?: number;
    is_charging?: boolean;
    address?: string;
    is_active?: boolean;
  }
) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/group_members?id=eq.${encodeURIComponent(memberId)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ...loc,
        updated_at: new Date().toISOString()
      })
    });
    return res.ok;
  } catch (e) {
    console.error('updateMemberLocationInDb error:', e);
    return false;
  }
}

// 5. Update Titik Tujuan Checkpoint Grup
export async function updateGroupCheckpointInDb(
  code: string,
  checkpoint: {
    name: string;
    latitude: number;
    longitude: number;
    description?: string;
  }
) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/groups?code=eq.${encodeURIComponent(code)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        checkpoint_name: checkpoint.name,
        checkpoint_lat: checkpoint.latitude,
        checkpoint_lng: checkpoint.longitude,
        checkpoint_desc: checkpoint.description || '',
        updated_at: new Date().toISOString()
      })
    });
    return res.ok;
  } catch (e) {
    console.error('updateGroupCheckpointInDb error:', e);
    return false;
  }
}

// 6. Hapus Rider dari Grup (Saat Keluar dari Grup)
export async function deleteMemberFromDb(memberId: string) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/group_members?id=eq.${encodeURIComponent(memberId)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers
    });
    return res.ok;
  } catch (e) {
    console.error('deleteMemberFromDb error:', e);
    return false;
  }
}

// 7. Bubarkan Grup & Hapus Semua Anggota (Saat Road Captain Keluar)
export async function disbandGroupInDb(code: string) {
  try {
    // Hapus semua members di grup ini
    await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_code=eq.${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers
    });
    // Hapus grup
    await fetch(`${SUPABASE_URL}/rest/v1/groups?code=eq.${encodeURIComponent(code)}`, {
      method: 'DELETE',
      headers
    });
    return true;
  } catch (e) {
    console.error('disbandGroupInDb error:', e);
    return false;
  }
}


