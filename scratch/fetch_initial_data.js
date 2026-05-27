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

async function runQuery(query) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const text = await res.text();
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Query failed: ${res.status} - ${text}`);
  }
  return JSON.parse(text);
}

async function main() {
  console.log('Fetching existing plans, drop windows, and settings...');
  const plans = await runQuery('SELECT id, name, meal_credits, price, active FROM public.plans;');
  console.log('Plans:');
  console.table(plans);

  const windows = await runQuery('SELECT id, window_name, date, start_time, end_time, capacity, booked_count, cutoff_time, status, active FROM public.drop_windows ORDER BY date DESC LIMIT 5;');
  console.log('Drop Windows:');
  console.table(windows);

  const settings = await runQuery('SELECT * FROM public.payment_settings LIMIT 1;');
  console.log('Payment Settings:');
  console.table(settings);
}

main().catch(console.error);
