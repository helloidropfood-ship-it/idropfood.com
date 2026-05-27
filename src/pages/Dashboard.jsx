import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockData } from '../context/AppDataContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import FormInput from '../components/FormInput';
import FileUploader from '../components/FileUploader';
import CalendarCard from '../components/CalendarCard';
import StatusPill from '../components/StatusPill';
import Modal from '../components/Modal';

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    logoutCustomer,
    plans,
    purchases,
    dropWindows,
    menuItems,
    bookings,
    paymentSettings,
    buyPackage,
    uploadPendingProof,
    scheduleBooking,
    cancelBookingBeforeCutoff
  } = useMockData();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/auth');
    }
  }, [currentUser, navigate]);

  // UI Modals / Form states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  // Dynamic slot selection during checkout (required for Trial Drop, optional for others)
  const [preSelectedSlots, setPreSelectedSlots] = useState([]);

  // Retry Proof Upload states
  const [isRetryOpen, setIsRetryOpen] = useState(false);
  const [retryPurchase, setRetryPurchase] = useState(null);
  const [retryPaymentMethod, setRetryPaymentMethod] = useState('bank_transfer');
  const [retryAmount, setRetryAmount] = useState('');
  const [retryFile, setRetryFile] = useState(null);
  const [retryError, setRetryError] = useState('');
  const [loadingRetry, setLoadingRetry] = useState(false);

  // Weekly Menu Gallery states
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is start of week
    return new Date(d.setDate(diff));
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const d = new Date();
    return d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon, 6=Sun
  });

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const handleOpenRetryUpload = (purchase) => {
    const plan = plans.find(p => p.id === purchase.plan_id);
    setRetryPurchase(purchase);
    setRetryAmount(plan ? plan.price.toString() : '');
    setRetryPaymentMethod(purchase.payment_method || 'bank_transfer');
    setRetryFile(null);
    setRetryError('');
    setIsRetryOpen(true);
  };

  const handleRetrySubmit = async (e) => {
    e.preventDefault();
    if (!retryFile) {
      setRetryError('Please upload a screenshot of your payment receipt.');
      return;
    }
    setRetryError('');
    setLoadingRetry(true);
    try {
      await uploadPendingProof(retryPurchase.id, retryFile, retryAmount, retryPaymentMethod);
      setIsRetryOpen(false);
      setSuccessMessage('Payment proof uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setRetryError(err.message || 'Failed to upload proof. Please try again.');
    } finally {
      setLoadingRetry(false);
    }
  };

  const handleOpenCheckout = (plan) => {
    setSelectedPlan(plan);
    setSubmittedAmount(plan.price.toString());
    setPreSelectedSlots([]);
    setReceiptFile(null);
    setCheckoutError('');
    setIsCheckoutOpen(true);
  };

  // Check if there was an incoming checkout request from Landing
  useEffect(() => {
    if (location.state?.checkoutPlanId && plans.length > 0) {
      const plan = plans.find(p => p.id === location.state.checkoutPlanId);
      if (plan) {
        handleOpenCheckout(plan);
      }
    }
  }, [location.state, plans]);

  if (!currentUser) return null;

  // Calculate User Balance Stats
  const userPurchases = purchases.filter(p => p.user_id === currentUser.id);
  const activeCredits = userPurchases
    .filter(p => p.payment_status === 'approved')
    .reduce((acc, p) => acc + p.remaining_credits, 0);

  const userBookings = bookings.filter(b => b.user_id === currentUser.id);
  const activeReservations = userBookings.filter(b => ['scheduled', 'locked'].includes(b.status));
  const pastDrops = userBookings.filter(b => ['delivered', 'missed', 'cancelled'].includes(b.status));

  // Get upcoming drop windows
  const availableWindows = dropWindows
    .filter(w => w.active)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Group windows by Date
  const groupedWindows = {};
  availableWindows.forEach(w => {
    if (!groupedWindows[w.date]) {
      groupedWindows[w.date] = [];
    }
    const menu = menuItems.find(m => m.drop_window_id === w.id);
    groupedWindows[w.date].push({
      ...w,
      menu_item: menu
    });
  });

  const handleToggleCheckoutSlot = (slotId) => {
    if (selectedPlan?.id === 'plan-trial') {
      // Trial drop is only 1 meal, replace selection
      setPreSelectedSlots([slotId]);
    } else {
      // Lite/Core/Full Pack: limit selection to max credits of the pack
      if (preSelectedSlots.includes(slotId)) {
        setPreSelectedSlots(preSelectedSlots.filter(id => id !== slotId));
      } else {
        if (preSelectedSlots.length >= selectedPlan.meal_credits) {
          setCheckoutError(`You can pre-schedule a maximum of ${selectedPlan.meal_credits} meals matching this pack.`);
          return;
        }
        setCheckoutError('');
        setPreSelectedSlots([...preSelectedSlots, slotId]);
      }
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setCheckoutError('Please upload a screenshot of your payment receipt.');
      return;
    }

    if (selectedPlan.id === 'plan-trial' && preSelectedSlots.length === 0) {
      setCheckoutError('Trial Drops require immediate date and shift scheduling. Please select 1 slot.');
      return;
    }

    setCheckoutError('');
    setLoadingCheckout(true);
    try {
      await buyPackage(selectedPlan.id, paymentMethod, submittedAmount, receiptFile, preSelectedSlots);
      setIsCheckoutOpen(false);
      setSuccessMessage(`Checkout submitted! Package pending verification. Your draft bookings have been logged.`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setCheckoutError(err.message || 'Failed to complete checkout. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleScheduleClick = async (windowId) => {
    if (activeCredits <= 0) {
      setCheckoutError('No remaining credits. Select a pack to top up.');
      setTimeout(() => setCheckoutError(''), 4000);
      return;
    }

    const res = await scheduleBooking(currentUser.id, windowId);
    if (!res.success) {
      alert(res.message);
    } else {
      setSuccessMessage('Meal scheduled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCancelClick = async (bookingId) => {
    const res = await cancelBookingBeforeCutoff(bookingId);
    if (!res.success) {
      alert(res.message);
    } else {
      setSuccessMessage('Meal drop cancelled. Credit refunded.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className="page-dashboard" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <header
        className="dash-header"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface-solid)',
          padding: '16px 24px'
        }}
      >
        <div
          className="dash-header-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="dash-brand-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-grad-dash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
              <path d="M16 2C9.37 8.63 6 13.5 6 18C6 23.52 10.48 28 16 28C21.52 28 26 23.52 26 18C26 13.5 22.63 8.63 16 2ZM16 22C13.79 22 12 20.21 12 18C12 16.2 13.5 13.8 16 10.6C18.5 13.8 20 16.2 20 18C20 20.21 18.21 22 16 22Z" fill="url(#logo-grad-dash)" />
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>
              iDrop<span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Food</span><span style={{ color: 'var(--accent)' }}>.</span>
            </span>
            <Badge variant="secondary" outline>Corporate Portal</Badge>
          </div>

          <div className="dash-user-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              👤 {currentUser.name} ({currentUser.floor})
            </span>
            <button
              onClick={logoutCustomer}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className="dash-main u-grid"
        style={{
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          padding: '32px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Credits Balance & Package Purchase */}
        <div className="dash-left-col" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {successMessage && (
            <div
              className="dash-item-success"
              style={{
                background: 'var(--success-glow)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.88rem',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✅ {successMessage}
            </div>
          )}

          {/* Credits Balance Card */}
          <div className="dash-item-balance">
            <Card hoverable={false} className="animate-slide-up delay-100">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Available Meal Balance
                </p>
                <h2
                  className="dash-credits-value"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    margin: '8px 0',
                    color: activeCredits > 0 ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                >
                  {activeCredits} <span style={{ fontSize: '1.2rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Credits</span>
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  1 credit = 1 meal drop. Schedule anytime prior to the window's cutoff.
                </p>
              </div>
            </Card>
          </div>

          {/* Packages Purchase Options */}
          <div className="dash-item-packages">
            <Card title="Acquire Meal Credits" subtitle="Select a bundle to top up your meal balance instantly." className="animate-slide-up delay-200">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plans
                  .filter(p => p.active)
                  .sort((a,b) => a.display_order - b.display_order)
                  .map(plan => (
                    <div
                      key={plan.id}
                      className="dash-plan-row"
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {plan.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>({plan.meal_credits} Credits)</span>
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Rs. {plan.price.toLocaleString()} • {plan.validity_days} Days Expiry
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => handleOpenCheckout(plan)} size="sm">
                        Select
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Active Bookings list */}
          <div className="dash-item-upcoming">
            <Card title="Upcoming Scheduled Drops" subtitle="Your locked and upcoming active drop-offs." className="animate-slide-up delay-300">
              {activeReservations.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  No active reservations. Schedule your drop dates using the calendar on the right.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeReservations.map(book => {
                    const win = dropWindows.find(w => w.id === book.drop_window_id);
                    const menu = menuItems.find(m => m.id === book.menu_item_id);
                    const isPastCutoff = win ? new Date() > new Date(win.cutoff_time) : true;
                    const isCancelable = book.status === 'scheduled' && !isPastCutoff;

                    return (
                      <div
                        key={book.id}
                        style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
                            {win ? new Date(win.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                          </span>
                          <StatusPill status={isPastCutoff ? 'locked' : book.status} />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h5 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{menu ? menu.meal_name : 'Meal'}</h5>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {win ? `${win.window_name} (${win.start_time.substring(0, 5)} - ${win.end_time.substring(0, 5)})` : ''}
                            </span>
                          </div>

                          {isCancelable && (
                            <Button variant="danger" onClick={() => handleCancelClick(book.id)} size="sm" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Past Drops & Transactions List */}
          <div className="dash-item-history">
            <Card title="Activity History" subtitle="Your transaction history and past drops." hoverable={false} className="animate-slide-up delay-400">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Transactions list */}
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Transactions
                  </h4>
                  {userPurchases.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No packages purchased.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {userPurchases.map(pur => {
                        const plan = plans.find(p => p.id === pur.plan_id);
                        return (
                          <div
                            key={pur.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.82rem',
                              paddingBottom: '8px',
                              borderBottom: '1px dashed var(--border-color)'
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600 }}>{plan ? plan.name : 'Pack'}</span>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(pur.created_at).toLocaleDateString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 600 }}>Rs. {plan?.price.toLocaleString()}</span>
                              <div>
                                <StatusPill status={pur.payment_status} />
                              </div>
                              {pur.payment_status === 'pending_payment' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRetryUpload(pur)}
                                  style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    color: 'var(--accent)',
                                    fontSize: '0.72rem',
                                    padding: '3px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    marginTop: '4px',
                                    fontWeight: 600,
                                    display: 'inline-block'
                                  }}
                                >
                                  Retry Upload
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Past Drops list */}
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Past Drops
                  </h4>
                  {pastDrops.length === 0 ? (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No past drops recorded.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pastDrops.map(book => {
                        const win = dropWindows.find(w => w.id === book.drop_window_id);
                        const menu = menuItems.find(m => m.id === book.menu_item_id);
                        return (
                          <div key={book.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <div>
                              <span style={{ fontWeight: 500 }}>{menu ? menu.meal_name : 'Meal'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>
                                {win ? `${new Date(win.date).toLocaleDateString()} - ${win.window_name}` : ''}
                              </span>
                            </div>
                            <StatusPill status={book.status} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Weekly Menu Gallery */}
        <div className="dash-right-col animate-slide-up delay-200" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 700, marginBottom: '4px' }}>
                Weekly Menu Gallery
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Select a day to view its available drops and add them to your schedule.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={handlePrevWeek}>&larr; Prev Week</Button>
              <Button variant="secondary" size="sm" onClick={handleNextWeek}>Next Week &rarr;</Button>
            </div>
          </div>

          {checkoutError && (
            <div
              style={{
                background: 'var(--error-glow)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: 'var(--error)'
              }}
            >
              ⚠️ {checkoutError}
            </div>
          )}

          {/* Day Tabs */}
          <div className="menu-gallery-tabs">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, idx) => {
              const isActive = selectedDayIndex === idx;
              
              // Calculate specific date for the tab
              const tabDate = new Date(currentWeekStart);
              tabDate.setDate(tabDate.getDate() + idx);
              const dateText = tabDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              // Check if user has a booking on this date
              const dateStr = tabDate.toISOString().split('T')[0];
              const hasBooking = userBookings.some(b => {
                const win = dropWindows.find(w => w.id === b.drop_window_id);
                return win && win.date === dateStr && ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status);
              });

              return (
                <div 
                  key={dayName}
                  className={`menu-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedDayIndex(idx)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{dayName}</span>
                    {hasBooking && (
                      <span 
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} 
                        title="Meal Scheduled"
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>{dateText}</span>
                </div>
              );
            })}
          </div>

          {/* Meal Cards Grid for Selected Day */}
          <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            {(() => {
              // Calculate the actual date for the selected day tab (currentWeekStart is a Monday)
              const selectedDate = new Date(currentWeekStart);
              selectedDate.setDate(selectedDate.getDate() + selectedDayIndex);
              const dateStr = selectedDate.toISOString().split('T')[0];

              const wins = groupedWindows[dateStr] || [];
              
              if (wins.length === 0) {
                return (
                  <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No drops scheduled for this day.</p>
                  </div>
                );
              }

              return wins.map(win => {
                const dayBookings = userBookings.filter(b => b.drop_window_id === win.id && ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status));
                const isBooked = dayBookings.length > 0;
                
                // Other bookings on the same day to prevent double booking
                const anyDayBooking = userBookings.filter(b => {
                   const w = dropWindows.find(dw => dw.id === b.drop_window_id);
                   return w && w.date === dateStr && ['scheduled', 'locked', 'delivered', 'missed'].includes(b.status);
                });

                const remaining = win.capacity - win.booked_count;
                const isFull = remaining <= 0;
                const isPast = new Date() > new Date(win.cutoff_time);
                const isSelectable = !isFull && !isPast && win.active && win.status !== 'hidden/cancelled';
                
                const menu = win.menu_item;

                return (
                  <div key={win.id} className="meal-gallery-card" style={{ position: 'relative' }}>
                    {isBooked && (
                      <div style={{
                        position: 'absolute', top: '24px', right: '24px', background: 'var(--success)', color: '#fff',
                        fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', zIndex: 10
                      }}>
                        BOOKED
                      </div>
                    )}
                    
                    <div style={{ width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', background: '#2a2d36', position: 'relative' }}>
                      {menu?.image_url ? (
                        <img src={menu.image_url} alt={menu.meal_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          No Image
                        </div>
                      )}
                      {/* Scarcity badge */}
                      {isSelectable && remaining <= 5 && !isBooked && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(245, 158, 11, 0.9)', color: '#000', fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          Only {remaining} left!
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          {menu ? menu.meal_name : 'To Be Decided'}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>
                          {win.window_name} ({win.start_time.substring(0,5)} - {win.end_time.substring(0,5)})
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0, flex: 1 }}>
                        {menu ? menu.description : 'Menu details for this drop have not been published yet.'}
                      </p>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                      <button 
                        className="btn-gradient-gold-blue"
                        disabled={!isSelectable || isBooked || (anyDayBooking.length > 0 && !isBooked) || activeCredits <= 0}
                        onClick={() => {
                          if (anyDayBooking.length > 0 && !isBooked) {
                            alert("You already have a scheduled drop for this day.");
                            return;
                          }
                          handleScheduleClick(win.id);
                        }}
                      >
                        {isBooked ? 'Added to Schedule' : isPast ? 'Cutoff Passed' : isFull ? 'Sold Out' : 'Add to Schedule'}
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && selectedPlan && (
        <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title={`Checkout: ${selectedPlan.name}`}>
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Step 1: Account Transfer Info */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)' }}>
                1. Transfer exact amount manually:
              </h4>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0' }}>
                Rs. {selectedPlan.price.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {paymentSettings?.instruction_text}
              </p>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div>🏦 <span style={{ color: 'var(--text-muted)' }}>Bank:</span> <strong>{paymentSettings?.bank_name}</strong></div>
                <div>👤 <span style={{ color: 'var(--text-muted)' }}>Title:</span> <strong>{paymentSettings?.bank_account_title}</strong></div>
                <div>🔢 <span style={{ color: 'var(--text-muted)' }}>Account:</span> <strong>{paymentSettings?.bank_account_number}</strong></div>
                <div>🌍 <span style={{ color: 'var(--text-muted)' }}>IBAN:</span> <code>{paymentSettings?.bank_iban}</code></div>
                <div>📱 <span style={{ color: 'var(--text-muted)' }}>Raast ID:</span> <strong>{paymentSettings?.raast_id}</strong></div>
              </div>
            </div>

            {/* Step 2: Payment Details Submission */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                2. Input payment credentials:
              </h4>

              <FormInput
                label="Payment Method"
                name="paymentMethod"
                type="select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer (Meezan/Other)' },
                  { value: 'raast', label: 'Raast Transfer' },
                  { value: 'easypaisa', label: 'EasyPaisa' },
                  { value: 'jazzcash', label: 'JazzCash' }
                ]}
                required
              />

              <FormInput
                label="Submitted Amount (PKR)"
                name="submittedAmount"
                type="number"
                value={submittedAmount}
                onChange={(e) => setSubmittedAmount(e.target.value)}
                required
              />

              <FileUploader
                label="Transaction Receipt Image"
                value={receiptFile}
                onChange={(file) => setReceiptFile(file)}
                required
              />
            </div>

            {/* Step 3: Hybrid model calendar selector (Trial requires immediate lock; others optional) */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                3. Choose drop dates:
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {selectedPlan.id === 'plan-trial' 
                  ? '⚠️ Trial Drop requires immediate slot scheduling. Select 1 slot below.'
                  : `Select up to ${selectedPlan.meal_credits} dates/shifts to reserve immediately. You can also leave them unscheduled and choose dates later.`}
              </p>

              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '8px 0' }}>
                {availableWindows.map(win => {
                  const isSelected = preSelectedSlots.includes(win.id);
                  const remaining = win.capacity - win.booked_count;
                  const isFull = remaining <= 0;
                  const isPast = new Date() > new Date(win.cutoff_time);
                  const isSelectable = !isFull && !isPast;

                  if (!isSelectable) return null;

                  return (
                    <div
                      key={win.id}
                      onClick={() => handleToggleCheckoutSlot(win.id)}
                      style={{
                        minWidth: '130px',
                        background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        opacity: isSelected ? 1 : 0.7
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {new Date(win.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
                        {win.window_name}
                      </div>
                      <span style={{ fontSize: '0.62rem', color: 'var(--accent)' }}>
                        {remaining} left
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {checkoutError && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
                ⚠️ {checkoutError}
              </span>
            )}

            <Button type="submit" variant="accent" style={{ marginTop: '10px' }} disabled={loadingCheckout}>
              {loadingCheckout ? 'Submitting...' : 'Confirm Payment & Submit'}
            </Button>
          </form>
        </Modal>
      )}

      {/* Retry Upload Modal */}
      {isRetryOpen && retryPurchase && (
        <Modal isOpen={isRetryOpen} onClose={() => setIsRetryOpen(false)} title="Upload Payment Proof">
          <form onSubmit={handleRetrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent)' }}>
                1. Transfer exact amount manually:
              </h4>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0' }}>
                Rs. {parseFloat(retryAmount).toLocaleString()}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {paymentSettings?.instruction_text}
              </p>

              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div>🏦 <span style={{ color: 'var(--text-muted)' }}>Bank:</span> <strong>{paymentSettings?.bank_name}</strong></div>
                <div>👤 <span style={{ color: 'var(--text-muted)' }}>Title:</span> <strong>{paymentSettings?.bank_account_title}</strong></div>
                <div>🔢 <span style={{ color: 'var(--text-muted)' }}>Account:</span> <strong>{paymentSettings?.bank_account_number}</strong></div>
                <div>🌍 <span style={{ color: 'var(--text-muted)' }}>IBAN:</span> <code>{paymentSettings?.bank_iban}</code></div>
                <div>📱 <span style={{ color: 'var(--text-muted)' }}>Raast ID:</span> <strong>{paymentSettings?.raast_id}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                2. Input payment credentials:
              </h4>

              <FormInput
                label="Payment Method"
                name="retryPaymentMethod"
                type="select"
                value={retryPaymentMethod}
                onChange={(e) => setRetryPaymentMethod(e.target.value)}
                options={[
                  { value: 'bank_transfer', label: 'Bank Transfer (Meezan/Other)' },
                  { value: 'raast', label: 'Raast Transfer' },
                  { value: 'easypaisa', label: 'EasyPaisa' },
                  { value: 'jazzcash', label: 'JazzCash' }
                ]}
                required
              />

              <FormInput
                label="Submitted Amount (PKR)"
                name="retryAmount"
                type="number"
                value={retryAmount}
                onChange={(e) => setRetryAmount(e.target.value)}
                required
              />

              <FileUploader
                label="Transaction Receipt Image"
                value={retryFile}
                onChange={(file) => setRetryFile(file)}
                required
              />
            </div>

            {retryError && (
              <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>
                ⚠️ {retryError}
              </span>
            )}

            <Button type="submit" variant="accent" style={{ marginTop: '10px' }} disabled={loadingRetry}>
              {loadingRetry ? 'Uploading...' : 'Submit Payment Proof'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
