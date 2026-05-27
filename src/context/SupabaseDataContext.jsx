import React, { useState, useEffect, createContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AppDataContext } from './AppDataContext';

export const SupabaseDataContext = createContext();

// Helper to get YYYY-MM-DD in local timezone (avoiding UTC shift)
const getLocalDateString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
};

export const SupabaseDataProvider = ({ children }) => {
  // 1. Core State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null); // Full public.users record or { email, needsProfile: true }
  const [adminUsers, setAdminUsers] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [plans, setPlans] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [aiVerifications, setAiVerifications] = useState([]);
  const [dropWindows, setDropWindows] = useState([]);
  const [fixedDropWindows, setFixedDropWindows] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch the active catalogs (Landing / Checkout views)
  const fetchPublicCatalogs = async () => {
    try {
      const todayStr = getLocalDateString();

      // Fetch drop windows
      const { data: dropsData, error: dropsErr } = await supabase
        .from('drop_windows')
        .select('*')
        .gte('date', todayStr)
        .order('date', { ascending: true });
      if (dropsErr) throw dropsErr;
      setDropWindows(dropsData || []);

      // Fetch fixed drop windows templates
      const { data: fixedWindowsData, error: fixedWindowsErr } = await supabase
        .from('fixed_drop_windows')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (fixedWindowsErr) {
        console.warn('Error fetching fixed_drop_windows, falling back to empty array', fixedWindowsErr);
        setFixedDropWindows([]);
      } else {
        setFixedDropWindows(fixedWindowsData || []);
      }

      // Fetch active plans
      const { data: planData, error: planErr } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });
      if (planErr) throw planErr;
      setPlans(planData || []);

      // Fetch active menu items
      const { data: menuData, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true);
      if (menuErr) throw menuErr;
      setMenuItems(menuData || []);

      // Fetch global payment settings
      const { data: settingsData, error: settingsErr } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (settingsErr) throw settingsErr;
      setPaymentSettings(settingsData || null);
    } catch (err) {
      console.error('Error fetching public catalogs:', err);
    }
  };

  // Helper to fetch private user dashboard data (purchases, proofs, bookings)
  const fetchUserData = async (publicProfile, isAdmin = false) => {
    if (!publicProfile?.id) return;
    try {
      // 1. Fetch user purchases
      if (!isAdmin) {
        const { data: purchaseData, error: purchaseErr } = await supabase
          .from('purchases')
          .select('*')
          .eq('user_id', publicProfile.id)
          .order('created_at', { ascending: false });
        if (purchaseErr) throw purchaseErr;
        setPurchases(purchaseData || []);
      }

      // 2. Fetch user payment proofs & generate signed URLs
      if (!isAdmin) {
        const { data: proofData, error: proofErr } = await supabase
          .from('payment_proofs')
          .select('*'); // RLS automatically limits to user's purchases
        if (proofErr) throw proofErr;
        
        const proofsWithSignedUrls = await Promise.all((proofData || []).map(async (proof) => {
          if (proof.proof_image_url) {
            try {
              const { data, error } = await supabase.storage
                .from('payment_proofs')
                .createSignedUrl(proof.proof_image_url, 3600);
              if (error) return { ...proof, signed_proof_url: null };
              return { ...proof, signed_proof_url: data.signedUrl };
            } catch (e) {
              return { ...proof, signed_proof_url: null };
            }
          }
          return { ...proof, signed_proof_url: null };
        }));
        setPaymentProofs(proofsWithSignedUrls);
      }

      // 3. Fetch user bookings
      if (!isAdmin) {
        const { data: bookingData, error: bookingErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', publicProfile.id)
          .order('created_at', { ascending: false });
        if (bookingErr) throw bookingErr;
        setBookings(bookingData || []);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Helper to fetch global datasets for admin review
  const fetchAdminData = async (adminProfile) => {
    if (!adminProfile) return;
    try {
      // 1. Fetch all users
      const { data: userData, error: userErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (userErr) throw userErr;
      setUsers(userData || []);

      // 2. Fetch all purchases
      const { data: purchaseData, error: purchaseErr } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });
      if (purchaseErr) throw purchaseErr;
      setPurchases(purchaseData || []);

      // 3. Fetch all bookings
      const { data: bookingData, error: bookingErr } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (bookingErr) throw bookingErr;
      setBookings(bookingData || []);

      // 4. Fetch all drop windows (active and inactive, future and past)
      const { data: windowData, error: windowErr } = await supabase
        .from('drop_windows')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      if (windowErr) throw windowErr;
      setDropWindows(windowData || []);

      // 5. Fetch all menu items
      const { data: menuData, error: menuErr } = await supabase
        .from('menu_items')
        .select('*');
      if (menuErr) throw menuErr;
      setMenuItems(menuData || []);

      // 6. Fetch global settings
      const { data: settingsData, error: settingsErr } = await supabase
        .from('payment_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (settingsErr) throw settingsErr;
      setPaymentSettings(settingsData || null);

      // 7. Fetch all payment proofs & generate signed URLs
      const { data: proofData, error: proofErr } = await supabase
        .from('payment_proofs')
        .select('*')
        .order('created_at', { ascending: false });
      if (proofErr) throw proofErr;

      const proofsWithSignedUrls = await Promise.all((proofData || []).map(async (proof) => {
        if (proof.proof_image_url) {
          try {
            const { data, error } = await supabase.storage
              .from('payment_proofs')
              .createSignedUrl(proof.proof_image_url, 3600);
            if (error) {
              console.error('Error creating signed URL for proof:', proof.proof_image_url, error);
              return { ...proof, signed_proof_url: null };
            }
            return { ...proof, signed_proof_url: data.signedUrl };
          } catch (e) {
            console.error(e);
            return { ...proof, signed_proof_url: null };
          }
        }
        return { ...proof, signed_proof_url: null };
      }));
      setPaymentProofs(proofsWithSignedUrls);

      // 8. Fetch all plans
      const { data: planData, error: planErr } = await supabase
        .from('plans')
        .select('*')
        .order('display_order', { ascending: true });
      if (planErr) throw planErr;
      setPlans(planData || []);

      // 9. Fetch AI verifications
      const { data: aiData, error: aiErr } = await supabase
        .from('payment_ai_verifications')
        .select('*');
      if (aiErr) throw aiErr;
      setAiVerifications(aiData || []);

      // 10. Fetch admin users (to list or track other administrators)
      const { data: adminUsersData, error: adminUsersErr } = await supabase
        .from('admin_users')
        .select('*');
      if (adminUsersErr) throw adminUsersErr;
      setAdminUsers(adminUsersData || []);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  // 2. Initialize Catalogs & Auth Listener
  useEffect(() => {
    fetchPublicCatalogs();

    const handleSession = async (session) => {
      setLoading(true);
      if (session?.user) {
        // Query public.admin_users profile first to identify admin session
        const { data: adminProfile, error: adminErr } = await supabase
          .from('admin_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (adminProfile) {
          setCurrentAdmin(adminProfile);
          await fetchAdminData(adminProfile);
        } else {
          setCurrentAdmin(null);
        }

        // Query public.users profile
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (profile) {
          setCurrentUser(profile);
          await fetchUserData(profile, !!adminProfile);
        } else {
          if (adminProfile) {
            setCurrentUser(null);
          } else {
            // Auth session exists, but no user profile record in public.users yet
            setCurrentUser({
              email: session.user.email,
              needsProfile: true,
              auth_user_id: session.user.id
            });
            setPurchases([]);
            setPaymentProofs([]);
            setBookings([]);
          }
        }
      } else {
        // Logged out
        setCurrentUser(null);
        setCurrentAdmin(null);
        setPurchases([]);
        setPaymentProofs([]);
        setBookings([]);
      }
      setLoading(false);
    };

    // First fetch the current session just in case the listener misses the initial state
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      handleSession(session);
    });

    // Realtime subscription for AI Verifications
    const aiVerificationsChannel = supabase
      .channel('public:payment_ai_verifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payment_ai_verifications' },
        (payload) => {
          setAiVerifications((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(aiVerificationsChannel);
    };
  }, []);

  // 3. Auth Actions
  const sendMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/auth'
      }
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth'
      }
    });
    if (error) throw error;
  };

  const completeProfile = async ({ name, phone, floor, department, delivery_notes }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('No active auth session found.');

    const cleanedPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanedPhone.length < 10) {
      throw new Error('Please enter a valid WhatsApp phone number.');
    }

    // Insert user record
    const { data: newProfile, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: session.user.id,
        email: session.user.email, // Explicitly save authenticated email into public profile
        name,
        phone: cleanedPhone,
        company: 'Ibex Shahrah-e-Faisal', // Default company
        floor,
        department,
        delivery_notes: delivery_notes || ''
      })
      .select()
      .single();

    if (error) throw error;

    setCurrentUser(newProfile);
    await fetchUserData(newProfile);
    return newProfile;
  };

  const logoutCustomer = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
  };

  const loginAdmin = async (role) => {
    // Deprecated for real admin auth, but kept as a helper fallback for dev roles
    console.warn('loginAdmin mock method is deprecated. Admin promotion requires database seeds.');
  };

  const logoutAdmin = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentAdmin(null);
  };

  // 4. Checkout & Purchase Actions
  const buyPackage = async (planId, paymentMethod, submittedAmount, receiptFile, selectedSlots = []) => {
    if (!currentUser || currentUser.needsProfile) {
      throw new Error('Please complete your profile before checking out.');
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Plan not found.');

    // Step 1: Create purchase in public.purchases (default status: pending_payment)
    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .insert({
        user_id: currentUser.id,
        plan_id: planId,
        total_credits: plan.meal_credits,
        remaining_credits: 0, // 0 until payment approved
        payment_method: paymentMethod,
        payment_status: 'pending_payment'
      })
      .select()
      .single();

    if (purchaseErr) throw purchaseErr;

    // Step 2: Create draft bookings (RPC)
    try {
      for (const slotId of selectedSlots) {
        const menuItem = menuItems.find(m => m.drop_window_id === slotId);
        const { error: rpcErr } = await supabase.rpc('create_draft_booking_for_checkout', {
          p_user_id: currentUser.id,
          p_drop_window_id: slotId,
          p_purchase_id: purchase.id,
          p_menu_item_id: menuItem?.id
        });

        if (rpcErr) {
          const win = dropWindows.find(w => w.id === slotId);
          const slotLabel = win ? `${win.date} (${win.window_name})` : slotId;
          throw new Error(`Failed to place draft booking for slot ${slotLabel}: ${rpcErr.message}`);
        }
      }
    } catch (err) {
      // Fetch updated user data so that the purchase shows as pending_payment
      await fetchUserData(currentUser);
      throw err;
    }

    // Step 3: Upload payment proof file
    let filePathUrl = '';
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const authUserId = currentUser.auth_user_id;
      const filePath = `${authUserId}/${purchase.id}/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, receiptFile);

      if (uploadErr) throw uploadErr;
      filePathUrl = filePath;
    } catch (err) {
      // Fetch updated user data (purchase remains pending_payment)
      await fetchUserData(currentUser);
      throw new Error(`Receipt file upload failed: ${err.message}. Your purchase was saved as pending payment. You can retry uploading the receipt from the Transactions list on your dashboard.`);
    }

    // Step 4: Insert payment proof row (default status: pending)
    const { error: proofErr } = await supabase
      .from('payment_proofs')
      .insert({
        purchase_id: purchase.id,
        proof_image_url: filePathUrl,
        payment_method: paymentMethod,
        submitted_amount: parseFloat(submittedAmount),
        transaction_reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'pending'
      });

    if (proofErr) {
      await fetchUserData(currentUser);
      throw new Error(`Failed to register payment proof: ${proofErr.message}. You can retry from your dashboard.`);
    }

    // Step 5: Update purchase status to proof_uploaded
    const { error: updateErr } = await supabase
      .from('purchases')
      .update({ payment_status: 'proof_uploaded' })
      .eq('id', purchase.id);

    if (updateErr) {
      await fetchUserData(currentUser);
      throw new Error(`Failed to update purchase status to proof_uploaded: ${updateErr.message}`);
    }

    // Success! Re-fetch user data
    await fetchUserData(currentUser);
    return purchase;
  };

  // Upload a receipt for an existing purchase that is pending_payment (failed initial upload)
  const uploadPendingProof = async (purchaseId, receiptFile, submittedAmount, paymentMethod) => {
    if (!currentUser) throw new Error('No user logged in.');

    // Step 1: Upload file to storage
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const authUserId = currentUser.auth_user_id;
    const filePath = `${authUserId}/${purchaseId}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('payment_proofs')
      .upload(filePath, receiptFile);

    if (uploadErr) throw new Error(`File upload failed: ${uploadErr.message}`);

    // Step 2: Insert proof row
    const { error: proofErr } = await supabase
      .from('payment_proofs')
      .insert({
        purchase_id: purchaseId,
        proof_image_url: filePath,
        payment_method: paymentMethod,
        submitted_amount: parseFloat(submittedAmount),
        transaction_reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'pending'
      });

    if (proofErr) throw new Error(`Proof registration failed: ${proofErr.message}`);

    // Step 3: Update purchase status
    const { error: updateErr } = await supabase
      .from('purchases')
      .update({ payment_status: 'proof_uploaded' })
      .eq('id', purchaseId);

    if (updateErr) throw new Error(`Purchase update failed: ${updateErr.message}`);

    await fetchUserData(currentUser);
  };

  // 5. Booking Actions
  const scheduleBooking = async (userId, dropWindowId) => {
    // Find active purchase with remaining credits
    const activePurchase = purchases.find(p => p.payment_status === 'approved' && p.remaining_credits > 0);
    if (!activePurchase) {
      return { success: false, message: 'No remaining credits. Please buy a package.' };
    }

    const menuItem = menuItems.find(m => m.drop_window_id === dropWindowId);
    if (!menuItem) {
      return { success: false, message: 'No menu item available for this window.' };
    }

    const { error } = await supabase.rpc('schedule_booking', {
      p_user_id: userId,
      p_drop_window_id: dropWindowId,
      p_purchase_id: activePurchase.id,
      p_menu_item_id: menuItem.id
    });

    if (error) {
      return { success: false, message: error.message };
    }

    await fetchUserData(currentUser);
    return { success: true };
  };

  const cancelBookingBeforeCutoff = async (bookingId) => {
    const { error } = await supabase.rpc('cancel_booking_before_cutoff', {
      p_booking_id: bookingId
    });

    if (error) {
      return { success: false, message: error.message };
    }

    await fetchUserData(currentUser);
    return { success: true };
  };

  // 6. Admin Action Implementations
  const approvePurchase = async (purchaseId, adminId) => {
    const { data, error } = await supabase.rpc('approve_purchase', {
      p_purchase_id: purchaseId,
      p_reviewer_id: adminId
    });
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const rejectPurchase = async (purchaseId, adminId, notes) => {
    const { data, error } = await supabase.rpc('reject_purchase', {
      p_purchase_id: purchaseId,
      p_reviewer_id: adminId,
      p_notes: notes
    });
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const markBookingDelivered = async (bookingId) => {
    // Enforce booking status is locked first if it hasn't been updated yet
    await supabase.rpc('lock_booking_after_cutoff', { p_booking_id: bookingId });

    const { data, error } = await supabase.rpc('mark_booking_delivered', {
      p_booking_id: bookingId
    });
    if (error) throw error;
    if (!data) {
      throw new Error("Failed to mark booking delivered. Ensure the cutoff time has passed and the booking is locked.");
    }
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const markBookingMissed = async (bookingId) => {
    // Enforce booking status is locked first if it hasn't been updated yet
    await supabase.rpc('lock_booking_after_cutoff', { p_booking_id: bookingId });

    const { data, error } = await supabase.rpc('mark_booking_missed', {
      p_booking_id: bookingId
    });
    if (error) throw error;
    if (!data) {
      throw new Error("Failed to mark booking missed. Ensure the cutoff time has passed and the booking is locked.");
    }
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const createDropWindow = async (date, name, startTime, endTime, capacity, cutoff) => {
    let fields = {};
    if (typeof date === 'object' && date !== null) {
      fields = date;
    } else {
      fields = {
        date,
        window_name: name,
        start_time: startTime,
        end_time: endTime,
        capacity: parseInt(capacity),
        cutoff_time: cutoff,
        status: 'open',
        active: true
      };
    }

    const { data, error } = await supabase
      .from('drop_windows')
      .insert(fields)
      .select()
      .single();
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const createDropWindowsBatch = async (dropsData, mealData) => {
    const { data: insertedDrops, error } = await supabase
      .from('drop_windows')
      .insert(dropsData)
      .select();
    if (error) throw error;

    if (mealData) {
      const menuItemsToInsert = insertedDrops.map(drop => ({
        drop_window_id: drop.id,
        meal_name: mealData.meal_name,
        description: mealData.description,
        allergens: mealData.allergens,
        image_url: mealData.image_url,
        active: mealData.active !== undefined ? mealData.active : true
      }));

      const { error: mealErr } = await supabase
        .from('menu_items')
        .insert(menuItemsToInsert);
      if (mealErr) throw mealErr;
    }

    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return insertedDrops;
  };

  const deleteDropWindow = async (winId) => {
    // First remove associated menu items if cascade is not enabled
    await supabase.from('menu_items').delete().eq('drop_window_id', winId);
    
    const { error } = await supabase
      .from('drop_windows')
      .delete()
      .eq('id', winId);
    
    if (error) throw error;
    
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
  };

  const updateDropWindow = async (winId, fields) => {
    const { data, error } = await supabase
      .from('drop_windows')
      .update(fields)
      .eq('id', winId)
      .select()
      .single();
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const deleteDropWindowsBatch = async (winIds) => {
    if (!winIds || winIds.length === 0) return;
    
    // First remove associated menu items if cascade is not enabled
    await supabase.from('menu_items').delete().in('drop_window_id', winIds);
    
    const { error } = await supabase
      .from('drop_windows')
      .delete()
      .in('id', winIds);
    
    if (error) throw error;
    
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
  };

  const updateDropWindowsBatch = async (winIds, fields) => {
    if (!winIds || winIds.length === 0) return;
    
    const { error } = await supabase
      .from('drop_windows')
      .update(fields)
      .in('id', winIds);
      
    if (error) throw error;
    
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
  };

  const uploadMenuImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `dishes/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('menu_images')
      .upload(filePath, file);

    if (uploadErr) throw uploadErr;

    const { data } = supabase.storage
      .from('menu_images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const assignMenu = async (dropWindowId, mealName, description, allergens, imageUrl, active = true) => {
    const { data: existing, error: fetchErr } = await supabase
      .from('menu_items')
      .select('id')
      .eq('drop_window_id', dropWindowId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    let res;
    if (existing?.id) {
      const { data, error } = await supabase
        .from('menu_items')
        .update({
          meal_name: mealName,
          description,
          allergens,
          image_url: imageUrl,
          active
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      res = data;
    } else {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          drop_window_id: dropWindowId,
          meal_name: mealName,
          description,
          allergens,
          image_url: imageUrl,
          active
        })
        .select()
        .single();
      if (error) throw error;
      res = data;
    }

    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return res;
  };

  const createPlan = async (name, description, credits, price, validity) => {
    const maxOrder = plans.length > 0 ? Math.max(...plans.map(p => p.display_order || 0)) : 0;
    const { data, error } = await supabase
      .from('plans')
      .insert({
        name,
        description,
        meal_credits: parseInt(credits),
        price: parseFloat(price),
        validity_days: parseInt(validity),
        active: true,
        display_order: maxOrder + 1
      })
      .select()
      .single();
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const updatePlans = async (planId, fields) => {
    const { data, error } = await supabase
      .from('plans')
      .update(fields)
      .eq('id', planId)
      .select()
      .single();
    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
    return data;
  };

  const updateGlobalSettings = async (fields) => {
    let settingId = paymentSettings?.id;
    if (!settingId) {
      const { data } = await supabase.from('payment_settings').select('id').limit(1).maybeSingle();
      settingId = data?.id;
    }

    let error;
    if (settingId) {
      const { error: err } = await supabase
        .from('payment_settings')
        .update(fields)
        .eq('id', settingId);
      error = err;
    } else {
      const { error: err } = await supabase
        .from('payment_settings')
        .insert(fields);
      error = err;
    }

    if (error) throw error;
    if (currentAdmin) {
      await fetchAdminData(currentAdmin);
    }
  };

  // 9. Fixed Drop Windows
  const createFixedWindow = async (windowData) => {
    const { data, error } = await supabase.from('fixed_drop_windows').insert([windowData]).select().single();
    if (error) throw error;
    setFixedDropWindows([...fixedDropWindows, data]);
    return data;
  };

  const updateFixedWindow = async (id, updates) => {
    const { error } = await supabase.from('fixed_drop_windows').update(updates).eq('id', id);
    if (error) throw error;
    setFixedDropWindows(fixedDropWindows.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteFixedWindow = async (id) => {
    const { error } = await supabase.from('fixed_drop_windows').delete().eq('id', id);
    if (error) throw error;
    setFixedDropWindows(fixedDropWindows.filter(w => w.id !== id));
  };

  // Return provider wrapped around AppDataContext
  return (
    <AppDataContext.Provider
      value={{
        isRealSupabase: true,
        users,
        currentUser,
        adminUsers,
        currentAdmin,
        plans,
        purchases,
        paymentProofs,
        aiVerifications,
        dropWindows,
        menuItems,
        bookings,
        paymentSettings,
        loading,
        sendMagicLink,
        signInWithOAuth,
        completeProfile,
        logoutCustomer,
        loginAdmin,
        logoutAdmin,
        buyPackage,
        uploadPendingProof,
        scheduleBooking,
        cancelBookingBeforeCutoff,
        approvePurchase,
        rejectPurchase,
        markBookingDelivered,
        markBookingMissed,
        createDropWindow,
        createDropWindowsBatch,
        updateDropWindow,
        deleteDropWindow,
        deleteDropWindowsBatch,
        updateDropWindowsBatch,
        uploadMenuImage,
        assignMenu,
        createPlan,
        updatePlans,
        updateGlobalSettings,
        fixedDropWindows,
        createFixedWindow,
        updateFixedWindow,
        deleteFixedWindow
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
