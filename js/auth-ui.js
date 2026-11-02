/* ==========================================================================
   EDUTRACE AI - AUTHENTICATION & USER INTERFACE CONTROLLER
   Điều khiển Modal Đăng nhập / Đăng ký / Quên MK / Quản lý Hồ sơ,
   Hiển thị Avatar, Dropdown Navbar, Đánh giá độ mạnh mật khẩu,
   Tự động điền dữ liệu người dùng vào các form liên hệ.
   ========================================================================== */

import {
  initAuthService,
  subscribeAuth,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  updateUserProfile,
  getUserActivities,
  recordUserActivity,
  formatAuthError,
  DEMO_PRESET_ACCOUNTS,
  ROLE_LABELS
} from "./firebase-auth.js";

// Helper for showing toast messages
function notifyToast(message) {
  if (typeof window.showToast === "function") {
    window.showToast(message);
  } else {
    alert(message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
});

export function setupAuthUI() {
  // Elements
  const authModal = document.getElementById("authModal");
  const closeAuthModal = document.getElementById("closeAuthModal");
  const navLoginBtn = document.getElementById("navLoginBtn");
  const navRegisterBtn = document.getElementById("navRegisterBtn");
  const authNavGuest = document.getElementById("authNavGuest");
  const authNavUser = document.getElementById("authNavUser");

  // Mobile elements
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");
  const mobileRegisterBtn = document.getElementById("mobileRegisterBtn");
  const mobileAuthGuest = document.getElementById("mobileAuthGuest");
  const mobileAuthUser = document.getElementById("mobileAuthUser");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  const mobileProfileBtn = document.getElementById("mobileProfileBtn");

  // Tabs
  const authTabLogin = document.getElementById("authTabLogin");
  const authTabRegister = document.getElementById("authTabRegister");
  const authPanelLogin = document.getElementById("authPanelLogin");
  const authPanelRegister = document.getElementById("authPanelRegister");
  const authPanelForgot = document.getElementById("authPanelForgot");

  // Forms
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const formForgot = document.getElementById("formForgot");

  // Profile Modal
  const userProfileModal = document.getElementById("userProfileModal");
  const closeProfileModal = document.getElementById("closeProfileModal");
  const formEditProfile = document.getElementById("formEditProfile");
  const btnOpenUserProfile = document.getElementById("btnOpenUserProfile");
  const btnOpenUserBookings = document.getElementById("btnOpenUserBookings");

  // Dropdown toggle
  const navUserMenuToggle = document.getElementById("navUserMenuToggle");
  const navUserDropdown = document.getElementById("navUserDropdown");
  const btnLogout = document.getElementById("btnLogout");

  // Quick Demo Chips
  const demoChips = document.querySelectorAll(".demo-account-chip");

  // Password Toggles
  setupPasswordToggles();
  setupPasswordStrengthMeter();

  // Switch between Login / Register / Forgot views
  function showAuthView(viewName) {
    if (!authModal) return;

    authModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Clear alerts
    hideAuthAlerts();

    if (viewName === "login") {
      authTabLogin?.classList.add("active");
      authTabRegister?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "block";
      if (authPanelRegister) authPanelRegister.style.display = "none";
      if (authPanelForgot) authPanelForgot.style.display = "none";
    } else if (viewName === "register") {
      authTabLogin?.classList.remove("active");
      authTabRegister?.classList.add("active");
      if (authPanelLogin) authPanelLogin.style.display = "none";
      if (authPanelRegister) authPanelRegister.style.display = "block";
      if (authPanelForgot) authPanelForgot.style.display = "none";
    } else if (viewName === "forgot") {
      authTabLogin?.classList.remove("active");
      authTabRegister?.classList.remove("active");
      if (authPanelLogin) authPanelLogin.style.display = "none";
      if (authPanelRegister) authPanelRegister.style.display = "none";
      if (authPanelForgot) authPanelForgot.style.display = "block";
    }
  }

  function closeAuthDialog() {
    if (authModal) {
      authModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  }

  // Open modal triggers
  navLoginBtn?.addEventListener("click", () => showAuthView("login"));
  navRegisterBtn?.addEventListener("click", () => showAuthView("register"));
  mobileLoginBtn?.addEventListener("click", () => {
    closeMobileNav();
    showAuthView("login");
  });
  mobileRegisterBtn?.addEventListener("click", () => {
    closeMobileNav();
    showAuthView("register");
  });

  closeAuthModal?.addEventListener("click", closeAuthDialog);
  authModal?.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthDialog();
  });

  // Tab switching
  authTabLogin?.addEventListener("click", () => showAuthView("login"));
  authTabRegister?.addEventListener("click", () => showAuthView("register"));

  document.getElementById("btnToForgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("forgot");
  });

  document.getElementById("btnBackToLogin")?.addEventListener("click", (e) => {
    e.preventDefault();
    showAuthView("login");
  });

  // Demo chips click handler
  demoChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const email = chip.dataset.email;
      const emailInput = document.getElementById("loginEmail");
      const passInput = document.getElementById("loginPassword");
      if (emailInput && passInput) {
        emailInput.value = email;
        passInput.value = "EduTrace@2026";
        // Visual feedback
        chip.style.transform = "scale(0.96)";
        setTimeout(() => (chip.style.transform = ""), 150);
      }
    });
  });

  // Handle Login Form Submit
  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value;
    const password = document.getElementById("loginPassword")?.value;
    const submitBtn = document.getElementById("loginSubmitBtn");

    if (!email || !password) {
      showAuthAlert("login", "Vui lòng nhập đầy đủ Email và Mật khẩu.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang xác thực...");
    hideAuthAlerts();

    try {
      const res = await loginWithEmail({ email, password });
      closeAuthDialog();
      formLogin.reset();
      const userName = res.user?.displayName || "bạn";
      notifyToast(`Đăng nhập thành công! Chào mừng ${userName} trở lại.`);
    } catch (err) {
      console.error("Login error:", err);
      showAuthAlert("login", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Handle Register Form Submit
  formRegister?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("regFullName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const phone = document.getElementById("regPhone")?.value.trim();
    const role = document.getElementById("regRole")?.value;
    const password = document.getElementById("regPassword")?.value;
    const confirmPassword = document.getElementById("regConfirmPassword")?.value;
    const agreeTerms = document.getElementById("regAgreeTerms")?.checked;
    const submitBtn = document.getElementById("registerSubmitBtn");

    if (!fullName || !email || !password) {
      showAuthAlert("register", "Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (password.length < 6) {
      showAuthAlert("register", "Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      showAuthAlert("register", "Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (!agreeTerms) {
      showAuthAlert("register", "Vui lòng đồng ý với Cam kết bảo mật thông tin trẻ em.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang khởi tạo tài khoản...");
    hideAuthAlerts();

    try {
      const res = await registerWithEmail({ email, password, fullName, phone, role });
      closeAuthDialog();
      formRegister.reset();
      const roleText = ROLE_LABELS[role] || "Thành viên";
      notifyToast(`Đăng ký thành công! Chào mừng ${fullName} gia nhập mạng lưới EduTrace AI (${roleText}).`);
    } catch (err) {
      console.error("Registration error:", err);
      showAuthAlert("register", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Google Login / Register buttons
  const googleLoginBtn = document.getElementById("btnGoogleLogin");
  const googleRegisterBtn = document.getElementById("btnGoogleRegister");

  async function handleGoogleAuth(btn) {
    setBtnBusy(btn, true, "Đang kết nối Google...");
    hideAuthAlerts();
    try {
      const res = await loginWithGoogle();
      closeAuthDialog();
      notifyToast(`Đăng nhập Google thành công! Xin chào ${res.user?.displayName || "bạn"}.`);
    } catch (err) {
      console.error("Google auth error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        showAuthAlert("login", formatAuthError(err));
        showAuthAlert("register", formatAuthError(err));
      }
    } finally {
      setBtnBusy(btn, false);
    }
  }

  googleLoginBtn?.addEventListener("click", () => handleGoogleAuth(googleLoginBtn));
  googleRegisterBtn?.addEventListener("click", () => handleGoogleAuth(googleRegisterBtn));

  // Forgot Password Submit
  formForgot?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail")?.value;
    const submitBtn = document.getElementById("forgotSubmitBtn");

    if (!email) {
      showAuthAlert("forgot", "Vui lòng nhập email.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang gửi...");
    hideAuthAlerts();

    try {
      await resetPassword(email);
      showAuthSuccess("forgot", `EduTrace AI đã gửi liên kết đặt lại mật khẩu đến email ${email}. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam).`);
      formForgot.reset();
    } catch (err) {
      console.error("Reset password error:", err);
      showAuthAlert("forgot", formatAuthError(err));
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Dropdown toggle for authenticated user
  navUserMenuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navUserDropdown?.classList.toggle("open");
    navUserMenuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (navUserDropdown && !navUserDropdown.contains(e.target) && e.target !== navUserMenuToggle) {
      navUserDropdown.classList.remove("open");
      navUserMenuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  // Logout buttons
  async function performLogout() {
    try {
      await logoutUser();
      navUserDropdown?.classList.remove("open");
      closeMobileNav();
      notifyToast("Đã đăng xuất thành công khỏi hệ thống.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  btnLogout?.addEventListener("click", performLogout);
  mobileLogoutBtn?.addEventListener("click", performLogout);

  // Profile Modal
  btnOpenUserProfile?.addEventListener("click", () => {
    navUserDropdown?.classList.remove("open");
    openProfileModal("profile");
  });

  btnOpenUserBookings?.addEventListener("click", () => {
    navUserDropdown?.classList.remove("open");
    openProfileModal("bookings");
  });

  mobileProfileBtn?.addEventListener("click", () => {
    closeMobileNav();
    openProfileModal("profile");
  });

  closeProfileModal?.addEventListener("click", () => {
    userProfileModal?.classList.remove("active");
    document.body.style.overflow = "auto";
  });

  userProfileModal?.addEventListener("click", (e) => {
    if (e.target === userProfileModal) {
      userProfileModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });

  // Profile tabs switch
  const profileTabInfo = document.getElementById("profileTabInfo");
  const profileTabBookings = document.getElementById("profileTabBookings");
  const profilePanelInfo = document.getElementById("profilePanelInfo");
  const profilePanelBookings = document.getElementById("profilePanelBookings");

  function openProfileModal(tab = "profile") {
    if (!userProfileModal) return;
    userProfileModal.classList.add("active");
    document.body.style.overflow = "hidden";

    if (tab === "profile") {
      profileTabInfo?.classList.add("active");
      profileTabBookings?.classList.remove("active");
      if (profilePanelInfo) profilePanelInfo.style.display = "block";
      if (profilePanelBookings) profilePanelBookings.style.display = "none";
    } else {
      profileTabInfo?.classList.remove("active");
      profileTabBookings?.classList.add("active");
      if (profilePanelInfo) profilePanelInfo.style.display = "none";
      if (profilePanelBookings) profilePanelBookings.style.display = "block";
      renderUserBookingsList();
    }
  }

  profileTabInfo?.addEventListener("click", () => openProfileModal("profile"));
  profileTabBookings?.addEventListener("click", () => openProfileModal("bookings"));

  // Update Profile Form Submit
  formEditProfile?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const displayName = document.getElementById("profileEditName")?.value.trim();
    const phone = document.getElementById("profileEditPhone")?.value.trim();
    const role = document.getElementById("profileEditRole")?.value;
    const submitBtn = document.getElementById("profileSubmitBtn");

    if (!displayName) {
      notifyToast("Họ và tên không được để trống.");
      return;
    }

    setBtnBusy(submitBtn, true, "Đang lưu thay đổi...");
    try {
      await updateUserProfile({ displayName, phone, role });
      notifyToast("Cập nhật thông tin tài khoản thành công!");
      userProfileModal?.classList.remove("active");
      document.body.style.overflow = "auto";
    } catch (err) {
      console.error("Profile update error:", err);
      notifyToast("Không thể cập nhật hồ sơ: " + err.message);
    } finally {
      setBtnBusy(submitBtn, false);
    }
  });

  // Subscribe to Auth State Changes
  subscribeAuth((user) => {
    updateNavbarAuthState(user);
    populateFormsWithUserData(user);
    updateProfileModalData(user);
  });

  // Initialize service
  initAuthService();
}

// Helpers
function closeMobileNav() {
  const menu = document.querySelector(".nav-menu");
  if (menu) menu.classList.remove("open");
}

function setBtnBusy(btn, busy, text = "") {
  if (!btn) return;
  btn.disabled = busy;
  if (busy) {
    btn.dataset.prevText = btn.innerHTML;
    btn.innerHTML = `
      <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      <span>${text}</span>
    `;
  } else if (btn.dataset.prevText) {
    btn.innerHTML = btn.dataset.prevText;
  }
}

function hideAuthAlerts() {
  document.querySelectorAll(".auth-alert").forEach((el) => {
    el.style.display = "none";
    el.textContent = "";
  });
}

function showAuthAlert(section, message) {
  const alertEl = document.getElementById(`${section}ErrorMessage`);
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.style.display = "flex";
  }
}

function showAuthSuccess(section, message) {
  const successEl = document.getElementById(`${section}SuccessMessage`);
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = "flex";
  }
}

// Update Navbar elements when user logs in / logs out
function updateNavbarAuthState(user) {
  const authNavGuest = document.getElementById("authNavGuest");
  const authNavUser = document.getElementById("authNavUser");
  const mobileAuthGuest = document.getElementById("mobileAuthGuest");
  const mobileAuthUser = document.getElementById("mobileAuthUser");

  if (user) {
    // Hide guest buttons, show user pill
    if (authNavGuest) authNavGuest.style.display = "none";
    if (authNavUser) authNavUser.style.display = "flex";
    if (mobileAuthGuest) mobileAuthGuest.style.display = "none";
    if (mobileAuthUser) mobileAuthUser.style.display = "block";

    const displayName = user.displayName || user.email.split("@")[0];
    const initial = displayName.charAt(0).toUpperCase();
    const roleText = user.roleLabel || ROLE_LABELS[user.role] || "Thành viên";

    // Set Navbar pill
    const navAvatar = document.getElementById("navUserAvatar");
    const navName = document.getElementById("navUserName");
    const navRole = document.getElementById("navUserRole");
    if (navAvatar) {
      if (user.photoURL) {
        navAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
      } else {
        navAvatar.textContent = initial;
      }
    }
    if (navName) navName.textContent = displayName;
    if (navRole) navRole.textContent = roleText;

    // Set Dropdown Info
    const dropdownAvatar = document.getElementById("dropdownUserAvatar");
    const dropdownName = document.getElementById("dropdownUserName");
    const dropdownEmail = document.getElementById("dropdownUserEmail");
    const dropdownRole = document.getElementById("dropdownUserRole");

    if (dropdownAvatar) {
      if (user.photoURL) {
        dropdownAvatar.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
      } else {
        dropdownAvatar.textContent = initial;
      }
    }
    if (dropdownName) dropdownName.textContent = displayName;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (dropdownRole) dropdownRole.textContent = roleText;

    // Mobile nav info
    const mobileUserName = document.getElementById("mobileUserName");
    const mobileUserRole = document.getElementById("mobileUserRole");
    if (mobileUserName) mobileUserName.textContent = displayName;
    if (mobileUserRole) mobileUserRole.textContent = roleText;

    // Show admin portal link if role is admin
    const adminLink = document.getElementById("btnAdminPortal");
    const mobileAdminLink = document.getElementById("mobileAdminPortal");
    if (adminLink) {
      adminLink.style.display = user.role === "admin" ? "flex" : "none";
    }
    if (mobileAdminLink) {
      mobileAdminLink.style.display = user.role === "admin" ? "block" : "none";
    }

    // Update activities count badge
    const activities = getUserActivities();
    const countBadge = document.getElementById("userBookingsCount");
    if (countBadge) {
      if (activities.length > 0) {
        countBadge.style.display = "inline-flex";
        countBadge.textContent = activities.length;
      } else {
        countBadge.style.display = "none";
      }
    }
  } else {
    // Show guest buttons, hide user pill
    if (authNavGuest) authNavGuest.style.display = "flex";
    if (authNavUser) authNavUser.style.display = "none";
    if (mobileAuthGuest) mobileAuthGuest.style.display = "flex";
    if (mobileAuthUser) mobileAuthUser.style.display = "none";

    const adminLink = document.getElementById("btnAdminPortal");
    const mobileAdminLink = document.getElementById("mobileAdminPortal");
    if (adminLink) adminLink.style.display = "none";
    if (mobileAdminLink) mobileAdminLink.style.display = "none";
  }
}

// Auto-fill forms across the website when logged in
function populateFormsWithUserData(user) {
  if (!user) return;

  // 1. Consultation Form (B2C / B2B)
  const consultForm = document.getElementById("consultationForm");
  if (consultForm) {
    const nameInput = consultForm.querySelector('[name="fullname"]');
    const phoneInput = consultForm.querySelector('[name="phone"]');
    const emailInput = consultForm.querySelector('[name="email"]');
    const roleSelect = consultForm.querySelector('[name="role"]');

    if (nameInput && !nameInput.value) nameInput.value = user.displayName;
    if (phoneInput && !phoneInput.value && user.phone) phoneInput.value = user.phone;
    if (emailInput && !emailInput.value) emailInput.value = user.email;
    if (roleSelect && user.role) {
      if (["parent", "center", "doctor", "investor"].includes(user.role)) {
        roleSelect.value = user.role;
      }
    }
  }

  // 2. Direct 1-1 Center Booking Form
  const bookingForm = document.getElementById("centerBookingForm");
  if (bookingForm) {
    const parentName = bookingForm.querySelector('[name="parentName"]');
    const parentPhone = bookingForm.querySelector('[name="parentPhone"]');

    if (parentName && !parentName.value) parentName.value = user.displayName;
    if (parentPhone && !parentPhone.value && user.phone) parentPhone.value = user.phone;
  }
}

// Populate User Profile Modal fields
function updateProfileModalData(user) {
  if (!user) return;
  const nameInput = document.getElementById("profileEditName");
  const emailInput = document.getElementById("profileEditEmail");
  const phoneInput = document.getElementById("profileEditPhone");
  const roleSelect = document.getElementById("profileEditRole");
  const avatarBig = document.getElementById("profileAvatarBig");
  const createdAtSpan = document.getElementById("profileCreatedAt");

  const displayName = user.displayName || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  if (nameInput) nameInput.value = displayName;
  if (emailInput) emailInput.value = user.email;
  if (phoneInput) phoneInput.value = user.phone || "";
  if (roleSelect && user.role) roleSelect.value = user.role;
  if (createdAtSpan) createdAtSpan.textContent = user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "Hôm nay";

  if (avatarBig) {
    if (user.photoURL) {
      avatarBig.innerHTML = `<img src="${user.photoURL}" alt="${displayName}">`;
    } else {
      avatarBig.textContent = initial;
    }
  }
}

// Render activities list inside Profile Modal
function renderUserBookingsList() {
  const container = document.getElementById("userActivitiesList");
  if (!container) return;

  const activities = getUserActivities();
  if (activities.length === 0) {
    container.innerHTML = `
      <div class="empty-activity-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>Bạn chưa gửi yêu cầu đặt lịch can thiệp hoặc đăng ký tư vấn nào.</p>
        <a href="#ai-assistant-demo" class="btn btn-sm btn-primary" onclick="document.getElementById('userProfileModal').classList.remove('active');">
          Thử Trợ Lý AI &amp; Đặt Lịch Ngay
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = activities
    .map((act) => {
      const isBooking = act.type === "booking";
      const title = isBooking
        ? `Đặt lịch can thiệp 1-1 tại: ${act.data?.targetCenter || "Trung tâm đối tác"}`
        : `Đăng ký tư vấn chuyên môn EduTrace AI`;
      const schedule = act.data?.preferredSchedule
        ? `Thời gian mong muốn: ${translateSchedule(act.data.preferredSchedule)}`
        : "";
      const phone = act.data?.parentPhone || act.data?.phone || "";

      return `
        <div class="user-activity-item">
          <div class="activity-icon ${isBooking ? "icon-booking" : "icon-lead"}">
            ${
              isBooking
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
            }
          </div>
          <div class="activity-details">
            <div class="activity-title-row">
              <h4>${title}</h4>
              <span class="activity-status-badge status-pending">Đã tiếp nhận</span>
            </div>
            <p class="activity-meta">
              <span>📅 ${act.createdAt}</span>
              ${phone ? `<span>📞 ${phone}</span>` : ""}
              ${schedule ? `<span>⏰ ${schedule}</span>` : ""}
            </p>
          </div>
        </div>
      `;
    })
    .join("");
}

function translateSchedule(val) {
  if (val === "weekend") return "Thứ 7 hoặc Chủ Nhật";
  if (val === "weekday_morning") return "Sáng trong tuần";
  if (val === "weekday_afternoon") return "Chiều trong tuần";
  return val;
}

// Password Eye Toggle
function setupPasswordToggles() {
  const toggles = document.querySelectorAll(".password-toggle-btn");
  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      // Toggle SVG Icon
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    });
  });
}

// Password Strength Meter
function setupPasswordStrengthMeter() {
  const passInput = document.getElementById("regPassword");
  const meterBar = document.getElementById("passwordStrengthBar");
  const meterText = document.getElementById("passwordStrengthText");

  if (!passInput || !meterBar) return;

  passInput.addEventListener("input", () => {
    const val = passInput.value;
    if (!val) {
      meterBar.style.width = "0%";
      meterBar.className = "strength-bar";
      if (meterText) meterText.textContent = "";
      return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
      meterBar.style.width = "25%";
      meterBar.style.backgroundColor = "#ef4444";
      if (meterText) {
        meterText.textContent = "Mật khẩu yếu (Cần thêm ký tự)";
        meterText.style.color = "#ef4444";
      }
    } else if (score === 2) {
      meterBar.style.width = "50%";
      meterBar.style.backgroundColor = "#f59e0b";
      if (meterText) {
        meterText.textContent = "Mật khẩu trung bình";
        meterText.style.color = "#f59e0b";
      }
    } else if (score === 3) {
      meterBar.style.width = "75%";
      meterBar.style.backgroundColor = "#3b82f6";
      if (meterText) {
        meterText.textContent = "Mật khẩu khá an toàn";
        meterText.style.color = "#3b82f6";
      }
    } else {
      meterBar.style.width = "100%";
      meterBar.style.backgroundColor = "#10b981";
      if (meterText) {
        meterText.textContent = "Mật khẩu rất mạnh";
        meterText.style.color = "#10b981";
      }
    }
  });
}
