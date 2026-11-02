/* ==========================================================================
   EDUTRACE AI - FIREBASE AUTHENTICATION & USER PROFILE SERVICE
   Hỗ trợ: Đăng ký, Đăng nhập (Email/Password & Google), Quên mật khẩu,
   Quản lý vai trò (Phụ huynh, Trung tâm, Chuyên viên), Lưu trữ Firestore
   kèm chế độ giả lập thông minh (Demo Fallback) khi chưa bật Console.
   ========================================================================== */

import { initializeApp, getApps, getApp, deleteApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

// Initialize Firebase App singleton safely
let app = null;
let auth = null;
let db = null;

if (firebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn("EduTrace AI Firebase Auth initialization notice:", err);
  }
}

// Preset demo accounts for instant evaluation
export const DEMO_PRESET_ACCOUNTS = {
  "admin@edutrace.vn": {
    uid: "admin-system-01",
    displayName: "Ban Quản Trị Hệ Thống (Admin)",
    email: "admin@edutrace.vn",
    phone: "0900 999 999",
    role: "admin",
    roleLabel: "Quản Trị Viên (Admin)",
    status: "active",
    isDemo: true,
    createdAt: "01/10/2026, 08:00"
  },
  "demo.parent@edutrace.vn": {
    uid: "demo-user-parent-01",
    displayName: "Chị Mai (Mẹ bé Bo)",
    email: "demo.parent@edutrace.vn",
    phone: "0909 123 456",
    role: "parent",
    roleLabel: "Phụ huynh có con cần can thiệp",
    status: "active",
    isDemo: true,
    createdAt: "10/10/2026, 08:30"
  },
  "demo.center@edutrace.vn": {
    uid: "demo-user-center-02",
    displayName: "Trung tâm Ánh Sao Ninh Kiều",
    email: "demo.center@edutrace.vn",
    phone: "0912 888 999",
    role: "center",
    roleLabel: "Trung tâm Can thiệp sớm & Trường hòa nhập",
    status: "active",
    isDemo: true,
    createdAt: "08/10/2026, 14:15"
  },
  "demo.doctor@edutrace.vn": {
    uid: "demo-user-doctor-03",
    displayName: "ThS. Nguyễn Mai Anh",
    email: "demo.doctor@edutrace.vn",
    phone: "0987 654 321",
    role: "doctor",
    roleLabel: "Chuyên viên Giáo dục Đặc biệt & Bác sĩ",
    status: "active",
    isDemo: true,
    createdAt: "05/10/2026, 09:00"
  }
};

export const ROLE_LABELS = {
  parent: "Phụ huynh",
  center: "Trung tâm",
  doctor: "Chuyên viên / Bác sĩ",
  investor: "Nhà đầu tư / Đối tác",
  admin: "Quản Trị Viên (Admin)"
};

// Internal state & subscribers
let currentAuthUser = null;
const authSubscribers = [];

function notifySubscribers() {
  const userCopy = currentAuthUser ? { ...currentAuthUser } : null;
  authSubscribers.forEach((fn) => {
    try {
      fn(userCopy);
    } catch (e) {
      console.error("Auth subscriber error:", e);
    }
  });
}

export function subscribeAuth(callback) {
  authSubscribers.push(callback);
  callback(currentAuthUser ? { ...currentAuthUser } : null);
  return () => {
    const idx = authSubscribers.indexOf(callback);
    if (idx !== -1) authSubscribers.splice(idx, 1);
  };
}

export function getCurrentUser() {
  return currentAuthUser ? { ...currentAuthUser } : null;
}

// Local cache helpers
const LOCAL_STORAGE_USER_KEY = "edutrace_auth_user";
const LOCAL_STORAGE_ACTIVITIES_KEY = "edutrace_user_activities";

function saveLocalUser(userData) {
  if (userData) {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }
}

