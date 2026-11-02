// Chỉ liên kết sau khi đã xác minh UID và tên cơ sở với chủ dự án.
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [projectId, uid, ...parts] = process.argv.slice(2);
const name = parts.join(' ').trim();
if (!['edutrace-ai', 'demo-edutrace'].includes(projectId) || !/^[A-Za-z0-9_-]{1,128}$/.test(uid || '') || !name || name.length > 200) throw new Error('Dùng: node scripts/link-center-directory.js <project> <UID> "Tên trung tâm đã xác minh"');
if ((projectId === 'demo-edutrace') !== Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)) throw new Error('Cấu hình emulator không khớp dự án.');
const app=initializeApp({projectId,credential:applicationDefault()}), user=await getAuth(app).getUser(uid);
if (user.disabled || user.customClaims?.center !== true) throw new Error('Tài khoản chưa có quyền trung tâm hoặc đã bị khóa.');
await getFirestore(app).collection('centerDirectory').doc(uid).create({name,active:true});
console.log('Đã liên kết trung tâm. Mục có sẵn sẽ không bị ghi đè.');
