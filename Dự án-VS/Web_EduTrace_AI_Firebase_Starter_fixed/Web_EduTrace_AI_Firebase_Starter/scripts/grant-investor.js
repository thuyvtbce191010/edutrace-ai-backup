import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const [projectId, uid] = process.argv.slice(2);
if (!uid || !['edutrace-ai', 'demo-edutrace'].includes(projectId)) throw new Error('Dùng: node scripts/grant-investor.js <project> <UID>');
if ((projectId === 'demo-edutrace') !== Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cấu hình emulator không khớp dự án.');
const auth = getAuth(initializeApp({ projectId, credential: applicationDefault() }));
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), investor: true });
console.log('Đã cấp quyền xem báo cáo. Người dùng cần đăng nhập lại.');
