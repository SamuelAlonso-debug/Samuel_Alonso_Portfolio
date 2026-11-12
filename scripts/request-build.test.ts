import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildState, unwrap } from './request-build.ts';

test('buildState waits until the build stops, then reads the outcome', () => {
  assert.equal(buildState({ status: 'queued', build_outcome: null }), 'running');
  assert.equal(buildState({ status: 'running', build_outcome: null }), 'running');
  assert.equal(buildState({ status: 'stopped', build_outcome: 'success' }), 'success');
  assert.equal(buildState({ status: 'stopped', build_outcome: 'fail' }), 'failed');
  assert.equal(buildState({ status: 'stopped', build_outcome: 'cancelled' }), 'failed');
});

test('unwrap returns the result or names the cause', () => {
  assert.deepEqual(unwrap(200, { success: true, result: { id: 1 } }), { id: 1 });
  assert.throws(() => unwrap(403, { success: false }), /CLOUDFLARE_BUILDS_TOKEN/);
  assert.throws(
    () => unwrap(404, { success: false, errors: [{ code: 12000, message: 'Not found' }] }),
    /Not found/,
  );
  assert.throws(() => unwrap(502, {}), /HTTP 502/);
});
