-- ==============================================================================
-- RIDESYNC - SCHEMA GRUP KONVOI PERSISTEN (SUPABASE POSTGRESQL)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabel Grup Konvoi (groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_by VARCHAR(120) NOT NULL,
    checkpoint_name VARCHAR(150),
    checkpoint_lat DOUBLE PRECISION,
    checkpoint_lng DOUBLE PRECISION,
    checkpoint_desc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Anggota Grup Konvoi (group_members)
CREATE TABLE IF NOT EXISTS public.group_members (
    id VARCHAR(64) PRIMARY KEY,
    group_code VARCHAR(64) NOT NULL,
    name VARCHAR(120) NOT NULL,
    motorcycle_model VARCHAR(100),
    license_plate VARCHAR(30),
    avatar_url TEXT,
    role VARCHAR(60) DEFAULT 'Anggota Konvoi',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    speed DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION,
    battery_level INTEGER,
    is_charging BOOLEAN DEFAULT FALSE,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indeks Cepat
CREATE INDEX IF NOT EXISTS idx_group_code ON public.groups(code);
CREATE INDEX IF NOT EXISTS idx_group_members_code ON public.group_members(group_code);

-- 4. RLS Public Access
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on group_members" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
