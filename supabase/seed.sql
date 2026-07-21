-- ===================================================
-- BOARDROOM RESERVATION SYSTEM - SEED DATA
-- ===================================================

-- 1. Insert Default Meeting Rooms
INSERT INTO public.rooms (name, location)
VALUES 
  ('Boardroom', 'Upper Floor'),
  ('Meeting Room', 'First Floor')
ON CONFLICT (name) DO UPDATE SET location = EXCLUDED.location;
