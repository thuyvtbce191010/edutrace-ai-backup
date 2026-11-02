import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

test('cấp admin trên emulator và giữ nguyên claim khác', async () => {
  if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
    throw new Error('Chỉ chạy trên Auth Emulator cục bộ.');
  }
  const app = initializeApp({ projectId: 'demo-edutrace' }, 'grant-test');
  const auth = getAuth(app);
  try {
    await auth.createUser({ uid: 'test-admin', email: 'admin-test@example.invalid' });
    await auth.setCustomUserClaims('test-admin', { existing: 'kept' });
    await promisify(execFile)(process.execPath, ['scripts/grant-admin.js', 'demo-edutrace', 'test-admin'], { env: process.env });
    assert.deepEqual((await auth.getUser('test-admin')).customClaims, { existing: 'kept', admin: true });
  } finally { await deleteApp(app); }
});
