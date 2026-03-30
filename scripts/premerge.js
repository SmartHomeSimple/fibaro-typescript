#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT_DIR = process.cwd();
const SWAGGER_DIR = path.resolve(ROOT_DIR, 'swagger');
const MERGE_CONFIG_PATH = path.resolve(ROOT_DIR, 'openapi-merge.json');

async function listJsonFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosixRelativePath(fullPath) {
  return path.relative(ROOT_DIR, fullPath).split(path.sep).join('/');
}

function normalizeServerUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return '';
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

function getPrependFromServersUrl(serversUrl, baseServerUrl) {
  const normalizedServer = normalizeServerUrl(serversUrl);
  const normalizedBase = normalizeServerUrl(baseServerUrl);

  if (!normalizedServer || !normalizedBase || normalizedServer === normalizedBase) {
    return '';
  }

  if (normalizedServer.startsWith(`${normalizedBase}/`)) {
    return normalizedServer.slice(normalizedBase.length);
  }

  return '';
}

async function readPrimaryServersUrl(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.servers?.[0]?.url || '';
  } catch {
    return '';
  }
}

async function main() {
  const mergeConfigRaw = await fs.readFile(MERGE_CONFIG_PATH, 'utf8');
  const mergeConfig = JSON.parse(mergeConfigRaw);

  const outputPath = mergeConfig.output
    ? path.resolve(ROOT_DIR, mergeConfig.output)
    : null;

  const jsonFiles = await listJsonFiles(SWAGGER_DIR);

  const filteredFiles = jsonFiles.filter((filePath) => {
    if (outputPath && path.resolve(filePath) === outputPath) {
      return false;
    }

    return true;
  });

  filteredFiles.sort((a, b) => a.localeCompare(b));

  const baseServerUrl = await readPrimaryServersUrl(filteredFiles[0]);

  const inputs = [];

  for (const filePath of filteredFiles) {
    const inputEntry = {
      inputFile: `./${toPosixRelativePath(filePath)}`,
    };

    const serverUrl = await readPrimaryServersUrl(filePath);
    const prepend = getPrependFromServersUrl(serverUrl, baseServerUrl);

    if (prepend) {
      inputEntry.pathModification = {
        prepend,
      };
    }

    inputs.push(inputEntry);
  }

  mergeConfig.inputs = inputs;

  await fs.writeFile(MERGE_CONFIG_PATH, `${JSON.stringify(mergeConfig, null, 2)}\n`, 'utf8');

  console.log(`Updated openapi-merge.json with ${mergeConfig.inputs.length} input files.`);
}

main().catch((error) => {
  console.error('Failed to update openapi-merge.json:', error.message);
  process.exitCode = 1;
});
