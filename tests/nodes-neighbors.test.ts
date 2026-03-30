import 'dotenv/config';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';

import { client } from '../src/client.gen';
import { getZwaveNodes, getZwaveNodesByNodeIdNeighbors } from '../src';

const baseUrl = process.env.FIBARO_BASE_URL ?? 'http://192.168.1.35/api';
const username = process.env.FIBARO_USERNAME;
const password = process.env.FIBARO_PASSWORD;
const configuredNodeId = process.env.FIBARO_NODE_ID
  ? Number.parseInt(process.env.FIBARO_NODE_ID, 10)
  : undefined;

type ApiResult<TData, TError = unknown> = {
  data?: TData;
  error?: TError;
  response: Response;
};

function setupClient() {
  if (!username || !password) {
    throw new Error(
      'Missing FIBARO_USERNAME or FIBARO_PASSWORD environment variable.',
    );
  }

  client.setConfig({
    baseUrl,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  });
}

function formatApiError<TData, TError>(
  operation: string,
  result: ApiResult<TData, TError>,
  details?: Record<string, unknown>,
): string {
  const payload = {
    operation,
    baseUrl,
    requestUrl: result.response?.url,
    status: result.response?.status,
    statusText: result.response?.statusText,
    error: result.error,
    details,
  };

  return `API request failed:\n${JSON.stringify(payload, null, 2)}`;
}

function assertApiSuccess<TData, TError>(
  operation: string,
  result: ApiResult<TData, TError>,
  details?: Record<string, unknown>,
): asserts result is ApiResult<TData, TError> & { data: TData } {
  if (result.error || !result.response?.ok || result.data === undefined) {
    throw new Error(formatApiError(operation, result, details));
  }
}

setupClient();

test('getNodes returns nodes list', async () => {
  const result = await getZwaveNodes();
  assertApiSuccess('getNodes', result);

  assert.ok(
    Array.isArray(result.data.items),
    'getNodes response.items should be an array',
  );
  console.log(`[test] getNodes returned ${result.data.items.length} node(s)`);
});

test('getNodesByNodeIdNeighbors returns neighbors for selected node', async () => {
  const nodesResult = await getZwaveNodes();
  assertApiSuccess('getNodes (for neighbors precheck)', nodesResult);

  const nodeId = Number.isInteger(configuredNodeId)
    ? configuredNodeId
    : nodesResult.data.items?.[0]?.nodeId;

  assert.ok(
    Number.isInteger(nodeId),
    'No usable node ID found. Set FIBARO_NODE_ID or ensure /nodes returns at least one node.',
  );

  const neighborsResult = await getZwaveNodesByNodeIdNeighbors({
    path: { node_id: nodeId as number },
  });

  assertApiSuccess('getNodesByNodeIdNeighbors', neighborsResult, {
    nodeId,
  });

  assert.ok(
    Array.isArray(neighborsResult.data.items),
    'neighbors response.items should be an array',
  );

  console.log(
    `[test] getNodesByNodeIdNeighbors returned ${neighborsResult.data.items.length} neighbor(s) for node ${nodeId as number}`,
  );
});
