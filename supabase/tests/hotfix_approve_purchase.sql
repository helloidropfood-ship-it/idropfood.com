-- Hotfix: approve_purchase - re-query booked_count per iteration
-- This fixes Test 8: partial capacity handling during purchase approval
CREATE OR REPLACE FUNCTION public.approve_purchase(p_purchase_id UUID, p_reviewer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_purchase RECORD;
  v_total_credits INT;
  v_scheduled_count INT := 0;
  v_cancelled_count INT := 0;
  v_booking RECORD;
  v_capacity_left INT;
  v_current_booked INT;
  v_scheduled_ids UUID[] := '{}';
  v_cancelled_ids UUID[] := '{}';
  v_result JSONB;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = p_reviewer_id AND role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Reviewer must be an admin or owner.';
  END IF;

  SELECT * INTO v_purchase FROM public.purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found.';
  END IF;

  IF v_purchase.payment_status = 'approved' THEN
    RAISE EXCEPTION 'Purchase has already been approved.';
  END IF;

  v_total_credits := v_purchase.total_credits;

  -- Loop through draft bookings.
  -- booked_count is re-queried live each iteration so multiple drafts targeting
  -- the same window compete correctly for remaining capacity.
  FOR v_booking IN 
    SELECT b.*, w.capacity, w.cutoff_time, w.active, w.status as window_status
    FROM public.bookings b
    JOIN public.drop_windows w ON b.drop_window_id = w.id
    WHERE b.purchase_id = p_purchase_id AND b.status = 'draft'
  LOOP
    -- Re-fetch current booked_count from DB (not cached cursor value)
    SELECT booked_count INTO v_current_booked
    FROM public.drop_windows WHERE id = v_booking.drop_window_id;
    v_capacity_left := v_booking.capacity - v_current_booked;

    IF v_booking.active 
       AND v_booking.window_status = 'open' 
       AND now() < v_booking.cutoff_time 
       AND v_capacity_left > 0 
    THEN
      UPDATE public.bookings SET status = 'scheduled' WHERE id = v_booking.id;
      v_scheduled_count := v_scheduled_count + 1;
      v_scheduled_ids := array_append(v_scheduled_ids, v_booking.id);
    ELSE
      UPDATE public.bookings SET status = 'cancelled' WHERE id = v_booking.id;
      v_cancelled_count := v_cancelled_count + 1;
      v_cancelled_ids := array_append(v_cancelled_ids, v_booking.id);
    END IF;
  END LOOP;

  UPDATE public.purchases
  SET payment_status = 'approved',
      remaining_credits = v_total_credits - v_scheduled_count,
      admin_notes = COALESCE(admin_notes, '') || ' [Auto-approved: ' || v_scheduled_count || ' scheduled, ' || v_cancelled_count || ' cancelled]'
  WHERE id = p_purchase_id;

  UPDATE public.payment_proofs
  SET status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = now()
  WHERE purchase_id = p_purchase_id;

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
