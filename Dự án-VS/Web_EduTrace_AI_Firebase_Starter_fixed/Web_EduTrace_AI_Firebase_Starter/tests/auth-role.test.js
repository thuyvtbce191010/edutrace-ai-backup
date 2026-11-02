import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRole } from '../js/auth-role.js';

test('quyền admin chỉ được lấy từ custom claim', () => {
  assert.equal(resolveRole('admin'), 'parent');
  assert.equal(resolveRole('doctor', { admin: true }), 'admin');
  assert.equal(resolveRole('doctor', { admin: 'true' }), 'doctor');
  assert.equal(resolveRole('unknown'), 'parent');
  assert.equal(resolveRole('investor'), 'center');
});
