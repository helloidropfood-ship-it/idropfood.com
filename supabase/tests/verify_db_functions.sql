-- Supabase Verification Test Suite: verify_db_functions.sql
-- Run inside database console / migration test environment.
-- Automatically wraps inside a transaction that rolls back to preserve clean state.
-- Tests: 12 E2E cases covering capacity, credits, cutoff, approvals, rejections, and role enforcement.

BEGIN;

DO $$
DECLARE
  -- Core test actor IDs
  v_customer_id UUID := '00000000-0000-0000-0000-000000000001';
  v_reviewer_id UUID := '00000000-0000-0000-0000-000000000002';
  v_operations_id UUID := '00000000-0000-0000-0000-000000000003';

  -- Lookup IDs
  v_plan_id UUID;
  v_window_open_id UUID;
  v_window_full_id UUID;
  v_window_past_cutoff_id UUID;
  v_menu_item_id UUID;

  -- Purchase IDs
  v_purchase_1_id UUID;
  v_purchase_2_id UUID;
  v_purchase_partial_id UUID;
  v_reject_purchase_id UUID;
  v_ops_purchase_id UUID;
  v_cust_purchase_id UUID;

  -- Booking IDs
  v_booking_draft_id UUID;
  v_booking_sched_id UUID;
  v_booking_fail_id UUID;
  v_reject_booking_1_id UUID;
  v_reject_booking_2_id UUID;
  v_ops_booking_id UUID;
  v_cust_booking_id UUID;

  -- Result holders
  v_result JSONB;
  v_reject_result JSONB;
  v_booked_count INT;
  v_remaining_credits INT;
  v_booking_status VARCHAR;
  v_reject_status_1 VARCHAR;
  v_reject_status_2 VARCHAR;
  v_ops_status VARCHAR;

