import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp as initClient, deleteApp as deleteClient } from 'firebase/app';
import { getAuth as getClientAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as initAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

test('Functions: chặn người thường, admin tạo, khóa và xóa tài khoản', async () => {
  for (const name of ['FIREBASE_AUTH_EMULATOR_HOST', 'FIRESTORE_EMULATOR_HOST', 'FUNCTIONS_EMULATOR_HOST']) {
    if (!/^127\.0\.0\.1:\d+$/.test(process.env[name] || '')) throw new Error(`${name} phải trỏ về emulator cục bộ`);
  }
  const client = initClient({ projectId: 'demo-edutrace', apiKey: 'demo-key' }, 'functions-client');
  const admin = initAdmin({ projectId: 'demo-edutrace' }, 'functions-admin');
  const auth = getClientAuth(client);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  const functions = getFunctions(client, 'asia-southeast1');
  const [host, port] = process.env.FUNCTIONS_EMULATOR_HOST.split(':');
  connectFunctionsEmulator(functions, host, Number(port));
  try {
    const caller = (await createUserWithEmailAndPassword(auth, 'manager@example.invalid', 'password-123')).user;
    const manage = httpsCallable(functions, 'manageUserAccount');
    const data = { action: 'create', email: 'new@example.invalid', password: 'password-123', displayName: 'New User', role: 'parent' };
    await assert.rejects(manage(data), { code: 'functions/permission-denied' });
    await getAdminAuth(admin).setCustomUserClaims(caller.uid, { admin: true });
    await caller.getIdToken(true);
    const created = (await manage(data)).data;
    assert.equal(created.profileCreated, true);
    const disabled = (await manage({ action: 'disable', uid: created.uid })).data;
    assert.equal(disabled.authUpdated, true);
    assert.equal((await getAdminAuth(admin).getUser(created.uid)).disabled, true);
    const enabled = (await manage({ action: 'enable', uid: created.uid })).data;
    assert.equal(enabled.profileUpdated, true);
    assert.equal((await getAdminAuth(admin).getUser(created.uid)).disabled, false);
    await assert.rejects(manage({ action: 'delete', uid: caller.uid }), { code: 'functions/invalid-argument' });
    const deleted = (await manage({ action: 'delete', uid: created.uid })).data;
    assert.equal(deleted.authDeleted, true);
    assert.equal(deleted.profileDeleted, true);
  } finally { await deleteClient(client); await deleteAdmin(admin); }
});
