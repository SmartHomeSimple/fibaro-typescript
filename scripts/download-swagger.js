#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_URL = process.env.FIBARO_SWAGGER_BASE_URL || 'http://192.168.1.35/assets/docs/hc';
const OUTPUT_DIR = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(process.cwd(), 'swagger');

const ENDPOINTS = [
  'alarms/devices',
  'energy',
  'alarms/history',
  'alarms/partitions',
  'events/publishEvent/specificEvents',
  'events/history',
  'fibaro/json',
  'panels/climate',
  'panels/customEvents',
  'panels/family',
  'panels/globalVariables',
  'panels/sprinklers',
  'panels/humidity',
  'panels/location',
  'panels/notifications',
  'service/actions',
  'service/backups',
  'service/update',
  'settings/info',
  'settings/led',
  'settings/location',
  'settings/network',
  'additionalInterfaces',
  'categories',
  'consumption',
  'debugMessages',
  'devices',
  'deviceNotifications',
  'diagnostics',
  'favoriteColors',
  'favoriteColorsV2',
  'firstTimeInitiation',
  'gatewayConnection',
  'home',
  'icons',
  'iosDevices',
  'linkedDevices',
  'loginStatus',
  'networkDiscovery',
  'notificationCenter',
  'panelService',
  'passwordForgotten',
  'profiles',
  'reboot',
  'refreshStates',
  'resetZigbee',
  'RGBPrograms',
  'rooms',
  'scenes',
  'sections',
  'sortOrder',
  'systemStatus',
  'userActivity',
  'users',
  'weather',
  'zwave-associations',
  'installer',
  'ZwaveEngine Api',
  'Update Service Api',
  'Analytics'
];

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