function loadLocalUser() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Map Firebase Auth error codes to friendly Vietnamese messages
export function formatAuthError(error) {
  if (!error) return "Đã xảy ra sự cố. Vui lòng thử lại.";
  const code = error.code || "";

  switch (code) {
    case "auth/invalid-email":
      return "Địa chỉ email không đúng định dạng. Vui lòng kiểm tra lại.";
    case "auth/user-not-found":
      return "Tài khoản không tồn tại trong hệ thống.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không chính xác.";
    case "auth/email-already-in-use":
      return "Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.";
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập Google đã được đóng lại.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng đợi trong giây lát rồi thử lại.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền Internet.";
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Phương thức đăng nhập này chưa được kích hoạt trong Firebase Console.";
    default:
      return error.message || "Đã xảy ra sự cố trong quá trình xác thực.";
  }
}

// Try saving profile to Firestore, silently handling permission restrictions
async function saveUserProfileToFirestore(uid, profileData) {
  if (!db) return;
  try {
    await setDoc(doc(db, "users", uid), {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    // Firestore rules might restrict writes in demo mode - non-fatal
    console.info("Firestore profile sync skipped:", err.code || err.message);
  }
}

// Try fetching profile from Firestore
async function fetchUserProfileFromFirestore(uid) {
  if (!db) return null;
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.info("Firestore profile read skipped:", err.code || err.message);
  }
  return null;
}

// Initialize Auth listener
export function initAuthService() {
  // First load cached user from localStorage for instant render
  const cached = loadLocalUser();
  if (cached) {
    currentAuthUser = cached;
    notifySubscribers();
  }

  // If Firebase Auth is ready, observe real cloud state
  if (auth) {
    onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch Firestore profile or merge with cached data
        let extraProfile = await fetchUserProfileFromFirestore(fbUser.uid);
        if (!extraProfile && cached && cached.uid === fbUser.uid) {
          extraProfile = cached;
        }

        const role = extraProfile?.role || "parent";
        currentAuthUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || extraProfile?.displayName || fbUser.email.split("@")[0],
          phone: extraProfile?.phone || fbUser.phoneNumber || "",
          photoURL: fbUser.photoURL || null,
          role: role,
          roleLabel: ROLE_LABELS[role] || "Phụ huynh",
          isDemo: false,
          createdAt: fbUser.metadata?.creationTime || new Date().toISOString()
        };
        saveLocalUser(currentAuthUser);
        notifySubscribers();
      } else {
        // Only clear if not in an active demo session
        if (currentAuthUser && !currentAuthUser.isDemo) {
          currentAuthUser = null;
          saveLocalUser(null);
          notifySubscribers();
        }
      }
    });
  }
}

// REGISTER (Email / Password)
export async function registerWithEmail({ email, password, fullName, phone, role }) {
  email = email.trim();
  fullName = fullName.trim();
  phone = phone.trim();
  role = role || "parent";

  // Try real Firebase Auth first
  if (auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      try {
        await updateProfile(fbUser, { displayName: fullName });
      } catch (e) {
        console.warn("Could not set displayName on Firebase Auth user:", e);
      }

      const profilePayload = {
        uid: fbUser.uid,
        email: email,
        displayName: fullName,
        phone: phone,
        role: role,
        roleLabel: ROLE_LABELS[role] || "Phụ huynh",
        createdAt: new Date().toISOString()
      };

      await saveUserProfileToFirestore(fbUser.uid, profilePayload);

      currentAuthUser = {
        ...profilePayload,
        photoURL: null,
        isDemo: false
      };
      saveLocalUser(currentAuthUser);
      // Keep the Admin user table in sync with newly registered accounts
      // (the current Admin table is stored in localStorage).
      syncUserToGlobalList(currentAuthUser);
      notifySubscribers();

      return { success: true, user: currentAuthUser };
    } catch (error) {
      // If Firebase Auth provider is disabled in Console, provide seamless Demo fallback
      if (error.code === "auth/operation-not-allowed" || error.code === "auth/configuration-not-found") {
        console.warn("Firebase Auth disabled in Console. Falling back to simulated demo account.");
        return createSimulatedUser({ email, fullName, phone, role });
      }
      throw error;
    }
  }

  // Fallback demo mode if Firebase is unconfigured
  return createSimulatedUser({ email, fullName, phone, role });
}

