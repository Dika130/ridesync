export interface Rider {
  id: string;
  phone_number: string;
  full_name: string;
  motorcycle_model?: string; // e.g. Honda CBR250RR, Yamaha NMAX
  license_plate?: string;    // e.g. B 1234 ABC
  avatar_url?: string;
  role: 'Road Captain' | 'Sweeper' | 'Anggota Konvoi' | 'Medis / Rescue' | 'Logistik';
  operator_name?: string;
  region_origin?: string;
  emergency_contact?: string;
  notes?: string;
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

export interface Checkpoint {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  is_active?: boolean;
}

export interface RiderLocation {
  id?: number | string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number; // meter
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  altitude?: number;
  battery_level?: number; // 0-100
  is_charging?: boolean;
  address?: string;
  created_at?: string;
}
