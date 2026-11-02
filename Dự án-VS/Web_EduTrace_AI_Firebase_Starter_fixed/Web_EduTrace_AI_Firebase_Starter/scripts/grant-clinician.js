// Run on a trusted machine after verifying the clinician's identity and UID.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [projectId, uid] = process.argv.slice(2);
if (!uid || !['edutrace-ai', 'demo-edutrace'].includes(projectId)) throw new Error('Dùng: node scripts/grant-clinician.js <project> <UID>');
if ((projectId === 'demo-edutrace') !== Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cấu hình emulator không khớp dự án.');
const app = initializeApp({ projectId, credential: applicationDefault() });
const auth = getAuth(app);
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), clinician: true });
console.log('Đã cấp quyền chuyên môn. Người dùng cần đăng nhập lại để nhận quyền.');