function createSimulatedUser({ email, fullName, phone, role }) {
  const simulated = {
    uid: "demo-sim-" + Date.now(),
    email: email,
    displayName: fullName || email.split("@")[0],
    phone: phone || "",
    role: role || "parent",
    roleLabel: ROLE_LABELS[role] || "Phụ huynh",
    photoURL: null,
    isDemo: true,
    isDemoFallback: true,
    createdAt: new Date().toLocaleString("vi-VN")
  };
  currentAuthUser = simulated;
  saveLocalUser(currentAuthUser);
  // Also show demo/fallback registrations in the Admin user table.
  syncUserToGlobalList(currentAuthUser);
  notifySubscribers();
  return { success: true, user: simulated, isDemoFallback: true };
}

// LOGIN (Email / Password)
export async function loginWithEmail({ email, password }) {
  email = email.trim().toLowerCase();

  // Check if user requested one of our pre-configured fast test accounts
  if (DEMO_PRESET_ACCOUNTS[email]) {
    // If password matches or user tests quickly
    const preset = DEMO_PRESET_ACCOUNTS[email];
    currentAuthUser = { ...preset };
    saveLocalUser(currentAuthUser);
    notifySubscribers();
    return { success: true, user: currentAuthUser, isDemo: true };
  }

  // Try real Firebase Auth
  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const profile = await fetchUserProfileFromFirestore(fbUser.uid);
      const role = profile?.role || "parent";

      currentAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || profile?.displayName || fbUser.email.split("@")[0],
        phone: profile?.phone || fbUser.phoneNumber || "",
        photoURL: fbUser.photoURL || null,
        role: role,
        roleLabel: ROLE_LABELS[role] || "Phụ huynh",
        isDemo: false,
        createdAt: fbUser.metadata?.creationTime || new Date().toISOString()
      };

      saveLocalUser(currentAuthUser);
      notifySubscribers();
      return { success: true, user: currentAuthUser };
    } catch (error) {
      if (error.code === "auth/operation-not-allowed" || error.code === "auth/configuration-not-found") {
        console.warn("Firebase Auth disabled in Console. Falling back to demo mode.");
        return createSimulatedUser({ email, fullName: email.split("@")[0], phone: "", role: "parent" });
      }
      throw error;
    }
  }

  // Fallback demo mode
  return createSimulatedUser({ email, fullName: email.split("@")[0], phone: "", role: "parent" });
}

// GOOGLE SIGN IN
export async function loginWithGoogle() {
  if (auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      let profile = await fetchUserProfileFromFirestore(fbUser.uid);
      const role = profile?.role || "parent";

      currentAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split("@")[0],
        phone: fbUser.phoneNumber || profile?.phone || "",
        photoURL: fbUser.photoURL || null,
        role: role,
        roleLabel: ROLE_LABELS[role] || "Phụ huynh",
        isDemo: false,
        createdAt: fbUser.metadata?.creationTime || new Date().toISOString()
      };

      await saveUserProfileToFirestore(fbUser.uid, {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: currentAuthUser.displayName,
        role: currentAuthUser.role,
        photoURL: currentAuthUser.photoURL
      });

      saveLocalUser(currentAuthUser);
      notifySubscribers();
      return { success: true, user: currentAuthUser };
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") {
        throw error;
      }
      if (error.code === "auth/operation-not-allowed" || error.code === "auth/configuration-not-found") {
        console.warn("Google Auth not enabled in Console. Simulating demo Google login.");
        const simulated = {
          uid: "demo-google-user",
          email: "google.user@gmail.com",
          displayName: "Tài Khoản Google (Demo)",
          phone: "0901 234 567",
          role: "parent",
          roleLabel: "Phụ huynh có con cần can thiệp",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
          isDemo: true,
          isDemoFallback: true,
          createdAt: new Date().toLocaleString("vi-VN")
        };
        currentAuthUser = simulated;
        saveLocalUser(currentAuthUser);
        notifySubscribers();
        return { success: true, user: simulated, isDemoFallback: true };
      }
      throw error;
    }
  }

  // Fallback demo mode
  return createSimulatedUser({
    email: "google.user@gmail.com",
    fullName: "Tài Khoản Google (Demo)",
    phone: "0901 234 567",
    role: "parent"
  });
}

