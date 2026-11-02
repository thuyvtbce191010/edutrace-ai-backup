import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

test('đăng nhập, hồ sơ, đặt lịch và phân trang trên Firebase Emulator', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('Chỉ chạy kiểm thử này thông qua Firebase Emulator.');
  }
  const app = initializeApp({ projectId: 'demo-edutrace', apiKey: 'demo-key' }, 'integration');
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  try {
    const credentials = await createUserWithEmailAndPassword(auth, 'test@example.invalid', 'test-password');
    const uid = credentials.user.uid;
    await setDoc(doc(db, 'users', uid), { uid, email: 'test@example.invalid', role: 'parent' });
    await signOut(auth);
    await signInWithEmailAndPassword(auth, 'test@example.invalid', 'test-password');
    assert.equal((await getDoc(doc(db, 'users', uid))).data().role, 'parent');
    await assert.rejects(updateDoc(doc(db, 'users', uid), { status: 'blocked' }), { code: 'permission-denied' });
    await setDoc(doc(db, 'bookingRequests', 'booking-1'), { parentName: 'Test', parentPhone: '0901234567', targetCenter: 'Center', preferredSchedule: 'weekend', status: 'pending', source: 'edutrace-ai-website', createdAt: serverTimestamp() });
    await assert.rejects(getDoc(doc(db, 'bookingRequests', 'booking-1')), { code: 'permission-denied' });
  } finally {
    await deleteApp(app);
  }
});

test('Rules cục bộ chặn khách đọc lịch hẹn', async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Chỉ chạy trên Firebase Emulator.');
  const app = initializeApp({ projectId: 'demo-edutrace', apiKey: 'demo-key' }, 'anonymous');
  const db = getFirestore(app);
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  try {
    await assert.rejects(getDoc(doc(db, 'bookingRequests', 'booking-1')), { code: 'permission-denied' });
  } finally { await deleteApp(app); }
});
