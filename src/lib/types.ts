export interface Checkpoint {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  is_active?: boolean;
}

export interface GroupMember {
  id: string;
  group_code: string;
  name: string;
  motorcycle_model?: string;
  license_plate?: string;
  avatar_url?: string;
  role: 'Road Captain' | 'Sweeper' | 'Anggota Konvoi' | 'Medis' | 'Logistik';
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  battery_level?: number;
  is_charging?: boolean;
  address?: string;
  updated_at: string;
  is_active: boolean;
}

export interface ConvoyGroup {
  id: string;
  code: string;
  name: string;
  created_by: string;
  checkpoint?: Checkpoint | null;
  members: GroupMember[];
  created_at: string;
}

export interface Rider {
  id: string;
  phone_number: string;
  full_name: string;
  motorcycle_model?: string;
  license_plate?: string;
  avatar_url?: string;
  role: 'Road Captain' | 'Sweeper' | 'Anggota Konvoi' | 'Medis / Rescue' | 'Logistik';
  operator_name?: string;
  region_origin?: string;
  emergency_contact?: string;
  notes?: string;
  created_at?: string;
}

export interface RiderLocation {
  id?: number | string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  battery_level?: number;
  is_charging?: boolean;
  address?: string;
  created_at?: string;
}

export interface ConvoySession {
  id: string;
  token: string;
  rider_id: string;
  rider?: Rider;
  convoy_name: string;
  road_captain_name: string;
  status: 'active' | 'ended' | 'rejected' | 'standby';
  created_at?: string;
  latest_location?: RiderLocation;
}
