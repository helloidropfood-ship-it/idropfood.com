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

console.log('Project Ref:', projectRef);

async function checkAuthConfig() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  console.log('Status:', res.status);
  try {
    const json = JSON.parse(text);
    console.log('Auth Config URI Allow List:', json.uri_allow_list);
    console.log('Site URL:', json.site_url);
  } catch (e) {
    console.log('Response:', text);
  }
}

checkAuthConfig().catch(console.error);
