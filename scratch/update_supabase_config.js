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

async function updateAuthConfig() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  
  // Get current config first
  const getRes = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const currentConfig = await getRes.json();
  console.log('Current site_url:', currentConfig.site_url);
  console.log('Current uri_allow_list:', currentConfig.uri_allow_list);

  // We want to add redirects:
  // - https://www.idropfood.com/auth
  // - https://idropfood-4qbpa41b7-idropfood-s-projects.vercel.app/auth
  // - https://idropfood-n2fguvtjl-idropfood-s-projects.vercel.app/auth
  // Let's combine them into the uri_allow_list. It's comma separated or an array.
  // Actually in the Management API, uri_allow_list is a string of comma-separated URLs or an array of strings depending on the api version.
  // Let's look at the GET output: "Auth Config URI Allow List: undefined" or empty.
  // Let's test sending an array first. If that fails or if we want to be safe, let's see.
  // Wait, let's try PATCH. Let's see what keys are in currentConfig.
  console.log('Full config keys:', Object.keys(currentConfig));

  const payload = {
    site_url: 'https://www.idropfood.com',
    uri_allow_list: 'http://localhost:5173/auth,https://www.idropfood.com/auth,https://idropfood-4qbpa41b7-idropfood-s-projects.vercel.app/auth,https://idropfood-n2fguvtjl-idropfood-s-projects.vercel.app/auth'
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  console.log('PATCH Status:', res.status);
  console.log('PATCH Response:', text);
}

updateAuthConfig().catch(console.error);
