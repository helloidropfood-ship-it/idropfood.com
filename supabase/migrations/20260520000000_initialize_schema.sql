-- Supabase Migration: 20260520000000_initialize_schema.sql
-- Description: Establishes schema, security roles, RLS policies, PostgreSQL business functions, and seed data for iDropFood.

-- ==========================================
-- 1. CLEANUP EXISTING TABLES (IF RETRYING)
-- ==========================================
DROP TRIGGER IF EXISTS bookings_booked_count_trigger ON public.bookings;
DROP FUNCTION IF EXISTS update_window_booked_count();
DROP FUNCTION IF EXISTS approve_purchase(UUID, UUID);
DROP FUNCTION IF EXISTS reject_purchase(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS schedule_booking(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_draft_booking_for_checkout(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS cancel_booking_before_cutoff(UUID);
DROP FUNCTION IF EXISTS lock_booking_after_cutoff(UUID);
DROP FUNCTION IF EXISTS mark_booking_delivered(UUID);
DROP FUNCTION IF EXISTS mark_booking_missed(UUID);
DROP FUNCTION IF EXISTS get_admin_role();

DROP TABLE IF EXISTS public.payment_settings CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.drop_windows CASCADE;
DROP TABLE IF EXISTS public.payment_proofs CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ==========================================
-- 2. CREATE SCHEMAS & TABLES
-- ==========================================

-- A. Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY, -- References auth.users.id
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL, -- WhatsApp number used for identity
    email VARCHAR(255) NULL,
    company VARCHAR(100) NOT NULL DEFAULT 'Shahrah-e-Faisal',
    floor VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    delivery_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- B. Admin Users Table
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL, -- References auth.users.id
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'operations')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- C. Plans Table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    meal_credits INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    validity_days INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN DEFAULT true NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- D. Purchases Table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    total_credits INTEGER NOT NULL,
    remaining_credits INTEGER NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pending_payment' NOT NULL CHECK (payment_status IN ('pending_payment', 'proof_uploaded', 'approved', 'rejected', 'refunded')),
    admin_notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- E. Payment Proofs Table
CREATE TABLE public.payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    proof_image_url TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    submitted_amount DECIMAL(10, 2) NOT NULL,
    transaction_reference VARCHAR(255) NULL,
    status VARCHAR(30) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT NULL,
    reviewed_by UUID REFERENCES public.admin_users(id) NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- F. Drop Windows Table
CREATE TABLE public.drop_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    window_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 20,
    booked_count INTEGER DEFAULT 0 NOT NULL, -- Managed via trigger
    cutoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'locked', 'full', 'completed', 'hidden/cancelled')),
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, window_name)
);

-- G. Menu Items Table
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_window_id UUID REFERENCES public.drop_windows(id) ON DELETE CASCADE NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    allergens VARCHAR(255) NULL,
    image_url TEXT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- H. Bookings Table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
    drop_window_id UUID REFERENCES public.drop_windows(id) NOT NULL,
    menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'scheduled', 'locked', 'cancelled', 'delivered', 'missed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    locked_at TIMESTAMP WITH TIME ZONE NULL
);

-- I. Payment Settings Table
CREATE TABLE public.payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NULL,
    bank_account_title VARCHAR(255) NULL,
    bank_account_number VARCHAR(255) NULL,
    bank_iban VARCHAR(255) NULL,
    raast_id VARCHAR(255) NULL,
    jazzcash_number VARCHAR(255) NULL,
    easypaisa_number VARCHAR(255) NULL,
    instruction_text TEXT NULL,
    trial_drop_active BOOLEAN DEFAULT true NOT NULL,
    launch_messaging TEXT NULL,
    contact_whatsapp VARCHAR(50) NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. ACCESS CONTROL HELPERS
-- ==========================================