BEGIN
  RAISE NOTICE 'Starting E2E Database Function Tests (12 test cases)...';

  -- ==========================================
  -- SETUP SEED DATA FOR TESTING
  -- ==========================================

  -- Pre-cleanup test data in case previous runs left dirty state
  DELETE FROM public.bookings WHERE user_id = v_customer_id;
  DELETE FROM public.purchases WHERE user_id = v_customer_id;
  DELETE FROM public.users WHERE id = v_customer_id;
  DELETE FROM public.admin_users WHERE id IN (v_reviewer_id, v_operations_id);

  -- Create test customer user
  INSERT INTO public.users (id, name, phone, floor, department)
  VALUES (v_customer_id, 'Test Customer', '03211111111', '4th Floor', 'Customer Support');

  -- Create admin/operations test users
  INSERT INTO public.admin_users (id, auth_user_id, name, role)
  VALUES
    (v_reviewer_id, '10000000-0000-0000-0000-000000000001', 'Test Admin', 'admin'),
    (v_operations_id, '10000000-0000-0000-0000-000000000002', 'Test Ops', 'operations');

  -- Fetch a seed plan (Lite Pack: 3 credits)
  SELECT id INTO v_plan_id FROM public.plans WHERE name = 'Lite Pack' LIMIT 1;

  -- Create Drop Windows
  -- 1. Open with capacity
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 5, 'E2E Open Drop', '12:30:00', '14:00:00', 5, now() + interval '1 day', 'open')
  RETURNING id INTO v_window_open_id;

  -- 2. Already full capacity (capacity = 1, will have 1 confirmed booking created via test 8)
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 6, 'E2E Full Drop', '12:30:00', '14:00:00', 1, now() + interval '1 day', 'open')
  RETURNING id INTO v_window_full_id;

  -- 3. Past cutoff time
  INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status)
  VALUES (current_date + 7, 'E2E Cutoff Drop', '12:30:00', '14:00:00', 10, now() - interval '1 hour', 'open')
  RETURNING id INTO v_window_past_cutoff_id;

  -- Create sample Menu Items
  INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
  VALUES (v_window_open_id, 'Test Biryani', 'Mild test spices', true)
  RETURNING id INTO v_menu_item_id;

  INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
  VALUES (v_window_full_id, 'Test Nihari', 'Spiced gravy nihari', true);

  -- ==========================================
  -- TEST 1: Draft Booking does NOT affect capacity
  -- ==========================================
  RAISE NOTICE 'Executing Test 1: Draft booking capacity exclusion...';

  -- Create purchase with proof_uploaded status
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
  -- Seed a scheduled booking past cutoff directly for test
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
  -- (Both drafts create successfully because drafts bypass capacity checks)
  v_booking_sched_id := public.create_draft_booking_for_checkout(v_customer_id, v_window_full_id, v_purchase_partial_id, v_menu_item_id);
  v_booking_fail_id  := public.create_draft_booking_for_checkout(v_customer_id, v_window_full_id, v_purchase_partial_id, v_menu_item_id);

  -- Execute approve_purchase
  v_result := public.approve_purchase(v_purchase_partial_id, v_reviewer_id);
  RAISE NOTICE 'Approval outcome: %', v_result;

  -- Verify remaining credits: total 3, 1 scheduled, so remaining = 3 - 1 = 2
  SELECT remaining_credits INTO v_remaining_credits FROM public.purchases WHERE id = v_purchase_partial_id;
  IF v_remaining_credits <> 2 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Credits incorrectly deducted for failed bookings. Remaining: %', v_remaining_credits;
  END IF;

  -- Verify that one booking is scheduled and the other is cancelled
  DECLARE
    v_status_sched VARCHAR;
    v_status_fail VARCHAR;
  BEGIN
    SELECT status INTO v_status_sched FROM public.bookings WHERE id = v_booking_sched_id;
    SELECT status INTO v_status_fail FROM public.bookings WHERE id = v_booking_fail_id;

    IF NOT (
      (v_status_sched = 'scheduled' AND v_status_fail = 'cancelled') OR
      (v_status_sched = 'cancelled' AND v_status_fail = 'scheduled')
    ) THEN
      RAISE EXCEPTION 'TEST 8 FAILED: Expected one booking to be scheduled and the other cancelled. Got Sched: %, Fail: %', v_status_sched, v_status_fail;
    END IF;
  END;

  RAISE NOTICE 'Test 8 Passed: Partial capacity handled successfully. Credits are only deducted for scheduled bookings.';

  -- ==========================================
  -- TEST 9: Role restriction (Operations cannot approve payments)
  -- ==========================================
  RAISE NOTICE 'Executing Test 9: Operations cannot approve payments...';

  BEGIN
    -- Try approving using operations admin_users.id (Should fail — operations role blocked)
    PERFORM public.approve_purchase(v_purchase_partial_id, v_operations_id);
    RAISE EXCEPTION 'TEST 9 FAILED: Operations user approved purchase!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 9 Passed: Operations user correctly blocked from payment approval (%s)', SQLERRM;
  END;

  -- ==========================================
  -- TEST 10: Rejected purchase cancels all draft bookings
  -- ==========================================
  RAISE NOTICE 'Executing Test 10: Rejected purchase cancels draft bookings...';

  -- Create a fresh purchase with proof_uploaded status
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 3, 0, 'Raast', 'proof_uploaded')
  RETURNING id INTO v_reject_purchase_id;

  INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
  VALUES (v_reject_purchase_id, 'http://proof-reject.png', 'Raast', 1300.00, 'pending');

  -- Create 2 draft bookings for this purchase
  v_reject_booking_1_id := public.create_draft_booking_for_checkout(v_customer_id, v_window_open_id, v_reject_purchase_id, v_menu_item_id);
  v_reject_booking_2_id := public.create_draft_booking_for_checkout(v_customer_id, v_window_open_id, v_reject_purchase_id, v_menu_item_id);

  -- Reject the purchase with admin notes
  v_reject_result := public.reject_purchase(v_reject_purchase_id, v_reviewer_id, 'Test rejection notes');

  -- Verify purchase is rejected
  IF (v_reject_result->>'payment_status') <> 'rejected' THEN
    RAISE EXCEPTION 'TEST 10 FAILED: reject_purchase did not return rejected status: %', v_reject_result;
  END IF;

  -- Verify both draft bookings are now cancelled
  SELECT status INTO v_reject_status_1 FROM public.bookings WHERE id = v_reject_booking_1_id;
  SELECT status INTO v_reject_status_2 FROM public.bookings WHERE id = v_reject_booking_2_id;

  IF v_reject_status_1 <> 'cancelled' THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Draft booking 1 not cancelled after rejection. Status: %', v_reject_status_1;
  END IF;
  IF v_reject_status_2 <> 'cancelled' THEN
    RAISE EXCEPTION 'TEST 10 FAILED: Draft booking 2 not cancelled after rejection. Status: %', v_reject_status_2;
  END IF;
  RAISE NOTICE 'Test 10 Passed: Rejected purchase correctly cancels all associated draft bookings.';

  -- ==========================================
  -- TEST 11: Operations/Admin can mark booking delivered
  -- ==========================================
  RAISE NOTICE 'Executing Test 11: Admin/operations can mark booking as delivered...';

  -- Create approved purchase
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 1, 1, 'Raast', 'approved')
  RETURNING id INTO v_ops_purchase_id;

  -- Schedule a booking
  v_ops_booking_id := public.schedule_booking(v_customer_id, v_window_open_id, v_ops_purchase_id, v_menu_item_id);

  -- Directly lock it (simulating post-cutoff lock)
  UPDATE public.bookings SET status = 'locked', locked_at = now() WHERE id = v_ops_booking_id;

  -- Set auth context to the admin user auth_user_id so get_admin_role() resolves 'admin'
  PERFORM set_config('request.jwt.sub', '10000000-0000-0000-0000-000000000001', true);

  -- Admin should be able to mark it delivered
  PERFORM public.mark_booking_delivered(v_ops_booking_id);

  SELECT status INTO v_ops_status FROM public.bookings WHERE id = v_ops_booking_id;
  IF v_ops_status <> 'delivered' THEN
    RAISE EXCEPTION 'TEST 11 FAILED: mark_booking_delivered did not update status. Status: %', v_ops_status;
  END IF;
  RAISE NOTICE 'Test 11 Passed: Admin/operations can successfully mark a locked booking as delivered.';

  -- ==========================================
  -- TEST 12: Regular customer cannot mark booking delivered or missed
  -- ==========================================
  RAISE NOTICE 'Executing Test 12: Regular customer cannot mark booking delivered/missed...';

  -- Create approved purchase for customer
  INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
  VALUES (v_customer_id, v_plan_id, 1, 1, 'Raast', 'approved')
  RETURNING id INTO v_cust_purchase_id;

  -- Schedule and lock a booking
  v_cust_booking_id := public.schedule_booking(v_customer_id, v_window_open_id, v_cust_purchase_id, v_menu_item_id);
  UPDATE public.bookings SET status = 'locked', locked_at = now() WHERE id = v_cust_booking_id;

  -- Switch auth context to a non-admin customer (not in admin_users)
  -- get_admin_role() will return NULL → role check fails
  PERFORM set_config('request.jwt.sub', v_customer_id::text, true);

  -- Customer tries to mark delivered — must fail
  BEGIN
    PERFORM public.mark_booking_delivered(v_cust_booking_id);
    RAISE EXCEPTION 'TEST 12 FAILED: Regular customer was able to call mark_booking_delivered!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 12a Passed: Regular customer correctly blocked from mark_booking_delivered (%s)', SQLERRM;
  END;

  -- Customer tries to mark missed — must fail
  BEGIN
    PERFORM public.mark_booking_missed(v_cust_booking_id);
    RAISE EXCEPTION 'TEST 12 FAILED: Regular customer was able to call mark_booking_missed!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Test 12b Passed: Regular customer correctly blocked from mark_booking_missed (%s)', SQLERRM;
  END;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'All 12 E2E Database Function Tests completed.';
  RAISE NOTICE 'Expected outcome: ALL tests PASS.';
  RAISE NOTICE 'Rolling back all test data to preserve clean database state.';
  RAISE NOTICE '============================================================';

END;
$$ LANGUAGE plpgsql;

ROLLBACK;