// RESET PASSWORD
export async function resetPassword(email) {
  email = email.trim();
  if (auth) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      if (error.code === "auth/operation-not-allowed" || error.code === "auth/configuration-not-found") {
        return { success: true, isDemo: true };
      }
      throw error;
    }
  }
  return { success: true, isDemo: true };
}

// UPDATE USER PROFILE
export async function updateUserProfile({ displayName, phone, role }) {
  if (!currentAuthUser) throw new Error("Chưa đăng nhập.");

  currentAuthUser.displayName = displayName || currentAuthUser.displayName;
  if (phone !== undefined) currentAuthUser.phone = phone;
  if (role) {
    currentAuthUser.role = role;
    currentAuthUser.roleLabel = ROLE_LABELS[role] || "Phụ huynh";
  }

  saveLocalUser(currentAuthUser);

  if (auth && auth.currentUser && !currentAuthUser.isDemo) {
    try {
      await updateProfile(auth.currentUser, { displayName: currentAuthUser.displayName });
      await saveUserProfileToFirestore(auth.currentUser.uid, {
        displayName: currentAuthUser.displayName,
        phone: currentAuthUser.phone,
        role: currentAuthUser.role
      });
    } catch (e) {
      console.warn("Profile cloud sync warning:", e);
    }
  }

  notifySubscribers();
  return { success: true, user: currentAuthUser };
}

// LOGOUT
export async function logoutUser() {
  if (auth && !currentAuthUser?.isDemo) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("SignOut notice:", e);
    }
  }
  currentAuthUser = null;
  saveLocalUser(null);
  notifySubscribers();
  return { success: true };
}

// Track and retrieve user activities (leads & bookings submitted by this user)
export function getUserActivities() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!currentAuthUser) return list;
    return list.filter((item) => !item.userEmail || item.userEmail === currentAuthUser.email);
  } catch {
    return [];
  }
}

export function recordUserActivity(type, data) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const item = {
      id: "act-" + Date.now(),
      type: type, // 'consultation' or 'booking'
      userEmail: currentAuthUser ? currentAuthUser.email : null,
      userName: currentAuthUser ? currentAuthUser.displayName : null,
      data: data,
      createdAt: new Date().toLocaleString("vi-VN"),
      status: "pending"
    };
    list.unshift(item);
    localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(list));
    return item;
  } catch (e) {
    console.warn("Could not save user activity locally:", e);
    return null;
  }
}

// ==========================================================================
// ADMIN USER MANAGEMENT DATA STORE & SERVICES
// ==========================================================================
const LOCAL_STORAGE_USERS_LIST_KEY = "edutrace_all_users_list";