-- Helper to retrieve admin role based on admin_users table
CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS VARCHAR AS $$
BEGIN
  RETURN (
    SELECT role FROM public.admin_users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. CAPACITY TRIGGERS (booked_count)
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_window_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status IN ('scheduled', 'locked', 'delivered', 'missed') THEN
      UPDATE public.drop_windows
      SET booked_count = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.bookings
        WHERE drop_window_id = NEW.drop_window_id
          AND status IN ('scheduled', 'locked', 'delivered', 'missed')
      )
      WHERE id = NEW.drop_window_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update count for the new/current drop window
    UPDATE public.drop_windows
    SET booked_count = (
      SELECT COALESCE(COUNT(*), 0)
      FROM public.bookings
      WHERE drop_window_id = NEW.drop_window_id
        AND status IN ('scheduled', 'locked', 'delivered', 'missed')
    )
    WHERE id = NEW.drop_window_id;

    -- If the drop window changed, update the old one as well
    IF OLD.drop_window_id <> NEW.drop_window_id THEN
      UPDATE public.drop_windows
      SET booked_count = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.bookings
        WHERE drop_window_id = OLD.drop_window_id
          AND status IN ('scheduled', 'locked', 'delivered', 'missed')
      )
      WHERE id = OLD.old_window_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('scheduled', 'locked', 'delivered', 'missed') THEN
      UPDATE public.drop_windows
      SET booked_count = (
        SELECT COALESCE(COUNT(*), 0)
        FROM public.bookings
        WHERE drop_window_id = OLD.drop_window_id
          AND status IN ('scheduled', 'locked', 'delivered', 'missed')
      )
      WHERE id = OLD.drop_window_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_booked_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_window_booked_count();

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drop_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
CREATE POLICY "Users can select own profile" 
ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile fields" 
ON public.users FOR UPDATE USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view and manage all profiles" 
ON public.users FOR ALL USING (public.get_admin_role() IN ('owner', 'admin', 'operations'));

-- 2. Admin users policies
CREATE POLICY "Admins can view admins" 
ON public.admin_users FOR SELECT USING (public.get_admin_role() IN ('owner', 'admin', 'operations'));

CREATE POLICY "Owners can manage admins" 
ON public.admin_users FOR ALL USING (public.get_admin_role() = 'owner');

-- 3. Plans policies
CREATE POLICY "Public users can view active plans" 
ON public.plans FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage plans" 
ON public.plans FOR ALL USING (public.get_admin_role() IN ('owner', 'admin'));

-- 4. Purchases policies
CREATE POLICY "Customers can select own purchases" 
ON public.purchases FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert own purchases" 
ON public.purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can select/update purchases" 
ON public.purchases FOR ALL USING (public.get_admin_role() IN ('owner', 'admin'));

-- 5. Payment proofs policies
CREATE POLICY "Customers can select own payment proofs" 
ON public.payment_proofs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE purchases.id = payment_proofs.purchase_id 
      AND purchases.user_id = auth.uid()
  )
);

CREATE POLICY "Customers can insert own payment proofs" 
ON public.payment_proofs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchases 
    WHERE purchases.id = purchase_id 
      AND purchases.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can select/update payment proofs" 
ON public.payment_proofs FOR ALL USING (public.get_admin_role() IN ('owner', 'admin'));

-- 6. Drop windows policies
CREATE POLICY "Public users can view active drop windows" 
ON public.drop_windows FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage drop windows" 
ON public.drop_windows FOR ALL USING (public.get_admin_role() IN ('owner', 'admin'));

-- 7. Menu items policies
CREATE POLICY "Public users can view menu items" 
ON public.menu_items FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage menu items" 
ON public.menu_items FOR ALL USING (public.get_admin_role() IN ('owner', 'admin'));

-- 8. Bookings policies
CREATE POLICY "Customers can select own bookings" 
ON public.bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert/update own bookings" 
ON public.bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage bookings" 
ON public.bookings FOR ALL USING (public.get_admin_role() IN ('owner', 'admin', 'operations'));

-- 9. Payment settings policies
CREATE POLICY "Public users can view settings" 
ON public.payment_settings FOR SELECT USING (true);

CREATE POLICY "Owners can manage payment settings" 
ON public.payment_settings FOR ALL USING (public.get_admin_role() = 'owner');


-- ==========================================
-- 6. CORE BACKEND BUSINESS FUNCTIONS
-- ==========================================

