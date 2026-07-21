-- ===================================================
-- BOARDROOM RESERVATION SYSTEM - DATABASE SCHEMA
-- ===================================================

-- 1. Create Profiles table extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for fast query of reservations by room and time range
CREATE INDEX IF NOT EXISTS idx_reservations_room_time ON public.reservations (room_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON public.reservations (user_id);

-- 4. Automatic Profile Creation Trigger & First User = Admin Logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
  user_name TEXT;
BEGIN
  -- Determine user role: First user is 'admin', subsequent users are 'user'
  SELECT count(*) INTO user_count FROM public.profiles;

  -- Extract name from email or metadata if available
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile role"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ROOMS POLICIES
CREATE POLICY "Rooms are viewable by everyone"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update rooms"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Only admins can delete rooms"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- RESERVATIONS POLICIES
CREATE POLICY "Reservations are viewable by authenticated users"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own reservations"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations or admins can update any"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete their own reservations or admins can delete any"
  ON public.reservations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