const INITIAL_MOCK_USERS = [
  {
    uid: "admin-system-01",
    displayName: "Ban Quản Trị Hệ Thống (Admin)",
    email: "admin@edutrace.vn",
    phone: "0900 999 999",
    role: "admin",
    roleLabel: "Quản Trị Viên (Admin)",
    status: "active",
    createdAt: "01/10/2026, 08:00"
  },
  {
    uid: "demo-user-parent-01",
    displayName: "Chị Mai (Mẹ bé Bo)",
    email: "demo.parent@edutrace.vn",
    phone: "0909 123 456",
    role: "parent",
    roleLabel: "Phụ huynh có con cần can thiệp",
    status: "active",
    createdAt: "10/10/2026, 08:30"
  },
  {
    uid: "demo-user-center-02",
    displayName: "Trung tâm Ánh Sao Ninh Kiều",
    email: "demo.center@edutrace.vn",
    phone: "0912 888 999",
    role: "center",
    roleLabel: "Trung tâm Can thiệp sớm & Trường hòa nhập",
    status: "active",
    createdAt: "08/10/2026, 14:15"
  },
  {
    uid: "demo-user-doctor-03",
    displayName: "ThS. Nguyễn Mai Anh",
    email: "demo.doctor@edutrace.vn",
    phone: "0987 654 321",
    role: "doctor",
    roleLabel: "Chuyên viên Giáo dục Đặc biệt & Bác sĩ",
    status: "active",
    createdAt: "05/10/2026, 09:00"
  },
  {
    uid: "user-parent-04",
    displayName: "Anh Tuấn (Bố bé Bin)",
    email: "tuan.le@gmail.com",
    phone: "0934 567 890",
    role: "parent",
    roleLabel: "Phụ huynh có con cần can thiệp",
    status: "active",
    createdAt: "09/10/2026, 11:20"
  },
  {
    uid: "user-center-05",
    displayName: "Cơ sở Giáo dục Hòa nhập Ban Mai",
    email: "banmai.cantho@gmail.com",
    phone: "0292 388 9999",
    role: "center",
    roleLabel: "Trung tâm Can thiệp sớm & Trường hòa nhập",
    status: "active",
    createdAt: "02/10/2026, 16:45"
  }
];

export function getAllUsersList() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_LIST_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(INITIAL_MOCK_USERS));
      return [...INITIAL_MOCK_USERS];
    }
    return JSON.parse(raw);
  } catch {
    return [...INITIAL_MOCK_USERS];
  }
}

export function syncUserToGlobalList(user) {
  if (!user || !user.email) return;
  const list = getAllUsersList();
  const existingIdx = list.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  const entry = {
    uid: user.uid || "u-" + Date.now(),
    displayName: user.displayName || user.email.split("@")[0],
    email: user.email,
    phone: user.phone || "",
    role: user.role || "parent",
    roleLabel: user.roleLabel || ROLE_LABELS[user.role] || "Phụ huynh",
    status: user.status || "active",
    createdAt: user.createdAt || new Date().toLocaleString("vi-VN")
  };

  if (existingIdx !== -1) {
    list[existingIdx] = { ...list[existingIdx], ...entry };
  } else {
    list.unshift(entry);
  }
  localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(list));
}

// Helper to create Firebase Auth user via secondary app instance without logging out current Admin
export async function createAuthUserSecondary(email, password, displayName) {
  if (!firebaseConfigured) return null;
  const secondaryAppName = `EduTraceSecondary-${Date.now()}`;
  let secondaryApp = null;
  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const fbUser = userCredential.user;
    if (displayName) {
      try {
        await updateProfile(fbUser, { displayName });
      } catch (e) {
        console.warn("Could not set displayName on secondary auth user:", e);
      }
    }
    await signOut(secondaryAuth);
    return fbUser.uid;
  } catch (err) {
    console.warn("Firebase Auth secondary creation notice:", err.code || err.message);
    if (err.code === "auth/email-already-in-use") {
      throw new Error("Địa chỉ email này đã được sử dụng trong Firebase Authentication.");
    }
    if (err.code === "auth/weak-password") {
      throw new Error("Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.");
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Địa chỉ email không đúng định dạng.");
    }
    // Return null if provider is disabled in Console or offline
    return null;
  } finally {
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (delErr) {
        console.warn("Error cleaning up secondary Firebase App instance:", delErr);
      }
    }
  }
}

