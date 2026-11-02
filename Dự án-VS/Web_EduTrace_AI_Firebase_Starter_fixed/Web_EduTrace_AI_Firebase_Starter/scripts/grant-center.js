// Chỉ cấp quyền sau khi xác minh chủ tài khoản là đại diện trung tâm.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const [projectId, uid] = process.argv.slice(2);
if (!uid || !['edutrace-ai', 'demo-edutrace'].includes(projectId)) throw new Error('Dùng: node scripts/grant-center.js <project> <UID>');
if ((projectId === 'demo-edutrace') !== Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cấu hình emulator không khớp dự án.');
const auth = getAuth(initializeApp({ projectId, credential: applicationDefault() }));
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), center: true });
console.log('Đã cấp quyền trung tâm. Người dùng cần đăng nhập lại.');
