/*
 * EduTrace AI - Firebase Firestore & Authentication integration
 */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";
import { recordUserActivity } from "./firebase-auth.js";
import "./auth-ui.js";

if (firebaseConfigured) {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

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

  async function submitToFirestore(form, collectionName, buildPayload, successMessage) {
    setBusy(form, true);
    try {
      const payload = buildPayload();
      await addDoc(collection(db, collectionName), {
        ...payload,
        createdAt: serverTimestamp(),
        source: "edutrace-ai-website"
      });
      form.reset();
      showSafeToast(successMessage);
    } catch (error) {
      console.error("EduTrace Firebase submission failed:", error.code || error.message);
      showSafeToast(
        error.code === "permission-denied"
          ? "Firebase đã từ chối lưu dữ liệu. Hãy kiểm tra Firestore Security Rules."
          : "Chưa gửi được thông tin. Vui lòng thử lại sau."
      );
    } finally {
      setBusy(form, false);
    }
  }

  // Capture phase prevents the demo's localStorage/toast-only handlers from duplicate running.
  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "consultationForm") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const payload = {
        name: formValue(form, "fullname"),
        phone: formValue(form, "phone"),
        email: formValue(form, "email"),
        role: formValue(form, "role")
      };

      recordUserActivity("consultation", payload);

      void submitToFirestore(
        form,
        "leads",
        () => payload,
        "Cảm ơn bạn! Thông tin liên hệ đã được gửi tới EduTrace AI."
      );
    }

    if (form.id === "centerBookingForm") {
      event.preventDefault();
      event.stopImmediatePropagation();

      const payload = {
        parentName: formValue(form, "parentName"),
        parentPhone: formValue(form, "parentPhone"),
        targetCenter: formValue(form, "targetCenter"),
        preferredSchedule: formValue(form, "preferredSchedule"),
        status: "pending"
      };

      recordUserActivity("booking", payload);

      void submitToFirestore(
        form,
        "bookingRequests",
        () => payload,
        "Đã gửi yêu cầu đặt lịch hẹn 1-1. Trung tâm sẽ liên hệ xác nhận trong 24h."
      );

      const modal = document.getElementById("centerBookingModal");
      if (modal) {
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
