import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js';
import { firebaseConfig, geminiCloudEnabled, appCheckSiteKey } from './firebase-config.js';

if (geminiCloudEnabled) {
  let callable = null;
  if (appCheckSiteKey) {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
    callable = httpsCallable(getFunctions(app, 'asia-southeast1'), 'askGemini');
  }
  window.edutraceGeminiCloud = {
    available: Boolean(callable),
    async generate(messages, mode = 'chat') {
      if (!callable) throw new Error('App Check chưa được cấu hình.');
      return (await callable({ messages, mode })).data.text;
    }
  };
  window.geminiService?.dispatchStatusChange();
}
