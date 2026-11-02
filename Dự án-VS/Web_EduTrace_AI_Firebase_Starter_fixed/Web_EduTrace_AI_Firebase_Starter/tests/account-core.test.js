import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manageAccount } from '../functions/account-core.js';

test('tạo người dùng với hồ sơ; không cho tạo admin qua biểu mẫu', async () => {
  const calls = [];
  const auth = { createUser: async data => { calls.push(data); return { uid: 'new-uid', email: data.email }; } };
  const profiles = { create: async (uid, data) => calls.push({ uid, data }) };
  const caller = { uid: 'admin', token: { admin: true } };
  const data = { action: 'create', email: 'User@example.com', password: '123456', displayName: 'Tên', role: 'parent' };
  assert.equal((await manageAccount({ caller, data, auth, profiles })).profileCreated, true);
  assert.equal(calls[0].email, 'user@example.com');
  assert.equal(calls[1].data.role, 'parent');
  await assert.rejects(manageAccount({ caller, data: { ...data, role: 'admin' }, auth, profiles }), /invalid-argument/);
});

test('tạo hồ sơ thất bại sẽ cố gắng xóa tài khoản vừa tạo', async () => {
  let deleted;
  const auth = { createUser: async () => ({ uid: 'new-uid', email: 'u@example.com' }), deleteUser: async uid => { deleted = uid; } };
  const profiles = { create: async () => { throw new Error('offline'); } };
  const data = { action: 'create', email: 'u@example.com', password: '123456', displayName: 'Tên', role: 'parent' };
  await assert.rejects(manageAccount({ caller: { uid: 'admin', token: { admin: true } }, data, auth, profiles }), /profile-create-failed/);
  assert.equal(deleted, 'new-uid');
});

test('từ chối người không phải admin và thao tác với chính mình', async () => {
  await assert.rejects(manageAccount({ caller: { uid: 'u', token: {} }, data: {} }), /permission-denied/);
  await assert.rejects(manageAccount({ caller: { uid: 'u', token: { admin: true } }, data: { uid: 'u', action: 'delete' } }), /cannot-modify-self/);
});

test('khóa tài khoản Auth, thu hồi token và đồng bộ hồ sơ', async () => {
  const calls = [];
  const auth = { getUser: async () => ({}), updateUser: async (...args) => calls.push(['update', ...args]), revokeRefreshTokens: async uid => calls.push(['revoke', uid]) };
  const profiles = { setStatus: async (...args) => calls.push(['status', ...args]) };
  const result = await manageAccount({ caller: { uid: 'admin', token: { admin: true } }, data: { uid: 'user', action: 'disable' }, auth, profiles });
  assert.deepEqual(calls, [['update', 'user', { disabled: true }], ['revoke', 'user'], ['status', 'user', 'blocked']]);
  assert.deepEqual(result, { action: 'disable', authUpdated: true, profileUpdated: true });
});

test('báo rõ thành công một phần khi xóa Auth nhưng xóa hồ sơ thất bại', async () => {
  const auth = { getUser: async () => ({}), deleteUser: async () => {} };
  const profiles = { delete: async () => { throw new Error('offline'); } };
  const result = await manageAccount({ caller: { uid: 'admin', token: { admin: true } }, data: { uid: 'user', action: 'delete' }, auth, profiles });
  assert.equal(result.authDeleted, true);
  assert.equal(result.profileDeleted, false);
});

test('báo rõ khi đã khóa Auth nhưng thu hồi token thất bại', async () => {
  const auth = { getUser: async () => ({}), updateUser: async () => {}, revokeRefreshTokens: async () => { throw new Error('offline'); } };
  const result = await manageAccount({ caller: { uid: 'admin', token: { admin: true } }, data: { uid: 'user', action: 'disable' }, auth, profiles: {} });
  assert.deepEqual(result, { action: 'disable', authUpdated: true, tokensRevoked: false, profileUpdated: false });
});
