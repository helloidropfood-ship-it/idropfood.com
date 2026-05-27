import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const token = getEnvVar('SUPABASE_ACCESS_TOKEN');
const projectRef = getEnvVar('SUPABASE_PROJECT_REF');

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
  try {
    const json = JSON.parse(text);
    console.log('Available keys in Auth Config:');
    const smtpKeys = Object.keys(json).filter(key => key.includes('smtp') || key.includes('mail'));
    console.log('SMTP/Mail keys:', smtpKeys);
    console.log('Specific SMTP fields status (without showing credentials):');
    for (const key of smtpKeys) {
      if (key.includes('pass')) {
        console.log(`  ${key}: [REDACTED (length: ${json[key] ? json[key].length : 0})]`);
      } else {
        console.log(`  ${key}:`, json[key]);
      }
    }
  } catch (e) {
    console.log('Failed to parse json. Response:', text);
  }
}

checkAuthConfig().catch(console.error);
