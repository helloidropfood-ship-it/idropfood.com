import React, { useState, useEffect } from 'react';
import { AppDataContext } from './AppDataContext';

export { useMockData } from './AppDataContext';

export const MockDataProvider = ({ children }) => {
  // 1. Core State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [plans, setPlans] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [aiVerifications, setAiVerifications] = useState([]);
  const [dropWindows, setDropWindows] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [fixedDropWindows, setFixedDropWindows] = useState([]);

  // 2. Initial Seeding of Data (Loaded from LocalStorage if exists)
  useEffect(() => {
    // Seed Admin Users
    const seedAdmins = [
      { id: 'admin-1', name: 'Zainab owner', role: 'owner' },
      { id: 'admin-2', name: 'Hamza admin', role: 'admin' },
      { id: 'admin-3', name: 'Bilal ops', role: 'operations' }
    ];

    // Seed Plans (Packages)
    const seedPlans = [
      { id: 'plan-trial', name: 'Trial Drop', description: 'Single meal to test the service. Perfect for shift trials.', meal_credits: 1, price: 450, validity_days: 7, active: true, display_order: 1 },
      { id: 'plan-lite', name: 'Lite Pack', description: '3 meals per month. Fits once-a-week office schedules.', meal_credits: 3, price: 1300, validity_days: 30, active: true, display_order: 2 },
      { id: 'plan-core', name: 'Core Pack', description: '8 meals per month. Ideal for twice-a-week drops.', meal_credits: 8, price: 3200, validity_days: 30, active: true, display_order: 3 },
      { id: 'plan-full', name: 'Full Pack', description: '16 meals per month. Complete shift coverage for call center pros.', meal_credits: 16, price: 6000, validity_days: 30, active: true, display_order: 4 }
    ];

    // Seed Payment Settings
    const seedSettings = {
      id: 'settings-global',
      bank_name: 'Meezan Bank Ltd.',
      bank_account_title: 'iDropFood Corporate',
      bank_account_number: '1234-5678-9012-34',
      bank_iban: 'PK89MEZN0000012345678901',
      raast_id: 'idropfood@meezan',
      jazzcash_number: '0300-1234567',
      easypaisa_number: '0345-7654321',
      instruction_text: 'Transfer exact amount corresponding to your selected package. Include name or WhatsApp number in bank transfer description. Upload the screenshot once done.',
      trial_drop_active: true,
      launch_messaging: 'Special Launch Offer: Zero delivery fees for Shahrah-e-Faisal office employees!',
      contact_whatsapp: '0321-9876543'
    };

    // Seed dynamic calendar Drop Windows & Menus for upcoming 7 days
    const seedWindows = [];
    const seedMenus = [];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dishes = [
      { name: 'Korean Chicken Rice Bowl', desc: 'Glazed chicken breast, premium sesame rice, pickled cucumbers, sunny side egg.', allergens: 'Sesame, Soy, Eggs' },
      { name: 'Loaded Chicken Pasta Box', desc: 'Creamy alfredo penne, grilled chicken fillets, fresh garlic bread slice.', allergens: 'Dairy, Gluten' },
      { name: 'Sriracha Beef Rice Bowl', desc: 'Minced spicy beef, jasmine rice, shredded cabbage, sriracha mayo drizzle.', allergens: 'Soy, Eggs' },
      { name: 'Crispy Chicken Burger Box', desc: 'Crispy breast fillet, brioche bun, cheese slice, served with hand-cut fries.', allergens: 'Gluten, Dairy' },
      { name: 'Teriyaki Chicken Poke', desc: 'Diced chicken, sweet teriyaki glaze, sticky rice, shredded carrots, edamame.', allergens: 'Soy, Sesame' }
    ];

    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayName = weekdays[targetDate.getDay()];

      // We skip Sunday for deliveries (or keep active drops)
      if (dayName === 'Sunday') continue;

      // Day Drop
      const dayWinId = `win-day-${dateStr}`;
      const dayCutoff = new Date(targetDate);
      dayCutoff.setDate(targetDate.getDate() - 1);
      dayCutoff.setHours(20, 0, 0, 0); // 8:00 PM previous day

      seedWindows.push({
        id: dayWinId,
        date: dateStr,
        window_name: 'Day Drop',
        start_time: '12:30:00',
        end_time: '14:00:00',
        capacity: 20,
        booked_count: i === 0 ? 18 : i === 1 ? 14 : 5, // Show scarcity for early days
        cutoff_time: dayCutoff.toISOString(),
        status: 'open',
        active: true
      });

      const dayDish = dishes[i % dishes.length];
      seedMenus.push({
        id: `menu-day-${dateStr}`,
        drop_window_id: dayWinId,
        meal_name: dayDish.name,
        description: dayDish.desc,
        allergens: dayDish.allergens,
        image_url: `https://images.unsplash.com/photo-${1546069901 + i}?w=400&auto=format&fit=crop&q=80`,
        active: true
      });

      // Night Drop
      const nightWinId = `win-night-${dateStr}`;
      const nightCutoff = new Date(targetDate);
      nightCutoff.setDate(targetDate.getDate() - 1);
      nightCutoff.setHours(20, 0, 0, 0); // 8:00 PM previous day

      seedWindows.push({
        id: nightWinId,
        date: dateStr,
        window_name: 'Night Drop',
        start_time: '22:30:00',
        end_time: '00:00:00',
        capacity: 20,
        booked_count: i === 0 ? 19 : i === 1 ? 16 : 8,
        cutoff_time: nightCutoff.toISOString(),
        status: 'open',
        active: true
      });

      const nightDish = dishes[(i + 2) % dishes.length];
      seedMenus.push({
        id: `menu-night-${dateStr}`,
        drop_window_id: nightWinId,
        meal_name: nightDish.name,
        description: nightDish.desc,
        allergens: nightDish.allergens,
        image_url: `https://images.unsplash.com/photo-${1567306226416 + i}?w=400&auto=format&fit=crop&q=80`,
        active: true
      });
    }

    // Set defaults or load from localStorage
    const localGet = (key, fallback) => {
      const stored = localStorage.getItem(`idrop_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    };

    setUsers(localGet('users', []));
    setAdminUsers(seedAdmins);
    setPlans(localGet('plans', seedPlans));
    setPaymentSettings(localGet('paymentSettings', seedSettings));
    setDropWindows(localGet('dropWindows', seedWindows));
    setMenuItems(localGet('menuItems', seedMenus));
    setPurchases(localGet('purchases', []));
    setPaymentProofs(localGet('paymentProofs', []));
    setAiVerifications(localGet('aiVerifications', []));
    setBookings(localGet('bookings', []));
    
    const defaultFixedWindows = [
      { id: 'fixed-day', window_name: 'Day Drop', display_time: '12:30 PM – 2:00 PM', subtitle: 'Morning & Afternoon Shifts', description: 'Cutoff locks at 8:00 PM the previous day. Perfect lunch drop-off for standard day shifts, operations leads, and management.', display_order: 1 },
      { id: 'fixed-night', window_name: 'Night Drop', display_time: '10:30 PM – 12:00 AM', subtitle: 'Night & Midnight Shifts', description: 'Cutoff locks at 8:00 PM the previous day. Hot, fresh dinner delivered right when most cafeterias close down.', display_order: 2 }
    ];
    setFixedDropWindows(localGet('fixedDropWindows', defaultFixedWindows));

    // Load active sessions
    const savedUser = localStorage.getItem('idrop_session_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const savedAdmin = localStorage.getItem('idrop_session_admin');
    if (savedAdmin) setCurrentAdmin(JSON.parse(savedAdmin));
  }, []);

  // Helper to persist state modifications
  const localSet = (key, data) => {
    localStorage.setItem(`idrop_${key}`, JSON.stringify(data));
  };

  // 3. User Authentication Flow
  const loginCustomer = (phone, name, floor, department, notes = '') => {
    let existingUser = users.find(u => u.phone === phone);
    if (!existingUser) {
      existingUser = {
        id: `user-${Date.now()}`,
        name,
        phone,
        company: 'Shahrah-e-Faisal Offices',
        floor,
        department,
        delivery_notes: notes,
        created_at: new Date().toISOString()
      };
      const updatedUsers = [...users, existingUser];
      setUsers(updatedUsers);
      localSet('users', updatedUsers);
    } else {
      // Update profile info
      existingUser.name = name;
      existingUser.floor = floor;
      existingUser.department = department;
      existingUser.delivery_notes = notes;
      const updatedUsers = users.map(u => u.id === existingUser.id ? existingUser : u);
      setUsers(updatedUsers);
      localSet('users', updatedUsers);
    }
    setCurrentUser(existingUser);
    localStorage.setItem('idrop_session_user', JSON.stringify(existingUser));
    return existingUser;
  };

  const logoutCustomer = () => {
    setCurrentUser(null);
    localStorage.removeItem('idrop_session_user');
  };

  // Admin Auth simulation
  const loginAdmin = (role) => {
    const admin = adminUsers.find(a => a.role === role);
    if (admin) {
      setCurrentAdmin(admin);
      localStorage.setItem('idrop_session_admin', JSON.stringify(admin));
    }
  };

  const logoutAdmin = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('idrop_session_admin');
  };

  // 4. Booking & Purchase Operations
  const buyPackage = (planId, paymentMethod, submittedAmount, receiptFile, selectedSlots = []) => {
    if (!currentUser) return null;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return null;

    const purchaseId = `pur-${Date.now()}`;
    const newPurchase = {
      id: purchaseId,
      user_id: currentUser.id,
      plan_id: planId,
      total_credits: plan.meal_credits,
      remaining_credits: 0, // 0 until payment approved
      payment_method: paymentMethod,
      payment_status: 'proof_uploaded',
      admin_notes: null,
      created_at: new Date().toISOString()
    };

    const proofUrl = (receiptFile && typeof receiptFile === 'object')
      ? URL.createObjectURL(receiptFile)
      : (typeof receiptFile === 'string' ? receiptFile : 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=60');

    const newProof = {
      id: `proof-${Date.now()}`,
      purchase_id: purchaseId,
      proof_image_url: proofUrl,
      payment_method: paymentMethod,
      submitted_amount: parseFloat(submittedAmount),
      transaction_reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'pending',
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    };

    // Create draft bookings
    const draftBookings = selectedSlots.map(slotId => {
      const window = dropWindows.find(w => w.id === slotId);
      const menu = menuItems.find(m => m.drop_window_id === slotId);
      return {
        id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        user_id: currentUser.id,
        purchase_id: purchaseId,
        drop_window_id: slotId,
        menu_item_id: menu ? menu.id : 'placeholder',
        status: 'draft',
        created_at: new Date().toISOString(),
        locked_at: null
      };
    });

    const updatedPurchases = [newPurchase, ...purchases];
    const updatedProofs = [newProof, ...paymentProofs];
    const updatedBookings = [...bookings, ...draftBookings];

    setPurchases(updatedPurchases);
    setPaymentProofs(updatedProofs);
    setBookings(updatedBookings);

    localSet('purchases', updatedPurchases);
    localSet('paymentProofs', updatedProofs);
    localSet('bookings', updatedBookings);

    return newPurchase;
  };

  const uploadPendingProof = (purchaseId, receiptFile, submittedAmount, paymentMethod) => {
    const proofUrl = (receiptFile && typeof receiptFile === 'object')
      ? URL.createObjectURL(receiptFile)
      : 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop&q=60';

    const newProof = {
      id: `proof-${Date.now()}`,
      purchase_id: purchaseId,
      proof_image_url: proofUrl,
      payment_method: paymentMethod,
      submitted_amount: parseFloat(submittedAmount),
      transaction_reference: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'pending',
      admin_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    };

    const updatedProofs = [newProof, ...paymentProofs];
    setPaymentProofs(updatedProofs);
    localSet('paymentProofs', updatedProofs);

    const updatedPurchases = purchases.map(p => {
      if (p.id === purchaseId) {
        return { ...p, payment_status: 'proof_uploaded' };
      }
      return p;
    });
    setPurchases(updatedPurchases);
    localSet('purchases', updatedPurchases);
  };


  // 5. Backend Logic Executed by Admin
  const approvePurchase = (purchaseId, reviewerId) => {
    const updatedPurchases = purchases.map(p => {
      if (p.id === purchaseId) {
        return {
          ...p,
          payment_status: 'approved',
          remaining_credits: p.total_credits - bookings.filter(b => b.purchase_id === purchaseId && b.status === 'scheduled').length
        };
      }
      return p;
    });

    const updatedProofs = paymentProofs.map(proof => {
      if (proof.purchase_id === purchaseId) {
        return {
          ...proof,
          status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        };
      }
      return proof;
    });

    // Update associated draft bookings to scheduled, and update drop window booked_count
    const purchaseBookings = bookings.filter(b => b.purchase_id === purchaseId && b.status === 'draft');
    const updatedBookings = bookings.map(b => {
      if (b.purchase_id === purchaseId && b.status === 'draft') {
        return { ...b, status: 'scheduled' };
      }
      return b;
    });

    // Recalculate capacity booked counts
    const updatedWindows = dropWindows.map(win => {
      const scheduledCount = updatedBookings.filter(b => b.drop_window_id === win.id && ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status)).length;
      return { ...win, booked_count: scheduledCount };
    });

    setPurchases(updatedPurchases);
    setPaymentProofs(updatedProofs);
    setBookings(updatedBookings);
    setDropWindows(updatedWindows);

    localSet('purchases', updatedPurchases);
    localSet('paymentProofs', updatedProofs);
    localSet('bookings', updatedBookings);
    localSet('dropWindows', updatedWindows);
  };

  const rejectPurchase = (purchaseId, reviewerId, notes) => {
    const updatedPurchases = purchases.map(p => {
      if (p.id === purchaseId) {
        return { ...p, payment_status: 'rejected', admin_notes: notes };
      }
      return p;
    });

    const updatedProofs = paymentProofs.map(proof => {
      if (proof.purchase_id === purchaseId) {
        return {
          ...proof,
          status: 'rejected',
          admin_notes: notes,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        };
      }
      return proof;
    });

    // Cancel all associated draft bookings
    const updatedBookings = bookings.map(b => {
      if (b.purchase_id === purchaseId && b.status === 'draft') {
        return { ...b, status: 'cancelled' };
      }
      return b;
    });

    setPurchases(updatedPurchases);
    setPaymentProofs(updatedProofs);
    setBookings(updatedBookings);

    localSet('purchases', updatedPurchases);
    localSet('paymentProofs', updatedProofs);
    localSet('bookings', updatedBookings);
  };

  // 10. Fixed Drop Windows Management (For Landing Page Display)
  const createFixedWindow = (windowData) => {
    const newWindow = {
      ...windowData,
      id: `fixed-${Date.now()}`
    };
    const updated = [...fixedDropWindows, newWindow];
    setFixedDropWindows(updated);
    localSet('fixedDropWindows', updated);
    return newWindow;
  };

  const updateFixedWindow = (id, updates) => {
    const updated = fixedDropWindows.map(w => w.id === id ? { ...w, ...updates } : w);
    setFixedDropWindows(updated);
    localSet('fixedDropWindows', updated);
  };

  const deleteFixedWindow = (id) => {
    const updated = fixedDropWindows.filter(w => w.id !== id);
    setFixedDropWindows(updated);
    localSet('fixedDropWindows', updated);
  };

  // 6. Flexible Scheduling Operations (Customer Side)
  const scheduleBooking = (userId, dropWindowId) => {
    // Find active purchases with remaining credits
    const activePurchase = purchases.find(p => p.user_id === userId && p.payment_status === 'approved' && p.remaining_credits > 0);
    if (!activePurchase) return { success: false, message: 'No credits remaining. Please buy a package.' };

    const win = dropWindows.find(w => w.id === dropWindowId);
    if (!win) return { success: false, message: 'Drop window not found.' };

    // Check capacity (excluding drafts/cancels)
    const activeBooked = bookings.filter(b => b.drop_window_id === dropWindowId && ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status)).length;
    if (activeBooked >= win.capacity) return { success: false, message: 'This drop window is fully booked.' };

    // Check cutoff
    if (new Date() > new Date(win.cutoff_time)) return { success: false, message: 'Cutoff passed. Cannot schedule next-day drops after cutoff.' };

    const menu = menuItems.find(m => m.drop_window_id === dropWindowId);

    const newBooking = {
      id: `book-${Date.now()}`,
      user_id: userId,
      purchase_id: activePurchase.id,
      drop_window_id: dropWindowId,
      menu_item_id: menu ? menu.id : 'placeholder',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      locked_at: null
    };

    // Deduct credit
    const updatedPurchases = purchases.map(p => {
      if (p.id === activePurchase.id) {
        return { ...p, remaining_credits: p.remaining_credits - 1 };
      }
      return p;
    });

    const updatedBookings = [...bookings, newBooking];

    // Update drop windows booked counts
    const updatedWindows = dropWindows.map(w => {
      if (w.id === dropWindowId) {
        return { ...w, booked_count: w.booked_count + 1 };
      }
      return w;
    });

    setPurchases(updatedPurchases);
    setBookings(updatedBookings);
    setDropWindows(updatedWindows);

    localSet('purchases', updatedPurchases);
    localSet('bookings', updatedBookings);
    localSet('dropWindows', updatedWindows);

    return { success: true };
  };

  const cancelBookingBeforeCutoff = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    const win = dropWindows.find(w => w.id === booking.drop_window_id);
    if (!win) return { success: false, message: 'Drop window not found.' };

    // Check cutoff
    if (new Date() > new Date(win.cutoff_time)) return { success: false, message: 'Cutoff passed. Cannot cancel drops after cutoff.' };

    // Refund credit
    const updatedPurchases = purchases.map(p => {
      if (p.id === booking.purchase_id) {
        return { ...p, remaining_credits: p.remaining_credits + 1 };
      }
      return p;
    });

    // Update booking status
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: 'cancelled' };
      }
      return b;
    });

    // Update drop windows booked counts
    const updatedWindows = dropWindows.map(w => {
      if (w.id === booking.drop_window_id) {
        return { ...w, booked_count: Math.max(0, w.booked_count - 1) };
      }
      return w;
    });

    setPurchases(updatedPurchases);
    setBookings(updatedBookings);
    setDropWindows(updatedWindows);

    localSet('purchases', updatedPurchases);
    localSet('bookings', updatedBookings);
    localSet('dropWindows', updatedWindows);

    return { success: true };
  };

  // 7. Operations Actions (Admin Side)
  const markBookingDelivered = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const win = dropWindows.find(w => w.id === booking.drop_window_id);
    const cutoffPassed = win && new Date() >= new Date(win.cutoff_time);
    
    if (booking.status === 'locked' || (booking.status === 'scheduled' && cutoffPassed)) {
      const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: 'delivered' } : b);
      setBookings(updatedBookings);
      localSet('bookings', updatedBookings);
    } else {
      throw new Error("Failed to mark booking delivered. Ensure the cutoff time has passed and the booking is locked.");
    }
  };

  const markBookingMissed = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const win = dropWindows.find(w => w.id === booking.drop_window_id);
    const cutoffPassed = win && new Date() >= new Date(win.cutoff_time);
    
    if (booking.status === 'locked' || (booking.status === 'scheduled' && cutoffPassed)) {
      const updatedBookings = bookings.map(b => b.id === bookingId ? { ...b, status: 'missed' } : b);
      setBookings(updatedBookings);
      localSet('bookings', updatedBookings);
    } else {
      throw new Error("Failed to mark booking missed. Ensure the cutoff time has passed and the booking is locked.");
    }
  };

  const createDropWindow = (date, name, startTime, endTime, capacity, cutoff) => {
    const newWindow = {
      id: `win-${Date.now()}`,
      date,
      window_name: name,
      start_time: startTime,
      end_time: endTime,
      capacity: parseInt(capacity),
      booked_count: 0,
      cutoff_time: cutoff,
      status: 'open',
      active: true
    };
    setDropWindows(prev => [...prev, newWindow]);
    localSet('dropWindows', [...dropWindows, newWindow]);
    return newWindow;
  };

  const createDropWindowsBatch = async (dropsData, mealData) => {
    const newWindows = dropsData.map((d, i) => ({
      id: `win-${Date.now()}-${i}`,
      ...d,
      capacity: parseInt(d.capacity),
      booked_count: 0,
      status: 'open',
      active: true
    }));

    setDropWindows(prev => [...prev, ...newWindows]);
    localSet('dropWindows', [...dropWindows, ...newWindows]);

    if (mealData) {
      const newMenus = newWindows.map(w => ({
        id: `menu-${Date.now()}-${w.id}`,
        drop_window_id: w.id,
        meal_name: mealData.meal_name,
        description: mealData.description,
        allergens: mealData.allergens,
        image_url: mealData.image_url,
        active: mealData.active !== undefined ? mealData.active : true
      }));
      setMenuItems(prev => [...prev, ...newMenus]);
      localSet('menuItems', [...menuItems, ...newMenus]);
    }
    return newWindows;
  };

  const deleteDropWindow = (winId) => {
    const newMenus = menuItems.filter(m => m.drop_window_id !== winId);
    const newWindows = dropWindows.filter(w => w.id !== winId);
    setMenuItems(newMenus);
    setDropWindows(newWindows);
    localSet('menuItems', newMenus);
    localSet('dropWindows', newWindows);
  };

  const updateDropWindow = (id, updates) => {
    const updated = dropWindows.map(w => w.id === id ? { ...w, ...updates } : w);
    setDropWindows(updated);
    localSet('dropWindows', updated);
  };

  const uploadMenuImage = async (file) => {
    try {
      return URL.createObjectURL(file);
    } catch (e) {
      return 'https://images.unsplash.com/photo-1546069901?w=400';
    }
  };

  const assignMenu = (windowId, mealName, description, allergens, imageUrl, active = true) => {
    let existingMenu = menuItems.find(m => m.drop_window_id === windowId);
    let updated;
    if (existingMenu) {
      const updatedMenu = {
        ...existingMenu,
        meal_name: mealName,
        description,
        allergens,
        image_url: imageUrl,
        active
      };
      updated = menuItems.map(m => m.id === existingMenu.id ? updatedMenu : m);
    } else {
      const newMenu = {
        id: `menu-${Date.now()}`,
        drop_window_id: windowId,
        meal_name: mealName,
        description: description,
        allergens: allergens,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1546069901?w=400',
        active
      };
      updated = [...menuItems, newMenu];
    }
    setMenuItems(updated);
    localSet('menuItems', updated);
  };

  const updatePlans = (planId, updates) => {
    const updated = plans.map(p => p.id === planId ? { ...p, ...updates } : p);
    setPlans(updated);
    localSet('plans', updated);
  };

  const createPlan = (name, description, credits, price, validity) => {
    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      description,
      meal_credits: parseInt(credits),
      price: parseFloat(price),
      validity_days: parseInt(validity),
      active: true,
      display_order: plans.length + 1
    };
    const updated = [...plans, newPlan];
    setPlans(updated);
    localSet('plans', updated);
  };

  const updateGlobalSettings = (newSettings) => {
    const updated = { ...paymentSettings, ...newSettings };
    setPaymentSettings(updated);
    localSet('paymentSettings', updated);
  };

  return (
    <AppDataContext.Provider
      value={{
        isRealSupabase: false,
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
        signInWithOAuth: async () => { console.log('Mock: signInWithOAuth called'); },
        loginCustomer,
        logoutCustomer,
        loginAdmin,
        logoutAdmin,
        buyPackage,
        uploadPendingProof,
        approvePurchase,
        rejectPurchase,
        scheduleBooking,
        cancelBookingBeforeCutoff,
        markBookingDelivered,
        markBookingMissed,
        createDropWindow,
        createDropWindowsBatch,
        updateDropWindow,
        deleteDropWindow,
        uploadMenuImage,
        assignMenu,
        updatePlans,
        createPlan,
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
