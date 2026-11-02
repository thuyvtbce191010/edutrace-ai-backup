import { getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { accountFunctionsEnabled } from './firebase-config.js';

export { accountFunctionsEnabled };
export async function manageUserAccount(data) {
  if (!accountFunctionsEnabled) throw new Error('Chức năng quản lý tài khoản chưa được triển khai.');
  const call = httpsCallable(getFunctions(getApp(), 'asia-southeast1'), 'manageUserAccount');
  return (await call(data)).data;
}
