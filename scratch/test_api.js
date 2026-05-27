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
console.log('Token exists:', !!token);

async function testQuery() {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT 1 as val;'
    })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

testQuery().catch(console.error);
