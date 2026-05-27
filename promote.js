import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function promoteToOwner(email) {
  try {
    // 1. Get the auth user ID from auth.users (requires admin auth api)
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.log(`User with email ${email} not found in auth.users.`);
      return;
    }

    const authUserId = user.id;

    // 2. Fetch from public.users to get the name
    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;

    const name = profile ? profile.name : email;

    // 3. Upsert into public.admin_users
    const { data: adminUser, error: adminErr } = await supabase
      .from('admin_users')
      .upsert(
        { auth_user_id: authUserId, name: name, role: 'owner' },
        { onConflict: 'auth_user_id' }
      )
      .select()
      .single();

    if (adminErr) throw adminErr;

    console.log(`Successfully promoted ${email} to owner!`);
    console.log(adminUser);
  } catch (error) {
    console.error('Error:', error);
  }
}

promoteToOwner('mzohaibshafi@gmail.com');