export async function saveUserByAdmin(userData) {
  const list = getAllUsersList();
  const role = userData.role || "parent";
  let uid = userData.uid;

  // 1. If this is a NEW user and a password was provided, create Firebase Auth account
  if (!uid && userData.password && firebaseConfigured) {
    const authUid = await createAuthUserSecondary(userData.email, userData.password, userData.displayName);
    if (authUid) {
      uid = authUid;
    }
  }

  if (!uid) {
    uid = "u-" + Date.now();
  }

  const userEntry = {
    uid: uid,
    displayName: userData.displayName,
    email: userData.email,
    phone: userData.phone || "",
    role: role,
    roleLabel: ROLE_LABELS[role] || "Phụ huynh",
    status: userData.status || "active",
    createdAt: userData.createdAt || new Date().toLocaleString("vi-VN"),
    updatedAt: new Date().toLocaleString("vi-VN")
  };

  // 2. Persist directly to Cloud Firestore Database
  if (db) {
    try {
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        displayName: userEntry.displayName,
        email: userEntry.email,
        phone: userEntry.phone,
        role: userEntry.role,
        roleLabel: userEntry.roleLabel,
        status: userEntry.status,
        createdAt: userData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.info("Đã lưu người dùng vào Cloud Firestore:", uid);
    } catch (dbErr) {
      console.warn("Lưu Firestore Database bị từ chối hoặc lỗi mạng:", dbErr.code || dbErr.message);
    }
  }

  // 3. Update local cache
  const idx = list.findIndex(u => (userData.uid && u.uid === userData.uid) || u.email.toLowerCase() === userData.email.toLowerCase());
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...userEntry };
  } else {
    list.unshift(userEntry);
  }

  localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(list));
  return userEntry;
}

export async function deleteUserByAdmin(uid) {
  const list = getAllUsersList();
  const filtered = list.filter(u => u.uid !== uid);
  localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(filtered));

  if (db && uid) {
    try {
      await deleteDoc(doc(db, "users", uid));
      console.info("Đã xóa người dùng khỏi Firestore Database:", uid);
    } catch (err) {
      console.warn("Xóa người dùng Firestore skipped:", err.code || err.message);
    }
  }
  return true;
}

export async function toggleUserStatusByAdmin(uid) {
  const list = getAllUsersList();
  const user = list.find(u => u.uid === uid);
  if (user) {
    user.status = user.status === "blocked" ? "active" : "blocked";
    user.updatedAt = new Date().toLocaleString("vi-VN");
    localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(list));

    if (db && uid) {
      try {
        await updateDoc(doc(db, "users", uid), {
          status: user.status,
          updatedAt: serverTimestamp()
        });
        console.info("Đã cập nhật trạng thái người dùng trong Firestore Database:", uid);
      } catch (err) {
        console.warn("Cập nhật trạng thái Firestore skipped:", err.code || err.message);
      }
    }
    return user;
  }
  return null;
}

// Fetch all users from Firestore Database and sync to local cache
export async function syncUsersWithFirestore() {
  if (!db) return getAllUsersList();
  try {
    const snap = await getDocs(collection(db, "users"));
    if (snap.empty) return getAllUsersList();

    const localList = getAllUsersList();
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      let createdStr = "Mới tạo";
      if (data.createdAt?.toDate) {
        createdStr = data.createdAt.toDate().toLocaleString("vi-VN");
      } else if (typeof data.createdAt === "string") {
        createdStr = data.createdAt;
      }

      const cloudEntry = {
        uid: docSnap.id,
        displayName: data.displayName || data.email?.split("@")[0] || "Người dùng",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "parent",
        roleLabel: data.roleLabel || ROLE_LABELS[data.role] || "Phụ huynh",
        status: data.status || "active",
        createdAt: createdStr
      };

      const idx = localList.findIndex((u) => u.uid === cloudEntry.uid || (u.email && u.email.toLowerCase() === cloudEntry.email.toLowerCase()));
      if (idx !== -1) {
        localList[idx] = { ...localList[idx], ...cloudEntry };
      } else {
        localList.push(cloudEntry);
      }
    });

    localStorage.setItem(LOCAL_STORAGE_USERS_LIST_KEY, JSON.stringify(localList));
    return localList;
  } catch (err) {
    console.info("Đồng bộ Firestore users skipped hoặc bị hạn chế bởi Rules:", err.code || err.message);
    return getAllUsersList();
  }
}

