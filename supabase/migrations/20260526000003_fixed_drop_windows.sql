-- Create fixed_drop_windows table
CREATE TABLE IF NOT EXISTS public.fixed_drop_windows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  window_name TEXT NOT NULL,
  subtitle TEXT,
  display_time TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.fixed_drop_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on fixed_drop_windows"
ON public.fixed_drop_windows FOR SELECT
USING (true);

CREATE POLICY "Enable insert for admin users on fixed_drop_windows"
ON public.fixed_drop_windows FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Enable update for admin users on fixed_drop_windows"
ON public.fixed_drop_windows FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Enable delete for admin users on fixed_drop_windows"
ON public.fixed_drop_windows FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.auth_user_id = auth.uid()
  )
);

-- Insert defaults
INSERT INTO public.fixed_drop_windows (window_name, subtitle, display_time, description, display_order)
VALUES 
  ('Day Drop', 'Morning & Afternoon Shifts', '12:30 PM – 2:00 PM', 'Cutoff locks at 8:00 PM the previous day. Perfect lunch drop-off for standard day shifts, operations leads, and management.', 1),
  ('Night Drop', 'Night & Midnight Shifts', '10:30 PM – 12:00 AM', 'Cutoff locks at 8:00 PM the previous day. Hot, fresh dinner delivered right when most cafeterias close down.', 2)
ON CONFLICT DO NOTHING;
