-- Development Seed Script for Admin Users
-- This script promotes test auth users to admin/operations roles in public.admin_users.
-- WARNING: Do not run this script in production.

BEGIN;

-- Promote owner@idropfood.com to owner
INSERT INTO public.admin_users (auth_user_id, name, role)
SELECT id, 'Dev Owner', 'owner'
FROM auth.users
WHERE email = 'owner@idropfood.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'owner';

-- Promote admin@idropfood.com to admin
INSERT INTO public.admin_users (auth_user_id, name, role)
SELECT id, 'Dev Admin', 'admin'
FROM auth.users
WHERE email = 'admin@idropfood.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin';

-- Promote operations@idropfood.com to operations
INSERT INTO public.admin_users (auth_user_id, name, role)
SELECT id, 'Dev Operations', 'operations'
FROM auth.users
WHERE email = 'operations@idropfood.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'operations';

-- Promote ops@idropfood.com to operations
INSERT INTO public.admin_users (auth_user_id, name, role)
SELECT id, 'Dev Ops', 'operations'
FROM auth.users
WHERE email = 'ops@idropfood.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'operations';

COMMIT;
