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

async function checkUsers() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const query = `
    SELECT 'auth.users' as source, id::text, email, role, NULL as admin_role FROM auth.users
    UNION ALL
    SELECT 'public.admin_users' as source, id::text, name, NULL as email, role as admin_role FROM public.admin_users
    UNION ALL
    SELECT 'public.users' as source, id::text, name, email, NULL as admin_role FROM public.users;
  `;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  try {
    const json = JSON.parse(text);
    console.table(json);
  } catch (e) {
    console.log('Response:', text);
  }
}

checkUsers().catch(console.error);
