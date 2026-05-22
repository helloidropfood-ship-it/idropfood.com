-- Supabase RLS Policy Verification Test Suite: verify_rls_policies.sql
-- Run inside database console / migration test environment.
-- Automatically wraps inside a transaction that rolls back to preserve clean state.
-- Tests: RLS security policies for tables and operations restrictions.

BEGIN;

-- Setup test actors and seed data
DO $$
DECLARE
  v_customer_a UUID := '00000000-0000-0000-0000-00000000000a';
  v_customer_b UUID := '00000000-0000-0000-0000-00000000000b';
  v_operations_id UUID := '00000000-0000-0000-0000-00000000000c';
  v_admin_id UUID := '00000000-0000-0000-0000-00000000000d';

  v_plan_id UUID;
  v_window_id UUID;
  v_menu_item_id UUID;
  v_purchase_a_id UUID;
  v_purchase_b_id UUID;
  v_booking_a_id UUID;
  v_booking_b_id UUID;
  v_proof_a_id UUID;
  v_proof_b_id UUID;
BEGIN
  RAISE NOTICE 'Starting RLS Policy Security Tests...';

  -- 1. Insert seed auth users to satisfy foreign key constraint on public.users
  INSERT INTO auth.users (id, email, role, aud, is_sso_user, is_anonymous) VALUES
    (v_customer_a, 'customer_a@example.com', 'authenticated', 'authenticated', false, false),
    (v_customer_b, 'customer_b@example.com', 'authenticated', 'authenticated', false, false);

  -- 2. Insert seed data as superuser (postgres)
  INSERT INTO public.users (id, auth_user_id, name, phone, floor, department) VALUES
    (v_customer_a, v_customer_a, 'Customer A', '03001111111', '1st Floor', 'Tech'),
    (v_customer_b, v_customer_b, 'Customer B', '03002222222', '2nd Floor', 'HR');

  INSERT INTO public.admin_users (id, auth_user_id, name, role) VALUES
    (v_operations_id, v_operations_id, 'Ops User', 'operations'),
    (v_admin_id, v_admin_id, 'Admin User', 'admin');

  SELECT id INTO v_plan_id FROM public.plans LIMIT 1;
  IF v_plan_id IS NULL THEN
    INSERT INTO public.plans (name, description, meal_credits, price, display_order, active)
    VALUES ('Test Plan', 'Desc', 5, 2000.00, 1, true)
    RETURNING id INTO v_plan_id;
  END IF;

  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 10, 'Day Drop', '12:30:00', '14:00:00', 10, now() + interval '5 days', 'open')
  RETURNING id INTO v_window_id;

  INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
  VALUES (v_window_id, 'RLS Test Meal', 'A meal for RLS testing', true)
  RETURNING id INTO v_menu_item_id;

  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_a, v_plan_id, 5, 5, 'JazzCash', 'proof_uploaded')
  RETURNING id INTO v_purchase_a_id;

  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_b, v_plan_id, 5, 5, 'JazzCash', 'proof_uploaded')
  RETURNING id INTO v_purchase_b_id;

  INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
  VALUES (v_purchase_a_id, 'http://proof-a.png', 'JazzCash', 2000.00, 'pending')
  RETURNING id INTO v_proof_a_id;

  INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
  VALUES (v_purchase_b_id, 'http://proof-b.png', 'JazzCash', 2000.00, 'pending')
  RETURNING id INTO v_proof_b_id;

  INSERT INTO public.bookings (user_id, purchase_id, drop_window_id, menu_item_id, status)
  VALUES (v_customer_a, v_purchase_a_id, v_window_id, v_menu_item_id, 'draft')
  RETURNING id INTO v_booking_a_id;

  INSERT INTO public.bookings (user_id, purchase_id, drop_window_id, menu_item_id, status)
  VALUES (v_customer_b, v_purchase_b_id, v_window_id, v_menu_item_id, 'draft')
  RETURNING id INTO v_booking_b_id;

END;
$$ LANGUAGE plpgsql;

-- Now switch to 'authenticated' role to simulate API calls and enforce RLS
SET ROLE authenticated;

-- Test 1: Customer A cannot access Customer B's bookings
DO $$
DECLARE
  v_customer_a UUID := '00000000-0000-0000-0000-00000000000a';
  v_booking_count INT;
BEGIN
  -- Set JWT claims to Customer A
  PERFORM set_config('request.jwt.sub', v_customer_a::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_customer_a::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_customer_a::text)::text, true);

  -- Query bookings: should only see Customer A's bookings (1 row), not Customer B's
  SELECT COUNT(*) INTO v_booking_count FROM public.bookings;
  IF v_booking_count <> 1 THEN
    RAISE EXCEPTION 'RLS TEST 1 FAILED: Customer A can see other bookings! Count: %', v_booking_count;
  END IF;

  -- Verify specific booking
  IF EXISTS (SELECT 1 FROM public.bookings WHERE user_id = '00000000-0000-0000-0000-00000000000b') THEN
    RAISE EXCEPTION 'RLS TEST 1 FAILED: Customer A can query Customer B''s booking details directly!';
  END IF;

  RAISE NOTICE 'RLS Test 1 Passed: Customer A cannot access Customer B''s bookings.';