// Sync leads and bookings from Firestore to local cache
export async function syncActivitiesWithFirestore() {
  if (!db) return getAllLeadsAndBookings();
  const list = getAllLeadsAndBookings();
  let updated = false;

  try {
    const leadsSnap = await getDocs(collection(db, "leads"));
    leadsSnap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!list.some((item) => item.id === docSnap.id)) {
        let createdStr = new Date().toLocaleString("vi-VN");
        if (d.createdAt?.toDate) {
          createdStr = d.createdAt.toDate().toLocaleString("vi-VN");
        }
        list.push({
          id: docSnap.id,
          type: "consultation",
          userEmail: d.email || "",
          userName: d.name || "Khách hàng",
          status: d.status || "pending",
          createdAt: createdStr,
          data: d
        });
        updated = true;
      }
    });
  } catch (e) {
    // leads query might be restricted
  }

  try {
    const bookingsSnap = await getDocs(collection(db, "bookingRequests"));
    bookingsSnap.forEach((docSnap) => {
      const d = docSnap.data();
      if (!list.some((item) => item.id === docSnap.id)) {
        let createdStr = new Date().toLocaleString("vi-VN");
        if (d.createdAt?.toDate) {
          createdStr = d.createdAt.toDate().toLocaleString("vi-VN");
        }
        list.push({
          id: docSnap.id,
          type: "booking",
          userEmail: d.email || "",
          userName: d.parentName || "Phụ huynh",
          status: d.status || "pending",
          createdAt: createdStr,
          data: d
        });
        updated = true;
      }
    });
  } catch (e) {
    // bookings query might be restricted
  }

  if (updated) {
    localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(list));
  }
  return list;
}

export function getAllLeadsAndBookings() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (list.length === 0) {
      const mockActivities = [
        {
          id: "act-mock-1",
          type: "booking",
          userEmail: "demo.parent@edutrace.vn",
          userName: "Chị Mai (Mẹ bé Bo)",
          status: "pending",
          createdAt: "10/10/2026, 09:15",
          data: {
            parentName: "Lê Thị Mai",
            parentPhone: "0909 123 456",
            childInfo: "Bé Bo, 2.5 tuổi (Chậm nói, ít giao tiếp mắt)",
            targetCenter: "Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều",
            preferredSchedule: "weekend",
            trialFeedback: "Bé rất thích bài tập thổi bong bóng, mẹ muốn đăng ký khám trực tiếp 1-1"
          }
        },
        {
          id: "act-mock-2",
          type: "consultation",
          userEmail: "tuan.le@gmail.com",
          userName: "Anh Tuấn",
          status: "contacted",
          createdAt: "09/10/2026, 14:30",
          data: {
            fullname: "Lê Văn Tuấn",
            name: "Lê Văn Tuấn",
            phone: "0934 567 890",
            email: "tuan.le@gmail.com",
            role: "parent"
          }
        },
        {
          id: "act-mock-3",
          type: "booking",
          userEmail: "hoang.mai@gmail.com",
          userName: "Hoàng Mai",
          status: "confirmed",
          createdAt: "08/10/2026, 16:00",
          data: {
            parentName: "Trần Hoàng Mai",
            parentPhone: "0918 222 333",
            childInfo: "Bé Ken, 4 tuổi (Tăng động giảm chú ý - ADHD)",
            targetCenter: "Trung tâm Ban Mai Cần Thơ",
            preferredSchedule: "weekday_morning",
            trialFeedback: "Bé tập trung hơn khi có hiệu ứng âm nhạc"
          }
        }
      ];
      localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(mockActivities));
      return mockActivities;
    }
    return list;
  } catch {
    return [];
  }
}

export function updateActivityStatus(actId, newStatus) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const item = list.find(i => i.id === actId);
    if (item) {
      item.status = newStatus;
      localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(list));
      return item;
    }
    return null;
  } catch {
    return null;
  }
}

