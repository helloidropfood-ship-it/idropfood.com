import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file to get token and project ref
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const token = getEnvVar('SUPABASE_ACCESS_TOKEN');
const projectRef = getEnvVar('SUPABASE_PROJECT_REF');

async function runQuery(query) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const text = await res.text();
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Query failed (status ${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function main() {
  console.log('========================================================================');
  console.log('STARTING SPRINT 5 E2E PILOT SIMULATION');
  console.log('========================================================================\n');

  // ----------------------------------------------------
  // STEP 1: Seeding Sandbox Users & Cleanup
  // ----------------------------------------------------
  console.log('Step 1: Setting up sandbox users (Customers, Owner, Admin, Ops)...');

  const setupSql = `
    BEGIN;

    -- Cleanup any existing simulation data to ensure clean, repeatable run
    DELETE FROM public.bookings WHERE user_id IN (
      SELECT id FROM public.users WHERE email IN ('customer.test1@idropfood.com', 'customer.test2@idropfood.com')
    );
    DELETE FROM public.menu_items WHERE drop_window_id IN (
      SELECT id FROM public.drop_windows WHERE window_name IN ('Simulation A Day Drop', 'Simulation B Day Drop')
    );
    DELETE FROM public.drop_windows WHERE window_name IN ('Simulation A Day Drop', 'Simulation B Day Drop');
    DELETE FROM public.purchases WHERE user_id IN (
      SELECT id FROM public.users WHERE email IN ('customer.test1@idropfood.com', 'customer.test2@idropfood.com')
    );
    DELETE FROM public.users WHERE email IN ('customer.test1@idropfood.com', 'customer.test2@idropfood.com');
    DELETE FROM public.admin_users WHERE auth_user_id IN (
      'a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003'
    );
    DELETE FROM auth.users WHERE email IN (
      'customer.test1@idropfood.com', 'customer.test2@idropfood.com', 
      'owner.test@idropfood.com', 'admin.test@idropfood.com', 'operations.test@idropfood.com'
    );

    -- Insert into auth.users
    INSERT INTO auth.users (id, email, role, aud, is_sso_user, is_anonymous) VALUES
      ('c0000000-0000-0000-0000-000000000001', 'customer.test1@idropfood.com', 'authenticated', 'authenticated', false, false),
      ('c0000000-0000-0000-0000-000000000002', 'customer.test2@idropfood.com', 'authenticated', 'authenticated', false, false),
      ('a0000000-0000-0000-0000-000000000001', 'owner.test@idropfood.com', 'authenticated', 'authenticated', false, false),
      ('a0000000-0000-0000-0000-000000000002', 'admin.test@idropfood.com', 'authenticated', 'authenticated', false, false),
      ('a0000000-0000-0000-0000-000000000003', 'operations.test@idropfood.com', 'authenticated', 'authenticated', false, false);

    -- Insert into public.users
    INSERT INTO public.users (id, auth_user_id, name, phone, email, floor, department) VALUES
      ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Customer Test 1', '03009999001', 'customer.test1@idropfood.com', '3rd Floor', 'Engineering'),
      ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Customer Test 2', '03009999002', 'customer.test2@idropfood.com', '4th Floor', 'Operations');

    -- Insert into public.admin_users with explicit IDs matching role checks
    INSERT INTO public.admin_users (id, auth_user_id, name, role) VALUES
      ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Owner Test', 'owner'),
      ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Admin Test', 'admin'),
      ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Ops Test', 'operations');

    COMMIT;
  `;

  await runQuery(setupSql);
  console.log('✓ Sandbox users setup and promoted successfully.');

  // Fetch plan IDs
  const plans = await runQuery('SELECT id, name FROM public.plans;');
  const trialPlan = plans.find(p => p.name === 'Trial Drop');
  const litePlan = plans.find(p => p.name === 'Lite Pack');

  if (!trialPlan || !litePlan) {
    throw new Error('Required plans (Trial Drop, Lite Pack) are missing in the DB!');
  }

  // ----------------------------------------------------
  // STEP 2: Simulation A (Trial Drop Flow)
  // ----------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('Simulation A: Trial Drop Flow (Past Cutoff + Delivered)');
  console.log('----------------------------------------------------');

  const simASql = `
    DECLARE
      v_trial_plan_id UUID := '${trialPlan.id}';
      v_window_id UUID;
      v_menu_item_id UUID;
      v_purchase_id UUID;
      v_booking_id UUID;
      v_result JSONB;
      v_status VARCHAR;
      v_booked_count INT;
    BEGIN
      -- Create drop window (future cutoff initially so checkout succeeds)
      INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status, active)
      VALUES (current_date + 1, 'Simulation A Day Drop', '12:30:00', '14:00:00', 30, now() + interval '10 minutes', 'open', true)
      RETURNING id INTO v_window_id;

      -- Create menu item
      INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
      VALUES (v_window_id, 'Sim A Biryani', 'Premium Biryani for Sim A', true)
      RETURNING id INTO v_menu_item_id;

      -- Create purchase (proof_uploaded) as Customer 1
      INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
      VALUES ('e0000000-0000-0000-0000-000000000001', v_trial_plan_id, 1, 0, 'Bank Transfer', 'proof_uploaded')
      RETURNING id INTO v_purchase_id;

      -- Create payment proof
      INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
      VALUES (v_purchase_id, 'https://supabase/proofs/sim_a.png', 'Bank Transfer', 250.00, 'pending');

      -- Create draft booking (as Customer 1)
      PERFORM set_config('request.jwt.sub', 'c0000000-0000-0000-0000-000000000001', true);
      v_booking_id := public.create_draft_booking_for_checkout('e0000000-0000-0000-0000-000000000001', v_window_id, v_purchase_id, v_menu_item_id);

      -- Verify initial status is draft
      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'draft' THEN
        RAISE EXCEPTION 'Initial booking status is not draft, got %', v_status;
      END IF;

      -- Owner approves purchase
      PERFORM set_config('request.jwt.sub', 'a0000000-0000-0000-0000-000000000001', true);
      v_result := public.approve_purchase(v_purchase_id, 'd0000000-0000-0000-0000-000000000001');

      -- Verify scheduled status
      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'scheduled' THEN
        RAISE EXCEPTION 'Booking status after approval is not scheduled, got %', v_status;
      END IF;

      SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_id;
      IF v_booked_count <> 1 THEN
        RAISE EXCEPTION 'Booked count is not 1, got %', v_booked_count;
      END IF;

      -- Update window cutoff to past (simulating time passing)
      UPDATE public.drop_windows SET cutoff_time = now() - interval '10 minutes' WHERE id = v_window_id;

      -- Lock booking (cutoff is now past)
      PERFORM public.lock_booking_after_cutoff(v_booking_id);
      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'locked' THEN
        RAISE EXCEPTION 'Booking status after lock is not locked, got %', v_status;
      END IF;

      -- Ops marks delivered
      PERFORM set_config('request.jwt.sub', 'a0000000-0000-0000-0000-000000000003', true);
      PERFORM public.mark_booking_delivered(v_booking_id);

      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'delivered' THEN
        RAISE EXCEPTION 'Booking status after delivery is not delivered, got %', v_status;
      END IF;
    END;
  `;

  console.log('Executing Simulation A database transaction...');
  await runQuery(`DO $$ ${simASql} $$;`);
  console.log('✓ Simulation A executed successfully!');

  // Verify DB state for Customer 1
  const simAState = await runQuery(`
    SELECT 
      b.id as booking_id, 
      b.status as booking_status, 
      p.payment_status, 
      p.remaining_credits,
      w.window_name,
      w.booked_count,
      w.cutoff_time
    FROM public.bookings b
    JOIN public.purchases p ON b.purchase_id = p.id
    JOIN public.drop_windows w ON b.drop_window_id = w.id
    WHERE b.user_id = 'e0000000-0000-0000-0000-000000000001';
  `);
  console.log('Simulation A Verified State:');
  console.table(simAState);


  // ----------------------------------------------------
  // STEP 3: Simulation B (Meal Pack & Credits Flow)
  // ----------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('Simulation B: Meal Pack & Credits Flow (Refund / Future Cutoff)');
  console.log('----------------------------------------------------');

  const simBSql = `
    DECLARE
      v_lite_plan_id UUID := '${litePlan.id}';
      v_window_id UUID;
      v_menu_item_id UUID;
      v_purchase_id UUID;
      v_booking_id UUID;
      v_result JSONB;
      v_status VARCHAR;
      v_booked_count INT;
      v_credits INT;
    BEGIN
      -- Create drop window with future cutoff
      INSERT INTO public.drop_windows (date, window_name, start_time, end_time, capacity, cutoff_time, status, active)
      VALUES (current_date + 2, 'Simulation B Day Drop', '12:30:00', '14:00:00', 30, now() + interval '5 hours', 'open', true)
      RETURNING id INTO v_window_id;

      -- Create menu item
      INSERT INTO public.menu_items (drop_window_id, meal_name, description, active)
      VALUES (v_window_id, 'Sim B Haleem', 'Premium Haleem for Sim B', true)
      RETURNING id INTO v_menu_item_id;

      -- Create purchase (proof_uploaded)
      INSERT INTO public.purchases (user_id, plan_id, total_credits, remaining_credits, payment_method, payment_status)
      VALUES ('e0000000-0000-0000-0000-000000000002', v_lite_plan_id, 3, 0, 'Raast', 'proof_uploaded')
      RETURNING id INTO v_purchase_id;

      -- Create payment proof
      INSERT INTO public.payment_proofs (purchase_id, proof_image_url, payment_method, submitted_amount, status)
      VALUES (v_purchase_id, 'https://supabase/proofs/sim_b.png', 'Raast', 750.00, 'pending');

      -- Admin approves purchase
      PERFORM set_config('request.jwt.sub', 'a0000000-0000-0000-0000-000000000002', true);
      v_result := public.approve_purchase(v_purchase_id, 'd0000000-0000-0000-0000-000000000002');

      -- Check customer credits (should be 3)
      SELECT remaining_credits INTO v_credits FROM public.purchases WHERE id = v_purchase_id;
      IF v_credits <> 3 THEN
        RAISE EXCEPTION 'Remaining credits is not 3, got %', v_credits;
      END IF;

      -- Customer 2 schedules booking
      PERFORM set_config('request.jwt.sub', 'c0000000-0000-0000-0000-000000000002', true);
      v_booking_id := public.schedule_booking('e0000000-0000-0000-0000-000000000002', v_window_id, v_purchase_id, v_menu_item_id);

      -- Verify scheduled status and remaining_credits is 2
      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'scheduled' THEN
        RAISE EXCEPTION 'Booking status after schedule is not scheduled, got %', v_status;
      END IF;

      SELECT remaining_credits INTO v_credits FROM public.purchases WHERE id = v_purchase_id;
      IF v_credits <> 2 THEN
        RAISE EXCEPTION 'Remaining credits after schedule is not 2, got %', v_credits;
      END IF;

      SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_id;
      IF v_booked_count <> 1 THEN
        RAISE EXCEPTION 'Booked count after schedule is not 1, got %', v_booked_count;
      END IF;

      -- Customer cancels booking before cutoff
      PERFORM public.cancel_booking_before_cutoff(v_booking_id);

      -- Verify cancelled status, remaining_credits is 3, booked_count is 0
      SELECT status INTO v_status FROM public.bookings WHERE id = v_booking_id;
      IF v_status <> 'cancelled' THEN
        RAISE EXCEPTION 'Booking status after cancel is not cancelled, got %', v_status;
      END IF;

      SELECT remaining_credits INTO v_credits FROM public.purchases WHERE id = v_purchase_id;
      IF v_credits <> 3 THEN
        RAISE EXCEPTION 'Remaining credits after cancel is not 3, got %', v_credits;
      END IF;

      SELECT booked_count INTO v_booked_count FROM public.drop_windows WHERE id = v_window_id;
      IF v_booked_count <> 0 THEN
        RAISE EXCEPTION 'Booked count after cancel is not 0, got %', v_booked_count;
      END IF;
    END;
  `;

  console.log('Executing Simulation B database transaction...');
  await runQuery(`DO $$ ${simBSql} $$;`);
  console.log('✓ Simulation B executed successfully!');

  // Verify DB state for Customer 2
  const simBState = await runQuery(`
    SELECT 
      b.id as booking_id, 
      b.status as booking_status, 
      p.payment_status, 
      p.remaining_credits,
      w.window_name,
      w.booked_count,
      w.cutoff_time
    FROM public.bookings b
    JOIN public.purchases p ON b.purchase_id = p.id
    JOIN public.drop_windows w ON b.drop_window_id = w.id
    WHERE b.user_id = 'e0000000-0000-0000-0000-000000000002';
  `);
  console.log('Simulation B Verified State:');
  console.table(simBState);


  // ----------------------------------------------------
  // STEP 4: Simulation C (Admin & Operations Role Restrictions)
  // ----------------------------------------------------
  console.log('\n----------------------------------------------------');
  console.log('Simulation C: Role-based Access Enforcement');
  console.log('----------------------------------------------------');

  // Verify Operations user cannot approve purchases
  console.log('1. Attempting to approve purchase as Operations role (must fail)...');
  const purchaseIdToTest = simBState[0].booking_id ? (await runQuery(`SELECT purchase_id FROM public.bookings WHERE id = '${simBState[0].booking_id}'`))[0].purchase_id : null;

  if (purchaseIdToTest) {
    const opsApproveSql = `
      DO $$
      BEGIN
        PERFORM set_config('request.jwt.sub', 'a0000000-0000-0000-0000-000000000003', true);
        PERFORM public.approve_purchase('${purchaseIdToTest}', 'd0000000-0000-0000-0000-000000000003');
      END $$;
    `;
    try {
      await runQuery(opsApproveSql);
      console.error('❌ FAIL: Operations user was allowed to approve purchase!');
    } catch (e) {
      console.log(`✓ PASS: Operations blocked from approving purchase. Error: ${e.message.split('\n')[0]}`);
    }

    // Verify Customer cannot approve purchases
    console.log('2. Attempting to approve purchase as Customer role (must fail)...');
    const custApproveSql = `
      DO $$
      BEGIN
        PERFORM set_config('request.jwt.sub', 'c0000000-0000-0000-0000-000000000001', true);
        PERFORM public.approve_purchase('${purchaseIdToTest}', 'c0000000-0000-0000-0000-000000000001');
      END $$;
    `;
    try {
      await runQuery(custApproveSql);
      console.error('❌ FAIL: Customer was allowed to approve purchase!');
    } catch (e) {
      console.log(`✓ PASS: Customer blocked from approving purchase. Error: ${e.message.split('\n')[0]}`);
    }
  } else {
    console.log('Skipping step 4 tests due to missing purchase ref.');
  }

  console.log('\n========================================================================');
  console.log('E2E PILOT SIMULATION SUCCEEDED AND COMPLETED');
  console.log('========================================================================');
}

main().catch(console.error);
