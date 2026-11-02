import { test } from 'node:test';
import assert from 'node:assert/strict';

test('hosting chỉ phục vụ ứng dụng, không công khai mã máy chủ và cấu hình', async () => {
  if (process.env.FIREBASE_HOSTING_EMULATOR_HOST !== '127.0.0.1:15000') {
    throw new Error('Chỉ kiểm thử hosting emulator cục bộ.');
  }
  const base = 'http://127.0.0.1:15000';
  for (const path of ['/index.html', '/admin.html', '/js/firebase-auth.js']) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  for (const path of ['/functions/index.js', '/scripts/grant-admin.js', '/firestore.rules', '/package.json', '/.gitignore']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
});
