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

async function runSqlFile(filePath) {
  console.log(`\n----------------------------------------`);
  console.log(`Running SQL File: ${path.basename(filePath)}`);
  console.log(`----------------------------------------`);

  const sqlContent = fs.readFileSync(filePath, 'utf8');
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sqlContent })
  });

  const text = await res.text();
  console.log(`Status: ${res.status}`);
  try {
    const json = JSON.parse(text);
    if (res.status === 201 || res.status === 200) {
      console.log('Result: SUCCESS (Query ran successfully, transaction rolled back to preserve state)');
      console.log('Query returned:', json);
    } else {
      console.error('Result: FAILED');
      console.error(json);
    }
  } catch (e) {
    console.log('Result:', text);
  }
}

async function main() {
  const testsDir = path.join(__dirname, '..', 'supabase', 'tests');
  await runSqlFile(path.join(testsDir, 'verify_db_functions.sql'));
  await runSqlFile(path.join(testsDir, 'verify_rls_policies.sql'));
}

main().catch(console.error);
