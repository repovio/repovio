import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releasedPackages } from './released-packages.mjs';

/** Website-only release metadata never selects application images. */
test('website release is independent', /** Verify website release is independent. */ () => {
  assert.deepEqual(releasedPackages([{ name: '@repovio/website', version: '0.2.0' }]), { app: false, website: true });
});
/** App-only and mixed releases select precisely their own deployable images. */
test('application and combined releases select the right images', /** Verify application and combined releases select the right images. */ () => {
  assert.deepEqual(releasedPackages([{ name: 'repovio', version: '2.0.1' }]), { app: true, website: false });
  assert.deepEqual(releasedPackages([{ name: 'repovio' }, { name: '@repovio/website' }]), { app: true, website: true });
  assert.deepEqual(releasedPackages([]), { app: false, website: false });
});
