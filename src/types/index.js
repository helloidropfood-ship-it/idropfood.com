/**
 * Types & Schema Definitions for iDropFood Platform
 * Documented via JSDoc for IDE autocomplete and documentation consistency.
 */

/**
 * @typedef {Object} User
 * @property {string} id - UUID primary key (references auth.users.id)
 * @property {string} name - User's full name
 * @property {string} phone - WhatsApp number used for lightweight identity
 * @property {string} [email] - Optional email address
 * @property {string} company - Company location (Default: 'Shahrah-e-Faisal')
 * @property {string} floor - Floor number (e.g., '3rd Floor')
 * @property {string} department - Department / Team name
 * @property {string} [delivery_notes] - Optional dispatch instruction text
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id - UUID primary key
 * @property {string} auth_user_id - References auth.users.id
 * @property {string} name - Admin's full name
 * @property {'owner'|'admin'|'operations'} role - Admin security level role
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Plan
 * @property {string} id - UUID primary key
 * @property {string} name - Package name (e.g. Trial Drop, Core Pack)
 * @property {string} [description] - Plan description
 * @property {number} meal_credits - Meal counts in package
 * @property {number} price - Cost in local currency (PKR)
 * @property {number} validity_days - Days before expiration (Default: 30)
 * @property {boolean} active - Status of package availability
 * @property {number} display_order - Sort precedence index
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Purchase
 * @property {string} id - UUID primary key
 * @property {string} user_id - References users.id
 * @property {string} plan_id - References plans.id
 * @property {number} total_credits - Meal credits purchased
 * @property {number} remaining_credits - Available credits left
 * @property {string} payment_method - Payment channel (e.g. Raast, Bank Transfer)
 * @property {'pending_payment'|'proof_uploaded'|'approved'|'rejected'|'refunded'} payment_status - Status of verification
 * @property {string} [admin_notes] - Internal admin reviewer comments
 * @property {string} created_at - Transaction timestamp
 */

/**
 * @typedef {Object} PaymentProof
 * @property {string} id - UUID primary key
 * @property {string} purchase_id - References purchases.id
 * @property {string} proof_image_url - Path to screenshot in private bucket
 * @property {string} payment_method - Used transfer method
 * @property {number} submitted_amount - Transaction amount
 * @property {string} [transaction_reference] - Optional reference code
 * @property {'pending'|'approved'|'rejected'} status - Review outcome
 * @property {string} [admin_notes] - Optional reviewer notes
 * @property {string} [reviewed_by] - References admin_users.id
 * @property {string} [reviewed_at] - Review timestamp
 * @property {string} created_at - Proof submission timestamp
 */

/**
 * @typedef {Object} DropWindow
 * @property {string} id - UUID primary key
 * @property {string} date - Shift date (YYYY-MM-DD)
 * @property {string} window_name - Type label ('Day Drop' or 'Night Drop')
 * @property {string} start_time - Shift delivery start time (HH:MM:SS)
 * @property {string} end_time - Shift delivery end time (HH:MM:SS)
 * @property {number} capacity - Seat capacity limit
 * @property {number} booked_count - Dynamically tracked bookings count
 * @property {string} cutoff_time - Locking cutoff time (timestamptz)
 * @property {'open'|'locked'|'full'|'completed'|'hidden/cancelled'} status - Shift locking/operational status
 * @property {boolean} active - Active/disabled state
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id - UUID primary key
 * @property {string} drop_window_id - References drop_windows.id
 * @property {string} meal_name - Chef dish name
 * @property {string} [description] - Detailed dish elements
 * @property {string} [allergens] - Common allergens list
 * @property {string} [image_url] - Path to dish picture in public bucket
 * @property {boolean} active - Active state
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Booking
 * @property {string} id - UUID primary key
 * @property {string} user_id - References users.id
 * @property {string} purchase_id - References purchases.id
 * @property {string} drop_window_id - References drop_windows.id
 * @property {string} menu_item_id - References menu_items.id
 * @property {'draft'|'scheduled'|'locked'|'cancelled'|'delivered'|'missed'} status - Reservation progress state
 * @property {string} created_at - Booking timestamp
 * @property {string} [locked_at] - Cutoff lock transition timestamp
 */

/**
 * @typedef {Object} PaymentSettings
 * @property {string} id - UUID primary key
 * @property {string} [bank_name] - Core bank name
 * @property {string} [bank_account_title] - Account holder name
 * @property {string} [bank_account_number] - Account ID
 * @property {string} [bank_iban] - International ID code
 * @property {string} [raast_id] - Instant transfer Raast ID
 * @property {string} [jazzcash_number] - Mobile wallet number
 * @property {string} [easypaisa_number] - Mobile wallet number
 * @property {string} [instruction_text] - Guide description
 * @property {boolean} trial_drop_active - Toggles trial pack availability
 * @property {string} [launch_messaging] - Global alert ticker text
 * @property {string} [contact_whatsapp] - Support channel link
 * @property {string} updated_at - Timestamp of latest changes
 */

export {};
