import 'dotenv/config';
import { Buffer } from 'node:buffer';
import { getDevices } from '../src';
import { client } from '../src/client.gen';

const baseUrl = process.env.FIBARO_BASE_URL;
const username = process.env.FIBARO_USERNAME;
const password = process.env.FIBARO_PASSWORD;

if (!username || !password) {
  console.error(
    'Missing FIBARO_USERNAME or FIBARO_PASSWORD environment variable.',
  );
  process.exit(1);
}

client.setConfig({
  baseUrl,
  headers: {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  },
});

async function main() {
  const { data, error, response } = await getDevices();

  if (error) {
    console.error('Request failed:', response.status, error);
    process.exit(1);
  }

  console.log(`Loaded ${Array.isArray(data) ? data.length : 0} devices`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
