-- Migration: 20260521000002_users_auth_integration.sql
-- Description: Adds auth_user_id column to public.users and updates Row Level Security (RLS) policies to protect customer profiles.

-- ==========================================
-- 1. MODIFY public.users TABLE
-- ==========================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id);

-- Ensure public.users.id defaults to a random UUID if not already
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ==========================================
-- 2. REVISE RLS POLICIES FOR public.users
-- ==========================================
DROP POLICY IF EXISTS "Users can select own profile" ON public.users;
CREATE POLICY "Users can select own profile" 
ON public.users FOR SELECT USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can update own profile fields" ON public.users;
CREATE POLICY "Users can update own profile fields" 
ON public.users FOR UPDATE USING (auth.uid() = auth_user_id) 
WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- ==========================================
-- 3. REVISE RLS POLICIES FOR public.purchases
-- ==========================================
DROP POLICY IF EXISTS "Customers can select own purchases" ON public.purchases;
CREATE POLICY "Customers can select own purchases" 
ON public.purchases FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = purchases.user_id 
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert own purchases" ON public.purchases;
CREATE POLICY "Customers can insert own purchases" 
ON public.purchases FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid()
  )
);

-- ==========================================
-- 4. REVISE RLS POLICIES FOR public.payment_proofs
-- ==========================================
DROP POLICY IF EXISTS "Customers can select own payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers can select own payment proofs" 
ON public.payment_proofs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.purchases 
    JOIN public.users ON purchases.user_id = users.id
    WHERE purchases.id = payment_proofs.purchase_id 
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert own payment proofs" ON public.payment_proofs;
CREATE POLICY "Customers can insert own payment proofs" 
ON public.payment_proofs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.purchases 
    JOIN public.users ON purchases.user_id = users.id
    WHERE purchases.id = purchase_id 
      AND users.auth_user_id = auth.uid()
  )
);

-- ==========================================
-- 5. REVISE RLS POLICIES FOR public.bookings
-- ==========================================
DROP POLICY IF EXISTS "Customers can select own bookings" ON public.bookings;
CREATE POLICY "Customers can select own bookings" 
ON public.bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = bookings.user_id 
      AND users.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can insert/update own bookings" ON public.bookings;
CREATE POLICY "Customers can insert/update own bookings" 
ON public.bookings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = user_id 
      AND users.auth_user_id = auth.uid()
  )
);
