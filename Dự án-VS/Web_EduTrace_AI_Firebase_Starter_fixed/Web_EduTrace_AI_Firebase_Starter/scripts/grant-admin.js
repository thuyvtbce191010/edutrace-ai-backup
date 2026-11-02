// Run only from a trusted machine with Google Application Default Credentials.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [projectId, uid] = process.argv.slice(2);
if (!projectId || !uid || !['edutrace-ai', 'demo-edutrace'].includes(projectId)) {
  console.error('Cách dùng: node scripts/grant-admin.js <edutrace-ai|demo-edutrace> <firebase-user-uid>');
  process.exit(1);
}
if (projectId === 'demo-edutrace' && !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Dự án demo chỉ được chạy với Firebase Auth Emulator.');
}
if (projectId === 'edutrace-ai' && process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Không dùng project thật với Firebase Auth Emulator.');
}
const app = initializeApp({ projectId, credential: applicationDefault() });
const auth = getAuth(app);
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true });
console.log(`Đã cấp quyền admin cho UID ${uid} trong ${projectId}. Người dùng cần đăng nhập lại.`);
