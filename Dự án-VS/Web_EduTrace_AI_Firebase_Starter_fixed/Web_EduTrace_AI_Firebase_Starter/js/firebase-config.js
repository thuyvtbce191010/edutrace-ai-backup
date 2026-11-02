// Firebase Web configuration
export const firebaseConfig = {
  apiKey: "AIzaSyABzmGU4vM0vy299GakURBlAnMNkcZj8WI",
  authDomain: "edutrace-ai.firebaseapp.com",
  projectId: "edutrace-ai",
  appId: "1:1003458534172:web:d939a2fd6844a7a53378d9"
};

export const firebaseConfigured =
  firebaseConfig.apiKey !== "REPLACE_WITH_FIREBASE_WEB_API_KEY" &&
  firebaseConfig.authDomain !== "REPLACE_WITH_PROJECT_ID.firebaseapp.com" &&
  firebaseConfig.projectId !== "REPLACE_WITH_PROJECT_ID" &&
  firebaseConfig.appId !== "REPLACE_WITH_FIREBASE_APP_ID";

// Bật sau khi triển khai và kiểm thử Cloud Functions trên dự án này.
export const accountFunctionsEnabled = false;
// Cấu hình App Check và triển khai askGemini trước khi bật.
export const geminiCloudEnabled = false;
export const appCheckSiteKey = '';
// Điền tên bucket sau khi Firebase Storage đã được cấu hình.
export const knowledgeStorageBucket = '';
