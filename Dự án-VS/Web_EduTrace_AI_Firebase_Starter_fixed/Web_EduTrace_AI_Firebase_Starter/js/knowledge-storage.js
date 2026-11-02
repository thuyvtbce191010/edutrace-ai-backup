import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js';
import { knowledgeStorageBucket } from './firebase-config.js';

export function knowledgeStorageAvailable() { return Boolean(knowledgeStorageBucket); }
export async function uploadKnowledgePdf(file) {
  if (!knowledgeStorageAvailable()) throw new Error('Chưa cấu hình kho Firebase Storage.');
  if (!file || file.size <= 0 || file.size > 8 * 1024 * 1024 || !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) throw new Error('Vui lòng chọn PDF tối đa 8 MB.');
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...bytes) !== '%PDF-') throw new Error('Tệp không phải PDF hợp lệ.');
  const fileRef = ref(getStorage(getApp(), `gs://${knowledgeStorageBucket}`), `knowledge-pdf/${crypto.randomUUID()}.pdf`);
  let uploaded = false;
  try {
    await uploadBytes(fileRef, file, { contentType: 'application/pdf' }); uploaded = true;
    return { name: file.name, description: file.name, url: await getDownloadURL(fileRef), ref: fileRef };
  } catch (error) {
    if (uploaded) await deleteObject(fileRef).catch(() => {});
    throw error;
  }
}
export async function discardKnowledgePdf(fileRef) { await deleteObject(fileRef); }
