import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JS_LIMIT, overBudget } from './budgets.ts';

test('overBudget passes under and at the limit, fails over it naming page and overage', () => {
  assert.equal(overBudget('/', 'JavaScript', JS_LIMIT - 1, JS_LIMIT), null);
  assert.equal(overBudget('/', 'JavaScript', JS_LIMIT, JS_LIMIT), null);
  assert.equal(
    overBudget('/en/', 'JavaScript', JS_LIMIT + 512, JS_LIMIT),
    '/en/: JavaScript is 20.5 KB, 0.5 KB over the 20.0 KB budget.',
  );
});
