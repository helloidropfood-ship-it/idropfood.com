/**
 * Helper Utilities for iDropFood Platform
 */

/**
 * Checks if the cutoff time has passed.
 * @param {string|Date} cutoffTime - The cutoff timestamp from drop_windows.cutoff_time
 * @returns {boolean} True if the current time is past the cutoff time.
 */
export const checkCutoffStatus = (cutoffTime) => {
  if (!cutoffTime) return true;
  const cutoffDate = new Date(cutoffTime);
  const now = new Date();
  return now >= cutoffDate;
};

/**
 * Formats a timestamp into Karachi Time (UTC+5) with a clean display.
 * @param {string|Date} dateVal - ISO string or Date object
 * @returns {string} Formatted local time string
 */
export const formatKarachiTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' (PKT)';
};

/**
 * Calculates remaining open slots.
 * @param {number} capacity - Seat capacity limit
 * @param {number} bookedCount - Confirmed booked count
 * @returns {number} Open slots remaining
 */
export const calculateSlotsLeft = (capacity, bookedCount) => {
  const cap = Number(capacity) || 0;
  const booked = Number(bookedCount) || 0;
  return Math.max(0, cap - booked);
};

/**
 * Checks if a customer is eligible to schedule a new booking.
 * @param {object} user - User profile data
 * @param {object} purchase - Approved purchase data
 * @param {object} dropWindow - Selected drop window data
 * @returns {object} { eligible: boolean, reason: string }
 */
export const checkBookingEligibility = (user, purchase, dropWindow) => {
  if (!user) {
    return { eligible: false, reason: 'User session not found.' };
  }
  if (!purchase || purchase.payment_status !== 'approved') {
    return { eligible: false, reason: 'No approved active credit package found.' };
  }
  if (purchase.remaining_credits <= 0) {
    return { eligible: false, reason: 'No remaining meal credits left.' };
  }
  if (!dropWindow || !dropWindow.active || dropWindow.status !== 'open') {
    return { eligible: false, reason: 'This drop window is currently unavailable.' };
  }
  if (checkCutoffStatus(dropWindow.cutoff_time)) {
    return { eligible: false, reason: 'The lock cutoff time for this drop window has passed.' };
  }
  if (dropWindow.booked_count >= dropWindow.capacity) {
    return { eligible: false, reason: 'This drop window is at full seat capacity.' };
  }
  return { eligible: true, reason: '' };
};

/**
 * Returns user-facing label and styling details for payment statuses.
 * @param {string} status - payment_status literal
 * @returns {object} { label: string, color: string }
 */
export const getPaymentStatusConfig = (status) => {
  switch (status) {
    case 'pending_payment':
      return { label: 'Pending Payment', color: 'var(--text-muted)' };
    case 'proof_uploaded':
      return { label: 'Proof Verification Pending', color: 'var(--accent)' };
    case 'approved':
      return { label: 'Active / Approved', color: 'var(--success)' };
    case 'rejected':
      return { label: 'Payment Rejected', color: 'var(--error)' };
    case 'refunded':
      return { label: 'Refunded', color: 'var(--primary)' };
    default:
      return { label: status || 'Unknown', color: 'var(--text-secondary)' };
  }
};

/**
 * Returns user-facing label and styling details for booking statuses.
 * @param {string} status - booking status literal
 * @returns {object} { label: string, color: string }
 */
export const getBookingStatusConfig = (status) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft (Checkout pending)', color: 'var(--text-muted)' };
    case 'scheduled':
      return { label: 'Scheduled', color: 'var(--primary)' };
    case 'locked':
      return { label: 'Locked & Prep in Progress', color: 'var(--accent)' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'var(--text-secondary)' };
    case 'delivered':
      return { label: 'Delivered', color: 'var(--success)' };
    case 'missed':
      return { label: 'Missed / Uncollected', color: 'var(--error)' };
    default:
      return { label: status || 'Unknown', color: 'var(--text-secondary)' };
  }
};

/**
 * Role access validation guard.
 * @param {string} userRole - admin role ('owner', 'admin', 'operations')
 * @param {string} requiredRole - min required role
 * @returns {boolean} True if authorized
 */
export const hasAdminAccess = (userRole, requiredRole) => {
  if (!userRole) return false;
  
  const roleHierarchies = {
    owner: 3,
    admin: 2,
    operations: 1,
  };

  const userPower = roleHierarchies[userRole] || 0;
  const requiredPower = roleHierarchies[requiredRole] || 99;

  return userPower >= requiredPower;
};
