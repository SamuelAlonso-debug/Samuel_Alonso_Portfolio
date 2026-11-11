import assert from 'node:assert/strict';
import { test } from 'node:test';
import { countLines, hasJustification, verdict } from './pr-size.ts';

test('countLines sums additions and deletions, skipping lockfiles and binaries', () => {
  const numstat = ['10\t5\tsrc/a.ts', '900\t100\tpnpm-lock.yaml', '-\t-\tlogo.png', ''].join('\n');
  assert.equal(countLines(numstat), 15);
});

test('hasJustification needs non-empty text under the heading', () => {
  assert.equal(hasJustification('## Size justification\nGenerated config.\n## Testing\n'), true);
  assert.equal(hasJustification('## Size justification\n<!-- why -->\n\n## Testing\n'), false);
  assert.equal(hasJustification('## Description\nNothing.'), false);
});

test('verdict applies the 550/660 thresholds', () => {
  const justified = '## Size justification\nOne atomic migration.';
  assert.equal(verdict(550, '').ok, true);
  assert.equal(verdict(551, '').ok, false);
  assert.equal(verdict(660, justified).ok, true);
  assert.equal(verdict(661, justified).ok, false);
});
