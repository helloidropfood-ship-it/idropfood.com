-- Supabase Storage Bucket Configuration
-- Sprint 1 — DIG-176: Configure Supabase storage buckets
-- Applied separately after schema migration.
-- Creates: payment_proofs (private), menu_images (public)

-- ==========================================
-- 1. CREATE STORAGE BUCKETS
-- ==========================================

-- payment_proofs: PRIVATE bucket for payment proof images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment_proofs',
  'payment_proofs',
  false,            -- PRIVATE: not publicly readable
  5242880,          -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

-- menu_images: PUBLIC bucket for menu item photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu_images',
  'menu_images',
  true,             -- PUBLIC: publicly readable
  10485760,         -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];


-- ==========================================
-- 2. PAYMENT PROOFS STORAGE POLICIES
-- ==========================================

-- Drop existing policies to allow idempotent re-run
DROP POLICY IF EXISTS "Customers can upload their own payment proof" ON storage.objects;
DROP POLICY IF EXISTS "Customers can read their own payment proof" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read menu images" ON storage.objects;

-- Policy: Customers can upload their own payment proofs
-- File path convention: payment_proofs/{user_id}/{filename}
-- auth.uid() must match the first path segment (user_id)
CREATE POLICY "Customers can upload their own payment proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment_proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Customers can read (download) only their own payment proofs
CREATE POLICY "Customers can read their own payment proof"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment_proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins (owner/admin) can read ALL payment proofs for review
-- Admin role is confirmed via admin_users table lookup
CREATE POLICY "Admins can read all payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment_proofs'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Policy: Admins (owner/admin) can delete payment proof files (e.g., cleanup)
CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment_proofs'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);


-- ==========================================
-- 3. MENU IMAGES STORAGE POLICIES
-- ==========================================

-- Policy: Anyone (including unauthenticated) can view/read menu images
CREATE POLICY "Anyone can read menu images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'menu_images');

-- Policy: Only admin or owner can upload new menu images
CREATE POLICY "Only admins can upload menu images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu_images'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Policy: Only admin or owner can update (replace) menu images
CREATE POLICY "Only admins can update menu images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu_images'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);

-- Policy: Only admin or owner can delete menu images
CREATE POLICY "Only admins can delete menu images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu_images'
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid()
      AND role IN ('owner', 'admin')
  )
);