-- Function: Approve Purchase
-- Set payment proof & purchase payment_status to approved.
-- Process drafts: convert to scheduled if capacity/cutoff checks pass, else cancel and do not consume credits.
CREATE OR REPLACE FUNCTION public.approve_purchase(p_purchase_id UUID, p_reviewer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_purchase RECORD;
  v_total_credits INT;
  v_scheduled_count INT := 0;
  v_cancelled_count INT := 0;
  v_booking RECORD;
  v_capacity_left INT;
  v_scheduled_ids UUID[] := '{}';
  v_cancelled_ids UUID[] := '{}';
  v_result JSONB;
BEGIN
  -- 1. Check reviewer permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = p_reviewer_id AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Reviewer must be an admin or owner.';
  END IF;

  -- 2. Fetch and lock purchase for updates
  SELECT * INTO v_purchase FROM public.purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found.';
  END IF;

  IF v_purchase.payment_status = 'approved' THEN
    RAISE EXCEPTION 'Purchase has already been approved.';
  END IF;

  v_total_credits := v_purchase.total_credits;

  -- 3. Loop through associated draft bookings
  FOR v_booking IN 
    SELECT b.*, w.capacity, w.booked_count, w.cutoff_time, w.active, w.status as window_status
    FROM public.bookings b
    JOIN public.drop_windows w ON b.drop_window_id = w.id
    WHERE b.purchase_id = p_purchase_id AND b.status = 'draft'
  LOOP
    -- Calculate actual slots left
    v_capacity_left := v_booking.capacity - v_booking.booked_count;

    -- Verify capacity, cutoff time, and status
    IF v_booking.active 
       AND v_booking.window_status = 'open' 
       AND now() < v_booking.cutoff_time 
       AND v_capacity_left > 0 
    THEN
      -- Convert draft to scheduled
      UPDATE public.bookings 
      SET status = 'scheduled' 
      WHERE id = v_booking.id;

      v_scheduled_count := v_scheduled_count + 1;
      v_scheduled_ids := array_append(v_scheduled_ids, v_booking.id);
    ELSE
      -- Cancel draft without consuming credits
      UPDATE public.bookings 
      SET status = 'cancelled' 
      WHERE id = v_booking.id;

      v_cancelled_count := v_cancelled_count + 1;
      v_cancelled_ids := array_append(v_cancelled_ids, v_booking.id);
    END IF;
  END LOOP;

  -- 4. Update purchase balance. Credits are only consumed for successfully scheduled draft bookings.
  UPDATE public.purchases
  SET payment_status = 'approved',
      remaining_credits = v_total_credits - v_scheduled_count,
      admin_notes = COALESCE(admin_notes, '') || ' [Auto-approved: ' || v_scheduled_count || ' scheduled, ' || v_cancelled_count || ' cancelled]'
  WHERE id = p_purchase_id;

  -- 5. Update payment proof status
  UPDATE public.payment_proofs
  SET status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  WHERE purchase_id = p_purchase_id;

  -- 6. Formulate return object
  v_result := jsonb_build_object(
    'purchase_id', p_purchase_id,
    'payment_status', 'approved',
    'total_credits', v_total_credits,
    'remaining_credits', v_total_credits - v_scheduled_count,
    'scheduled_booking_ids', to_jsonb(v_scheduled_ids),
    'cancelled_booking_ids', to_jsonb(v_cancelled_ids)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reject Purchase
CREATE OR REPLACE FUNCTION public.reject_purchase(p_purchase_id UUID, p_reviewer_id UUID, p_notes TEXT)
RETURNS JSONB AS $$
DECLARE
  v_purchase RECORD;
  v_cancelled_ids UUID[] := '{}';
  v_booking RECORD;
  v_result JSONB;
BEGIN
  -- 1. Check reviewer permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = p_reviewer_id AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Reviewer must be an admin or owner.';
  END IF;

  -- 2. Fetch purchase
  SELECT * INTO v_purchase FROM public.purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found.';
  END IF;

  -- 3. Transition all associated draft bookings to cancelled
  FOR v_booking IN 
    SELECT id FROM public.bookings WHERE purchase_id = p_purchase_id AND status = 'draft'
  LOOP
    UPDATE public.bookings SET status = 'cancelled' WHERE id = v_booking.id;
    v_cancelled_ids := array_append(v_cancelled_ids, v_booking.id);
  END LOOP;

  -- 4. Update purchase
  UPDATE public.purchases
  SET payment_status = 'rejected',
      remaining_credits = 0,
      admin_notes = p_notes
  WHERE id = p_purchase_id;

  -- 5. Update proof
  UPDATE public.payment_proofs
  SET status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = now(),
      admin_notes = p_notes
  WHERE purchase_id = p_purchase_id;

  v_result := jsonb_build_object(
    'purchase_id', p_purchase_id,
    'payment_status', 'rejected',
    'cancelled_booking_ids', to_jsonb(v_cancelled_ids)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Schedule Booking
CREATE OR REPLACE FUNCTION public.schedule_booking(
  p_user_id UUID,
  p_drop_window_id UUID,
  p_purchase_id UUID,
  p_menu_item_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_purchase RECORD;
  v_window RECORD;
  v_booking_id UUID;
BEGIN
  -- 1. Lock and inspect purchase
  SELECT * INTO v_purchase FROM public.purchases 
  WHERE id = p_purchase_id AND user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approved purchase not found for this user.';
  END IF;

  IF v_purchase.payment_status <> 'approved' THEN
    RAISE EXCEPTION 'Credits are locked. Purchase payment status is %.', v_purchase.payment_status;
  END IF;

  IF v_purchase.remaining_credits <= 0 THEN
    RAISE EXCEPTION 'Insufficient credits.';
  END IF;

  -- 2. Inspect window
  SELECT * INTO v_window FROM public.drop_windows WHERE id = p_drop_window_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drop window not found.';
  END IF;

  IF NOT v_window.active OR v_window.status <> 'open' THEN
    RAISE EXCEPTION 'Drop window is not active or open.';
  END IF;

  -- Cutoff handling: Store in UTC, compare directly against now()
  IF now() >= v_window.cutoff_time THEN
    RAISE EXCEPTION 'Cutoff limit passed. Cannot schedule.';
  END IF;

  -- Verify capacity
  IF v_window.booked_count >= v_window.capacity THEN
    RAISE EXCEPTION 'Drop window capacity is full.';
  END IF;

  -- 3. Perform insert and decrement remaining credits
  INSERT INTO public.bookings (user_id, purchase_id, drop_window_id, menu_item_id, status)
  VALUES (p_user_id, p_purchase_id, p_drop_window_id, p_menu_item_id, 'scheduled')
  RETURNING id INTO v_booking_id;

  UPDATE public.purchases
  SET remaining_credits = remaining_credits - 1
  WHERE id = p_purchase_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create Draft Booking for Checkout
CREATE OR REPLACE FUNCTION public.create_draft_booking_for_checkout(
  p_user_id UUID,
  p_drop_window_id UUID,
  p_purchase_id UUID,
  p_menu_item_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_window RECORD;
  v_booking_id UUID;
BEGIN
  -- Verify window availability for draft placing
  SELECT * INTO v_window FROM public.drop_windows WHERE id = p_drop_window_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Drop window not found.';
  END IF;

  IF NOT v_window.active OR v_window.status <> 'open' THEN
    RAISE EXCEPTION 'Drop window is not active or open.';
  END IF;

  -- Verify cutoff time
  IF now() >= v_window.cutoff_time THEN
    RAISE EXCEPTION 'Cutoff limit passed. Cannot place checkout draft.';
  END IF;

  -- Verify capacity
  IF v_window.booked_count >= v_window.capacity THEN
    RAISE EXCEPTION 'Drop window is full. Capacity exceeded.';
  END IF;

  -- Place draft. Does NOT consume credits, does NOT count toward booked_count.
  INSERT INTO public.bookings (user_id, purchase_id, drop_window_id, menu_item_id, status)
  VALUES (p_user_id, p_purchase_id, p_drop_window_id, p_menu_item_id, 'draft')
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel Booking Before Cutoff
CREATE OR REPLACE FUNCTION public.cancel_booking_before_cutoff(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_window RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_booking.status <> 'scheduled' THEN
    RAISE EXCEPTION 'Only scheduled bookings can be cancelled. Current status is %.', v_booking.status;
  END IF;

  SELECT * INTO v_window FROM public.drop_windows WHERE id = v_booking.drop_window_id;
  
  -- Verify cutoff
  IF now() >= v_window.cutoff_time THEN
    RAISE EXCEPTION 'Cannot cancel booking after cutoff time.';
  END IF;

  -- Update booking status and refund credit
  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  
  UPDATE public.purchases 
  SET remaining_credits = remaining_credits + 1 
  WHERE id = v_booking.purchase_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Lock Booking After Cutoff
CREATE OR REPLACE FUNCTION public.lock_booking_after_cutoff(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_window RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found.';
  END IF;

  IF v_booking.status <> 'scheduled' THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_window FROM public.drop_windows WHERE id = v_booking.drop_window_id;
  
  IF now() >= v_window.cutoff_time THEN
    UPDATE public.bookings 
    SET status = 'locked', locked_at = now() 
    WHERE id = p_booking_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark Booking Delivered
CREATE OR REPLACE FUNCTION public.mark_booking_delivered(p_booking_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.bookings 
  SET status = 'delivered' 
  WHERE id = p_booking_id AND status = 'locked';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark Booking Missed
CREATE OR REPLACE FUNCTION public.mark_booking_missed(p_booking_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.bookings 
  SET status = 'missed' 
  WHERE id = p_booking_id AND status = 'locked';
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 7. SEED DATA GENERATION
-- ==========================================

-- Seed Pricing Plans
INSERT INTO public.plans (name, description, meal_credits, price, validity_days, display_order)
VALUES 
  ('Trial Drop', 'Single test meal experience', 1, 450.00, 7, 1),
  ('Lite Pack', 'Basic weekly support', 3, 1300.00, 14, 2),
  ('Core Pack', 'Standard workplace meal bundle', 8, 3200.00, 30, 3),
  ('Full Pack', 'Complete month-long lunch schedule', 16, 6000.00, 45, 4);

-- Seed Drop Windows
-- Note: Karachi 8:00 PM is UTC 3:00 PM. Cutoff times are explicitly timezone-aware in UTC.
INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
VALUES 
  (current_date + interval '1 day', 'Day Drop', '12:30:00', '14:00:00', 20, (current_date::timestamp + interval '20 hours')::timestamptz, 'open'),
  (current_date + interval '1 day', 'Night Drop', '19:30:00', '21:00:00', 20, (current_date::timestamp + interval '20 hours')::timestamptz, 'open'),
  (current_date + interval '2 day', 'Day Drop', '12:30:00', '14:00:00', 20, ((current_date + interval '1 day')::timestamp + interval '20 hours')::timestamptz, 'open'),
  (current_date + interval '2 day', 'Night Drop', '19:30:00', '21:00:00', 20, ((current_date + interval '1 day')::timestamp + interval '20 hours')::timestamptz, 'open');

-- Seed Sample Menu Items
INSERT INTO public.menu_items (drop_window_id, meal_name, description, allergens, active)
SELECT id, 'Chicken Biryani', 'Traditional aromatic basmati rice with spiced chicken', 'Gluten-free option available', true
FROM public.drop_windows WHERE window_name = 'Day Drop' LIMIT 1;

INSERT INTO public.menu_items (drop_window_id, meal_name, description, allergens, active)
SELECT id, 'Beef Nihari & Naan', 'Slow-cooked shank beef stew served with hot naan bread', 'Gluten, Wheat', true
FROM public.drop_windows WHERE window_name = 'Night Drop' LIMIT 1;

-- Seed Settings
INSERT INTO public.payment_settings (
  bank_name, bank_account_title, bank_account_number, bank_iban, raast_id, jazzcash_number, easypaisa_number, 
  instruction_text, trial_drop_active, launch_messaging, contact_whatsapp
) VALUES (
  'Meezan Bank Limited', 
  'iDropFood Pakistan', 
  '12040109923891', 
  'PK30MEZN0012040109923891', 
  'idropfood@raast', 
  '03001234567', 
  '03451234567', 
  'Please upload a clear screenshot of your receipt showing reference ID and date.', 
  true, 
  'Launching first phase for Shahrah-e-Faisal active corporate locations.', 
  '+923001234567'
);
