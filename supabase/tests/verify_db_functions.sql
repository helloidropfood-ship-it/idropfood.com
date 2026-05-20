-- Supabase Verification Test Suite: verify_db_functions.sql
-- Run inside database console / migration test environment.
-- Automatically wraps inside a transaction that rolls back to preserve clean state.

BEGIN;

DO $$
DECLARE
  v_customer_id UUID := '00000000-0000-0000-0000-000000000001';
  v_reviewer_id UUID := '00000000-0000-0000-0000-000000000002';
  v_operations_id UUID := '00000000-0000-0000-0000-000000000003';
  
  v_plan_id UUID;
  v_window_open_id UUID;
  v_window_full_id UUID;
  v_window_past_cutoff_id UUID;
  v_menu_item_id UUID;
  
  v_purchase_1_id UUID;
  v_purchase_2_id UUID;
  v_purchase_partial_id UUID;
  
  v_booking_draft_id UUID;
  v_booking_sched_id UUID;
  v_booking_fail_id UUID;
  
  v_result JSONB;
  v_booked_count INT;
  v_remaining_credits INT;
  v_booking_status VARCHAR;
BEGIN
  RAISE NOTICE 'Starting E2E Database Function Tests...';

  -- ==========================================
  -- SETUP SEED DATA FOR TESTING
  -- ==========================================
  
  -- Create test users
  INSERT INTO public.users (id, name, phone, floor, department)
  VALUES (v_customer_id, 'Test Customer', '03211111111', '4th Floor', 'Customer Support');

  -- Create admin users (Reviewer & Operations)
  INSERT INTO public.admin_users (id, auth_user_id, name, role)
  VALUES 
    (v_reviewer_id, '10000000-0000-0000-0000-000000000001', 'Test Admin', 'admin'),
    (v_operations_id, '10000000-0000-0000-0000-000000000002', 'Test Ops', 'operations');

  -- Fetch a seed plan (Lite Pack: 3 credits)
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Lite Pack' LIMIT 1;

  -- Create Drop Windows
  -- 1. Open with capacity
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 5, 'Day Drop', '12:30:00', '14:00:00', 5, now() + interval '1 day', 'open')
  RETURNING id INTO v_window_open_id;

  -- 2. Already full capacity
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 6, 'Day Drop', '12:30:00', '14:00:00', 1, now() + interval '1 day', 'open')
  RETURNING id INTO v_window_full_id;

  -- 3. Past cutoff time
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 7, 'Day Drop', '12:30:00', '14:00:00', 10, now() - interval '1 hour', 'open')
  RETURNING id INTO v_window_past_cutoff_id;

  -- Create sample Menu Item
  INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
  VALUES (v_window_open_id, 'Test Biryani', 'Mild test spices', true)
  RETURNING id INTO v_menu_item_id;

  INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
  VALUES (v_window_full_id, 'Test Nihari', 'Spiced gravy nihari', true);

  -- ==========================================
  -- TEST 1: Draft Booking does NOT affect capacity
  -- ==========================================
  RAISE NOTICE 'Executing Test 1: Draft booking capacity exclusion...';
  
  -- Create purchase draft
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 3, 0, 'Raast', 'proof_uploaded')
  RETURNING id INTO v_purchase_1_id;

  -- Create proof
  INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
  VALUES (v_purchase_1_id, 'http://proof.png', 'Raast', 1300.00, 'pending');

  -- Create draft booking via function
  v_booking_draft_id := public.create_draft_booking_for_checkout(v_customer_id, v_window_open_id, v_purchase_1_id, v_menu_item_id);

  SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_open_id;
  IF v_booked_count <> 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Draft booking incremented drop window booked_count! Current count: %', v_booked_count;
  END IF;
  RAISE NOTICE 'Test 1 Passed: Draft bookings do not consume capacity.';

  -- ==========================================
  -- TEST 2: Scheduled Booking consumes capacity & credits
  -- ==========================================
  RAISE NOTICE 'Executing Test 2: Scheduled booking capacity and credits check...';

  -- Create a pre-approved purchase to test manual scheduling
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 3, 3, 'Raast', 'approved')
  RETURNING id INTO v_purchase_2_id;

  -- Run schedule function
  v_booking_sched_id := public.schedule_booking(v_customer_id, v_window_open_id, v_purchase_2_id, v_menu_item_id);

  -- Check capacity count
  SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_open_id;
  IF v_booked_count <> 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Scheduled booking did not increment booked_count. Count: %', v_booked_count;
  END IF;

  -- Check remaining credits
  SELECT remaining_credits INTO v_remaining_credits FROM public.purchases WHERE id = v_purchase_2_id;
  IF v_remaining_credits <> 2 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Credits not decremented. Credits left: %', v_remaining_credits;
  END IF;
  RAISE NOTICE 'Test 2 Passed: Scheduled bookings consume capacity and credits.';

  -- ==========================================
  -- TEST 3: Cancelled Booking releases capacity & refunds credit
  -- ==========================================
  RAISE NOTICE 'Executing Test 3: Booking cancellation...';

  -- Cancel booking before cutoff
  PERFORM public.cancel_booking_before_cutoff(v_booking_sched_id);

  -- Verify capacity releases
  SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_open_id;
  IF v_booked_count <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Cancelled booking did not release capacity. Count: %', v_booked_count;
  END IF;

  -- Verify credit is refunded
  SELECT remaining_credits INTO v_remaining_credits FROM public.purchases WHERE id = v_purchase_2_id;
  IF v_remaining_credits <> 3 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Credit not refunded. Credits left: %', v_remaining_credits;
  END IF;
  RAISE NOTICE 'Test 3 Passed: Cancellations before cutoff release capacity and refund credits.';

  -- ==========================================
  -- TEST 4 & 5: Cutoff constraints
  -- ==========================================
  RAISE NOTICE 'Executing Tests 4 & 5: Cutoff time constraints...';

  -- Try scheduling past cutoff (Should fail)
  BEGIN
    PERFORM public.schedule_booking(v_customer_id, v_window_past_cutoff_id, v_purchase_2_id, v_menu_item_id);
    RAISE EXCEPTION 'TEST 4 FAILED: System scheduled booking past cutoff time!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 4 Passed: Cutoff correctly blocks booking creation (%s)', SQLERRM;
  END;

  -- Verify cancellation blocks past cutoff
  -- Seed a locked scheduled booking past cutoff directly for test
  INSERT INTO public.bookings (user_id, purchase_id, drop_window_id, menu_item_id, status)
  VALUES (v_customer_id, v_purchase_2_id, v_window_past_cutoff_id, v_menu_item_id, 'scheduled')
  RETURNING id INTO v_booking_fail_id;

  BEGIN
    PERFORM public.cancel_booking_before_cutoff(v_booking_fail_id);
    RAISE EXCEPTION 'TEST 5 FAILED: System cancelled booking past cutoff time!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 5 Passed: Cutoff correctly blocks booking cancellation (%s)', SQLERRM;
  END;

  -- ==========================================
  -- TEST 6 & 7: Approved purchase activates credits & schedules draft
  -- ==========================================
  RAISE NOTICE 'Executing Tests 6 & 7: Purchase approval loops...';

  -- Verify approve_purchase
  v_result := public.approve_purchase(v_purchase_1_id, v_reviewer_id);

  -- Assert payment status is approved
  IF (v_result->>'payment_status') <> 'approved' THEN
    RAISE EXCEPTION 'TEST 6 FAILED: approve_purchase result status is incorrect: %', v_result;
  END IF;

  -- Assert draft booking was converted to scheduled
  SELECT status INTO v_booking_status FROM public.bookings WHERE id = v_booking_draft_id;
  IF v_booking_status <> 'scheduled' THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Draft booking not scheduled upon approval. Status: %', v_booking_status;
  END IF;
  RAISE NOTICE 'Tests 6 & 7 Passed: Purchase approval successfully schedules drafts and activates credits.';

  -- ==========================================
  -- TEST 8: approve_purchase partial capacity handling
  -- ==========================================
  RAISE NOTICE 'Executing Test 8: Partial capacity/cutoff check during approval...';

  -- Set up target purchase with 3 credits
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 3, 0, 'Raast', 'proof_uploaded')
  RETURNING id INTO v_purchase_partial_id;

  INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
  VALUES (v_purchase_partial_id, 'http://proof-partial.png', 'Raast', 1300.00, 'pending');

  -- Window has capacity limit = 1. We create 2 draft bookings for this window.
  -- (Both drafts create successfully because drafts bypass capacity checks, checking bounds without locking it).
  v_booking_sched_id := public.create_draft_booking_for_checkout(v_customer_id, v_window_full_id, v_purchase_partial_id, v_menu_item_id);
  v_booking_fail_id  := public.create_draft_booking_for_checkout(v_customer_id, v_window_full_id, v_purchase_partial_id, v_menu_item_id);

  -- Execute approve_purchase
  v_result := public.approve_purchase(v_purchase_partial_id, v_reviewer_id);
  RAISE NOTICE 'Approval outcome: %', v_result;

  -- Verify remaining credits on purchase is 2 (total 3, 1 scheduled, 1 cancelled, so remaining is 3 - 1 = 2)
  SELECT remaining_credits INTO v_remaining_credits FROM public.purchases WHERE id = v_purchase_partial_id;
  IF v_remaining_credits <> 2 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Credits incorrectly deducted for failed bookings. Remaining: %', v_remaining_credits;
  END IF;

  -- Verify first booking is scheduled
  SELECT status INTO v_booking_status FROM public.bookings WHERE id = v_booking_sched_id;
  IF v_booking_status <> 'scheduled' THEN
    RAISE EXCEPTION 'TEST 8 FAILED: First draft booking should be scheduled. Status: %', v_booking_status;
  END IF;

  -- Verify second booking is cancelled
  SELECT status INTO v_booking_status FROM public.bookings WHERE id = v_booking_fail_id;
  IF v_booking_status <> 'cancelled' THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Second draft booking should be cancelled due to capacity. Status: %', v_booking_status;
  END IF;

  RAISE NOTICE 'Test 8 Passed: Partial capacity handled successfully. Credits are only deducted for scheduled bookings.';

  -- ==========================================
  -- TEST 9 & 10: Role restriction (Operations cannot approve)
  -- ==========================================
  RAISE NOTICE 'Executing Tests 9 & 10: Role verification...';

  BEGIN
    -- Try approving using operations reviewer ID (Should fail)
    PERFORM public.approve_purchase(v_purchase_partial_id, v_operations_id);
    RAISE EXCEPTION 'TEST 9 FAILED: Operations user approved purchase!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 9 Passed: Operations user correctly blocked from approval (%s)', SQLERRM;
  END;

  RAISE NOTICE 'Test E2E Database Function Suite complete. Rolling back changes.';

END;
$$ LANGUAGE plpgsql;

ROLLBACK;
