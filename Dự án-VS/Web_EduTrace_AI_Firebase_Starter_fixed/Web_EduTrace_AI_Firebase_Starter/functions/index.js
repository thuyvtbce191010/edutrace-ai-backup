import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { manageAccount } from './account-core.js';
import { defineSecret } from 'firebase-functions/params';
import { generateGemini } from './gemini-core.js';

initializeApp();
export const manageUserAccount = onCall({ region: 'asia-southeast1' }, async request => {
  const db = getFirestore();
  try {
    return await manageAccount({
      caller: request.auth,
      data: request.data,
      auth: getAuth(),
      profiles: {
        create: (uid, data) => db.collection('users').doc(uid).create({ ...data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }),
        delete: uid => db.collection('users').doc(uid).delete(),
        setStatus: (uid, status) => db.collection('users').doc(uid).set({ status, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      }
    });
  } catch (error) {
    if (error.message === 'permission-denied') throw new HttpsError('permission-denied', 'Cần quyền quản trị.');
    if (['invalid-argument', 'cannot-modify-self', 'cannot-modify-admin'].includes(error.message)) {
      throw new HttpsError('invalid-argument', 'Không thể thực hiện thao tác với tài khoản này.');
    }
    console.error('Account operation failed', error.code || error.message);
    throw new HttpsError('internal', 'Không thể cập nhật tài khoản.');
  }
});

const geminiKey = defineSecret('GEMINI_API_KEY');
export const askGemini = onCall({ region: 'asia-southeast1', secrets: [geminiKey], enforceAppCheck: true }, async request => {
  try {
    return await generateGemini({ caller: request.auth, data: request.data, apiKey: geminiKey.value() });
  } catch (error) {
    if (['unauthenticated', 'invalid-argument'].includes(error.message)) {
      throw new HttpsError(error.message, 'Vui lòng đăng nhập và kiểm tra nội dung.');
    }
    console.error('Gemini request failed:', error.message);
    throw new HttpsError('unavailable', 'Trợ lý hiện không khả dụng.');
  }
});
