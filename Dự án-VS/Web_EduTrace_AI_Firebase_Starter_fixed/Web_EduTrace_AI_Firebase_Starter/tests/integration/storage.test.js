import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

test('Storage: chỉ admin tải PDF lên, công khai đọc, từ chối ghi đè', async () => {
  const address = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '';
  if (!/^127\.0\.0\.1:\d+$/.test(address)) throw new Error('Chỉ chạy trên Storage Emulator cục bộ');
  const [host, port] = address.split(':');
  const env = await initializeTestEnvironment({ projectId: 'demo-edutrace', storage: { host, port: Number(port), rules: await readFile('storage.rules', 'utf8') } });
  try {
    const guest = env.unauthenticatedContext().storage();
    const admin = env.authenticatedContext('admin', { admin: true }).storage();
    const other = env.authenticatedContext('other').storage();
    const data = new TextEncoder().encode('%PDF-1.4 test');
    const metadata = { contentType: 'application/pdf' };
    await assertFails(uploadBytes(ref(other, 'knowledge-pdf/doc.pdf'), data, metadata));
    await assertSucceeds(uploadBytes(ref(admin, 'knowledge-pdf/doc.pdf'), data, metadata));
    await assertSucceeds(getBytes(ref(guest, 'knowledge-pdf/doc.pdf')));
    await assertFails(uploadBytes(ref(admin, 'knowledge-pdf/doc.pdf'), data, metadata));
    await assertFails(uploadBytes(ref(admin, 'knowledge-pdf/bad.pdf'), data, { contentType: 'text/plain' }));
    await assertFails(deleteObject(ref(other, 'knowledge-pdf/doc.pdf')));
    await assertSucceeds(deleteObject(ref(admin, 'knowledge-pdf/doc.pdf')));
  } finally { await env.cleanup(); }
});
