import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/army-14-practical-easy-gate.yml', import.meta.url), 'utf8');

test('Army-14 caller discovers exactly the run-scoped branches for all 14 roles', () => {
  assert.match(workflow, /needs\.practical\.result == 'success'/);
  assert.match(workflow, /roles=\(Architect Builder UI-UX Backend-API Database Security Integration AI-Agent Test-QA Browser-E2E Debug-Repair Deployment-Ops Product-MVP Research-Capability\)/);
  assert.match(workflow, /\[\[ "\$\{#branches\[@\]\}" -ne 14 \]\]/);
  assert.match(workflow, /\.army-14-manifest\.json/);
  assert.match(workflow, /validate-set --run-id/);
  assert.match(workflow, /git merge-base --is-ancestor/);
});

test('Army-14 caller never pushes integration output to main', () => {
  assert.doesNotMatch(workflow, /git push[^\n]*\bmain\b/i);
  assert.match(workflow, /no branch or main ref was pushed/i);
});

