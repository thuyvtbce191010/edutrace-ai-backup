import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

test('Rules dự thảo: khách, chủ tài khoản và admin có quyền khác nhau', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Chỉ chạy trên Firestore Emulator.');
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  if (host !== '127.0.0.1' && host !== 'localhost') throw new Error('Chỉ được xóa dữ liệu trên emulator cục bộ.');
  const env = await initializeTestEnvironment({ projectId: 'demo-edutrace', firestore: { host, port: Number(port), rules: await readFile('firestore.secure.rules', 'utf8') } });
  try {
    await env.clearFirestore();
    const guest = env.unauthenticatedContext().firestore();
    const owner = env.authenticatedContext('owner', { email: 'owner@example.test' }).firestore();
    const other = env.authenticatedContext('other', { email: 'other@example.test' }).firestore();
    const admin = env.authenticatedContext('admin', { admin: true }).firestore();
    const profile = { uid: 'owner', email: 'owner@example.test', role: 'parent', displayName: 'Owner' };
    await assertSucceeds(setDoc(doc(owner, 'users/owner'), profile));
    await assertFails(setDoc(doc(other, 'users/other'), { uid: 'other', email: 'other@example.test', role: 'admin' }));
    await assertFails(getDoc(doc(other, 'users/owner')));
    await assertSucceeds(updateDoc(doc(owner, 'users/owner'), { displayName: 'New name' }));
    await assertFails(updateDoc(doc(owner, 'users/owner'), { role: 'admin' }));
    await assertFails(updateDoc(doc(owner, 'users/owner'), { status: 'active' }));
    const lead = { name: 'Test', phone: '0901234567', email: 'test@example.test', role: 'parent', createdAt: serverTimestamp(), source: 'edutrace-ai-website' };
    await assertSucceeds(setDoc(doc(guest, 'leads/test'), lead));
    await assertFails(setDoc(doc(guest, 'leads/bad'), { ...lead, role: 'admin' }));
    await assertFails(getDoc(doc(guest, 'leads/test')));
    await assertSucceeds(getDoc(doc(admin, 'leads/test')));
    await assertSucceeds(getDoc(doc(admin, 'users/owner')));
    const booking = { parentName: 'Test', parentPhone: '0901234567', targetCenter: 'Center', preferredSchedule: 'weekend', status: 'pending', createdAt: serverTimestamp(), source: 'edutrace-ai-website' };
    await assertSucceeds(setDoc(doc(guest, 'bookingRequests/test'), booking));
    await assertFails(getDoc(doc(guest, 'bookingRequests/test')));
    await assertFails(updateDoc(doc(owner, 'bookingRequests/test'), { status: 'confirmed' }));
    await assertSucceeds(updateDoc(doc(admin, 'bookingRequests/test'), { status: 'confirmed' }));
  } finally { await env.cleanup(); }
});