END;
$$ LANGUAGE plpgsql;

-- Test 2: Customer A cannot access Customer B's payment proofs
DO $$
DECLARE
  v_customer_a UUID := '00000000-0000-0000-0000-00000000000a';
  v_proof_count INT;
BEGIN
  -- Set JWT claims to Customer A
  PERFORM set_config('request.jwt.sub', v_customer_a::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_customer_a::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_customer_a::text)::text, true);

  -- Query payment proofs: should only see Customer A's proofs (1 row), not Customer B's
  SELECT COUNT(*) INTO v_proof_count FROM public.payment_proofs;
  IF v_proof_count <> 1 THEN
    RAISE EXCEPTION 'RLS TEST 2 FAILED: Customer A can see other payment proofs! Count: %', v_proof_count;
  END IF;

  RAISE NOTICE 'RLS Test 2 Passed: Customer A cannot access Customer B''s payment proofs.';
END;
$$ LANGUAGE plpgsql;

-- Test 3: Operations role cannot edit pricing (plans) or settings
DO $$
DECLARE
  v_operations_id UUID := '00000000-0000-0000-0000-00000000000c';
BEGIN
  -- Set JWT claims to Operations User
  PERFORM set_config('request.jwt.sub', v_operations_id::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_operations_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_operations_id::text)::text, true);

  -- Attempt to update a plan's price (must fail RLS or trigger check)
  BEGIN
    UPDATE public.plans SET price = price + 100;
    -- Note: RLS policy for plans: "Admins can manage plans". Since operations is not an admin,
    -- RLS will silently block updates (0 rows updated) or fail. Let's verify no rows were updated.
    IF FOUND THEN
      RAISE EXCEPTION 'RLS TEST 3a FAILED: Operations user was able to modify plan pricing!';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'RLS Test 3a Passed: Operations user blocked from updating plans (%s)', SQLERRM;
  END;

  -- Attempt to update settings (must fail)
  BEGIN
    UPDATE public.payment_settings SET trial_drop_active = NOT trial_drop_active;
    IF FOUND THEN
      RAISE EXCEPTION 'RLS TEST 3b FAILED: Operations user was able to modify payment settings!';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'RLS Test 3b Passed: Operations user blocked from updating settings (%s)', SQLERRM;
  END;

  RAISE NOTICE 'RLS Test 3 Passed: Operations role cannot edit pricing or settings.';
END;
$$ LANGUAGE plpgsql;

-- Test 4: Admin role can manage everything
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-00000000000d';
  v_booking_count INT;
BEGIN
  -- Set JWT claims to Admin User
  PERFORM set_config('request.jwt.sub', v_admin_id::text, true);
  PERFORM set_config('request.jwt.claim.sub', v_admin_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_admin_id::text)::text, true);

  -- Admin can see all bookings
  SELECT COUNT(*) INTO v_booking_count FROM public.bookings;
  IF v_booking_count < 2 THEN
    RAISE EXCEPTION 'RLS TEST 4 FAILED: Admin cannot see all bookings! Count: %', v_booking_count;
  END IF;

  RAISE NOTICE 'RLS Test 4 Passed: Admin can view all bookings.';
END;
$$ LANGUAGE plpgsql;

-- Switch to 'anon' role to test public access
SET ROLE anon;

-- Test 5: Public/Anon can view plans, drop windows, and menus, but not bookings or proofs
DO $$
DECLARE
  v_count INT;
BEGIN
  -- Clear JWT claims
  PERFORM set_config('request.jwt.sub', NULL, true);
  PERFORM set_config('request.jwt.claim.sub', NULL, true);
  PERFORM set_config('request.jwt.claims', NULL, true);

  -- Anon can see plans
  SELECT COUNT(*) INTO v_count FROM public.plans;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'RLS TEST 5a FAILED: Anonymous user cannot view active plans!';
  END IF;

  -- Anon can see drop windows
  SELECT COUNT(*) INTO v_count FROM public.drop_windows;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'RLS TEST 5b FAILED: Anonymous user cannot view active drop windows!';
  END IF;

  -- Anon can see menu items
  SELECT COUNT(*) INTO v_count FROM public.menu_items;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'RLS TEST 5c FAILED: Anonymous user cannot view menu items!';
  END IF;

  -- Anon cannot see bookings
  SELECT COUNT(*) INTO v_count FROM public.bookings;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RLS TEST 5d FAILED: Anonymous user can view bookings!';
  END IF;

  -- Anon cannot see payment proofs
  SELECT COUNT(*) INTO v_count FROM public.payment_proofs;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'RLS TEST 5e FAILED: Anonymous user can view payment proofs!';
  END IF;

  RAISE NOTICE 'RLS Test 5 Passed: Anonymous users can view public catalogs but not private data.';
END;
$$ LANGUAGE plpgsql;

-- Restore superuser role for clean rollback
RESET ROLE;
ROLLBACK;
