/*
 * EduTrace AI - Firebase Firestore & Authentication integration
 */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";
import { getCurrentUser, recordUserActivity } from "./firebase-auth.js";
import "./auth-ui.js";
import "./gemini-cloud-client.js";
import "./clinical-workspace.js";
import "./center-workspace.js";
import "./investor-workspace.js";
import "./knowledge-cloud.js";

if (firebaseConfigured) {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const centerSelect = document.getElementById('bookingCenterSelect');
  const directoryStatus = document.getElementById('bookingDirectoryStatus');
  if (centerSelect) {
    onSnapshot(query(collection(db, 'centerDirectory'), where('active', '==', true)), snapshot => {
      const previous = centerSelect.value;
      centerSelect.replaceChildren(new Option('Chọn trung tâm đã liên kết', ''));
      snapshot.docs.sort((a,b) => String(a.data().name).localeCompare(String(b.data().name), 'vi')).forEach(item => {
        const name = item.data().name;
        if (typeof name === 'string' && name.trim()) centerSelect.add(new Option(name, item.id));
      });
      if ([...centerSelect.options].some(option => option.value === previous)) centerSelect.value = previous;
      directoryStatus.textContent = snapshot.empty ? 'Chưa có trung tâm được liên kết. Vui lòng liên hệ quản trị viên.' : 'Chọn đúng trung tâm tiếp nhận yêu cầu.';
    }, () => { centerSelect.replaceChildren(new Option('Không tải được danh sách trung tâm', '')); directoryStatus.textContent = 'Không tải được danh sách trung tâm. Vui lòng thử lại.'; });
  }

  function formValue(form, name) {
    return String(new FormData(form).get(name) || "").trim();
  }

  function setBusy(form, busy) {
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = busy;
      button.dataset.originalText ??= button.textContent.trim();
      button.textContent = busy ? "Đang gửi..." : button.dataset.originalText;
    }
  }

  function showSafeToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    let toast = document.getElementById("globalToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "globalToast";
      toast.className = "toast-msg";
      document.body.appendChild(toast);
    }
    toast.replaceChildren();
    const span = document.createElement("span");
    span.textContent = message;
    toast.appendChild(span);
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 4500);
  }

  async function submitToFirestore(form, collectionName, payload, activityType, successMessage) {
    const button = form.querySelector('button[type="submit"]');
    if (button?.disabled) return false;
    setBusy(form, true);
    try {
      const created = await addDoc(collection(db, collectionName), {
        ...payload,
        createdAt: serverTimestamp(),
        source: "edutrace-ai-website"
      });
      try {
        recordUserActivity(activityType, payload, created.id);
      } catch (error) {
        console.warn("Không lưu được lịch sử trên trình duyệt:", error);
      }
      form.reset();
      const user = getCurrentUser();
      if (user && form.id === "consultationForm") {
        form.elements.fullname.value = user.displayName || "";
        form.elements.phone.value = user.phone || "";
        form.elements.email.value = user.email || "";
        if (["parent", "center", "doctor", "investor"].includes(user.role)) form.elements.role.value = user.role;
      }
      showSafeToast(successMessage);
      return true;
    } catch (error) {
      console.error("EduTrace Firebase submission failed:", error.code || error.message);
      showSafeToast(
        error.code === "permission-denied"
          ? "Firebase đã từ chối lưu dữ liệu. Hãy kiểm tra Firestore Security Rules."
          : "Chưa gửi được thông tin. Vui lòng thử lại sau."
      );
      return false;
    } finally {
      setBusy(form, false);
    }
  }

  // Capture phase prevents the demo's localStorage/toast-only handlers from duplicate running.
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "consultationForm") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const payload = {
        name: formValue(form, "fullname"),
        phone: formValue(form, "phone"),
        email: formValue(form, "email"),
        role: formValue(form, "role"),
        notes: formValue(form, "notes")
      };

      void submitToFirestore(
        form,
        "leads",
        payload,
        "consultation",
        "Cảm ơn bạn! Thông tin liên hệ đã được gửi tới EduTrace AI."
      );
    }

    if (form.id === "centerBookingForm") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const selectedCenter = centerSelect?.selectedOptions[0];
      if (!selectedCenter?.value) { showSafeToast('Vui lòng chọn trung tâm đã liên kết.'); return; }
      const payload = {
        parentName: formValue(form, "parentName"),
        parentPhone: formValue(form, "parentPhone"),
        targetCenter: selectedCenter.textContent,
        centerUid: selectedCenter.value,
        preferredSchedule: formValue(form, "preferredSchedule"),
        status: "pending"
      };

      const saved = await submitToFirestore(
        form,
        "bookingRequests",
        payload,
        "booking",
        "Đã gửi yêu cầu đặt lịch hẹn 1-1. Trung tâm sẽ liên hệ xác nhận trong 24h."
      );

      const modal = document.getElementById("centerBookingModal");
      if (saved && modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    }
  }, true);

  console.info("EduTrace AI Firebase integration & Authentication is active.");
} else {
  console.info(
    "EduTrace AI is running in standalone mode. Configure js/firebase-config.js for cloud persistence."
  );
}
