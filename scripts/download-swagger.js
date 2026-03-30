#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_URL = process.env.FIBARO_SWAGGER_BASE_URL || 'http://192.168.1.35/assets/docs';
const OUTPUT_DIR = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(process.cwd(), 'swagger');

const ENDPOINTS = [
  'hc/alarms/devices',
  'hc/energy',
  'hc/alarms/history',
  'hc/alarms/partitions',
  'hc/events/publishEvent/specificEvents',
  'hc/events/history',
  'hc/fibaro/json',
  'hc/panels/climate',
  'hc/panels/customEvents',
  'hc/panels/family',
  'hc/panels/globalVariables',
  'hc/panels/sprinklers',
  'hc/panels/humidity',
  'hc/panels/location',
  'hc/panels/notifications',
  'hc/service/actions',
  'hc/service/backups',
  'hc/service/update',
  'hc/settings/info',
  'hc/settings/led',
  'hc/settings/location',
  'hc/settings/network',
  'hc/additionalInterfaces',
  'hc/categories',
  'hc/consumption',
  'hc/debugMessages',
  'hc/devices',
  'hc/deviceNotifications',
  'hc/diagnostics',
  'hc/favoriteColors',
  'hc/favoriteColorsV2',
  'hc/fti',
  'hc/gatewayConnection',
  'hc/home',
  'hc/icons',
  'hc/iosDevices',
  'hc/linkedDevices',
  'hc/loginStatus',
  'hc/networkDiscovery',
  'hc/notificationCenter',
  'hc/panelService',
  'hc/passwordForgotten',
  'hc/profiles',
  'hc/reboot',
  'hc/refreshStates',
  'hc/resetZigbee',
  'hc/RGBPrograms',
  'hc/rooms',
  'hc/scenes',
  'hc/sections',
  'hc/sortOrder',
  'hc/systemStatus',
  'hc/userActivity',
  'hc/users',
  'hc/weather',
  'hc/apps/zwave-associations',
  'hc/installer/installer',
  'zwave3/api',
  'hc/analytics'
];

// FIXME Currently not supported.
const yml_endpoints = [
    'update-service/api',
]

function endpointToUrl(endpoint) {
  return `${BASE_URL}/${encodeURI(endpoint)}.json`;
}

function endpointToFilePath(endpoint) {
  const parts = endpoint.split('/');
  const fileName = `${parts[parts.length - 1]}.json`;
  const folders = parts.slice(0, -1);

  return path.join(OUTPUT_DIR, ...folders, fileName);
}

async function downloadEndpoint(endpoint) {
  const url = endpointToUrl(endpoint);
  const filePath = endpointToFilePath(endpoint);
  const directory = path.dirname(filePath);

  await fs.mkdir(directory, { recursive: true });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  try {
    JSON.parse(text);
  } catch (error) {
    throw new Error(`Downloaded content is not valid JSON (${error.message})`);
  }

  await fs.writeFile(filePath, text, 'utf8');

  return { endpoint, filePath, bytes: Buffer.byteLength(text, 'utf8') };
}

async function main() {
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Downloading ${ENDPOINTS.length} swagger files...`);

  const failed = [];

  for (const endpoint of ENDPOINTS) {
    try {
      const result = await downloadEndpoint(endpoint);
      console.log(`✓ ${result.endpoint} -> ${result.filePath} (${result.bytes} bytes)`);
    } catch (error) {
      failed.push({ endpoint, error });
      console.error(`✗ ${endpoint}: ${error.message}`);
    }
  }

  if (failed.length > 0) {
    console.error(`\nCompleted with ${failed.length} failed download(s).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll swagger files downloaded successfully.');
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exitCode = 1;
});
