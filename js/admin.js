/* ==========================================================================
   EDUTRACE AI - ADMIN CONTROLLER
   Xử lý kiểm tra quyền Admin, Quản lý danh sách Người dùng,
   Cập nhật vai trò, Khóa/Mở tài khoản, Xuất file CSV,
   Quản lý các lượt đặt lịch và đơn tư vấn từ phụ huynh.
   ========================================================================== */

import {
  initAuthService,
  subscribeAuth,
  loginWithEmail,
  logoutUser,
  getAllUsersList,
  saveUserByAdmin,
  deleteUserByAdmin,
  toggleUserStatusByAdmin,
  syncUsersWithFirestore,
  syncActivitiesWithFirestore,
  getAllLeadsAndBookings,
  updateActivityStatus,
  ROLE_LABELS
} from "./firebase-auth.js";

// Helper for toast notifications
function showToast(message) {
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
  window.setTimeout(() => toast.classList.remove("show"), 4000);
}

document.addEventListener("DOMContentLoaded", () => {
  setupAdminApp();
});

function setupAdminApp() {
  // Elements
  const guardSection = document.getElementById("adminGuardSection");
  const workspace = document.getElementById("adminWorkspace");
  const guardForm = document.getElementById("guardLoginForm");
  const guardError = document.getElementById("guardErrorMessage");
  const btnQuickAdminLogin = document.getElementById("btnQuickAdminLogin");
  const btnAdminLogout = document.getElementById("btnAdminLogout");

  const headerUserPill = document.getElementById("adminHeaderUserPill");
  const headerAvatar = document.getElementById("adminHeaderAvatar");
  const headerName = document.getElementById("adminHeaderName");

  // Tab Sidebar Elements
  const navItems = document.querySelectorAll(".admin-nav-item");
  const tabPanels = {
    tabUsers: document.getElementById("panelTabUsers"),
    tabBookings: document.getElementById("panelTabBookings"),
    tabSystem: document.getElementById("panelTabSystem"),
    tabAIKnowledge: document.getElementById("panelTabAIKnowledge")
  };

  // User Management Elements
  const userTableBody = document.getElementById("userTableBody");
  const userSearchInput = document.getElementById("userSearchInput");
  const userRoleFilter = document.getElementById("userRoleFilter");
  const userStatusFilter = document.getElementById("userStatusFilter");
  const btnOpenAddUserModal = document.getElementById("btnOpenAddUserModal");
  const btnExportUsersCSV = document.getElementById("btnExportUsersCSV");

  // Modal User Form Elements
  const modalBackdrop = document.getElementById("modalUserFormBackdrop");
  const btnCloseModal = document.getElementById("btnCloseUserModal");
  const btnCancelModal = document.getElementById("btnCancelUserModal");
  const formUserSave = document.getElementById("formUserSave");
  const modalTitle = document.getElementById("modalUserFormTitle");

  const editUid = document.getElementById("editUserUid");
  const editFullName = document.getElementById("editUserFullName");
  const editEmail = document.getElementById("editUserEmail");
  const editPhone = document.getElementById("editUserPhone");
  const editPassword = document.getElementById("editUserPassword");
  const btnToggleEditPassword = document.getElementById("btnToggleEditPassword");
  const lblUserPassword = document.getElementById("lblUserPassword");
  const hintUserPassword = document.getElementById("hintUserPassword");
  const btnSubmitUserModal = document.getElementById("btnSubmitUserModal");
  const editRole = document.getElementById("editUserRole");
  const editStatus = document.getElementById("editUserStatus");

  // Bookings Elements
  const bookingsTableBody = document.getElementById("bookingsTableBody");
  const bookingTypeFilter = document.getElementById("bookingTypeFilter");
  const bookingStatusFilter = document.getElementById("bookingStatusFilter");

  let currentAdminUser = null;

  // 1. AUTH STATE & ACCESS GUARD
  subscribeAuth((user) => {
    currentAdminUser = user;
    if (user && user.role === "admin") {
      // Authenticated as Admin
      guardSection.style.display = "none";
      workspace.classList.add("active");
      if (headerUserPill) headerUserPill.style.display = "flex";
      if (headerName) headerName.textContent = user.displayName || "Admin";
      if (headerAvatar) headerAvatar.textContent = (user.displayName || "A").charAt(0).toUpperCase();

      renderDashboard();
    } else {
      // Not logged in or not admin
      guardSection.style.display = "flex";
      workspace.classList.remove("active");
      if (headerUserPill) headerUserPill.style.display = "none";
    }
  });

  // Guard Login Form
  guardForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("guardEmail")?.value.trim();
    const password = document.getElementById("guardPassword")?.value;
    const submitBtn = document.getElementById("guardLoginBtn");

    if (!email || !password) return;

    if (guardError) guardError.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Đang xác thực quyền Admin...";

    try {
      const res = await loginWithEmail({ email, password });
      if (res.user && res.user.role !== "admin") {
        if (guardError) {
          guardError.textContent = "Tài khoản của bạn không có quyền Quản trị viên (Admin).";
          guardError.style.display = "flex";
        }
        await logoutUser();
      } else {
        showToast("Đăng nhập quyền Quản trị viên thành công!");
      }
    } catch (err) {
      if (guardError) {
        guardError.textContent = err.message || "Email hoặc mật khẩu không chính xác.";
        guardError.style.display = "flex";
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Đăng Nhập Quản Trị";
    }
  });

  // 1-Click Fast Admin Demo Login
  btnQuickAdminLogin?.addEventListener("click", async () => {
    try {
      btnQuickAdminLogin.disabled = true;
      btnQuickAdminLogin.textContent = "Đang đăng nhập Admin...";
      await loginWithEmail({ email: "admin@edutrace.vn", password: "EduTrace@2026" });
      showToast("Đã kích hoạt phiên làm việc Quản trị viên mẫu (admin@edutrace.vn)!");
    } catch (err) {
      console.error("Quick admin login error:", err);
    } finally {
      btnQuickAdminLogin.disabled = false;
      btnQuickAdminLogin.textContent = "🔑 Đăng nhập ngay với quyền Admin mẫu";
    }
  });

  // Admin Logout
  btnAdminLogout?.addEventListener("click", async () => {
    await logoutUser();
    showToast("Đã đăng xuất khỏi cổng Quản trị viên.");
  });

  // 2. SIDEBAR TAB NAVIGATION
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetTab = item.dataset.tab;
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      Object.keys(tabPanels).forEach((key) => {
        if (tabPanels[key]) {
          tabPanels[key].style.display = key === targetTab ? "block" : "none";
        }
      });
    });
  });

  // 3. RENDER DASHBOARD & USER DATA
  function renderDashboard() {
    renderUsersTable();
    renderBookingsTable();

    // Đồng bộ người dùng và dữ liệu từ Cloud Firestore Database trong nền
    syncUsersWithFirestore().then(() => {
      renderUsersTable();
    }).catch((e) => console.info("Đồng bộ Firestore users:", e));

    syncActivitiesWithFirestore().then(() => {
      renderBookingsTable();
    }).catch((e) => console.info("Đồng bộ Firestore activities:", e));
  }

  // Render Users Table with search and filters
  function renderUsersTable() {
    if (!userTableBody) return;

    const allUsers = getAllUsersList();
    const query = (userSearchInput?.value || "").toLowerCase().trim();
    const roleFilter = userRoleFilter?.value || "all";
    const statusFilter = userStatusFilter?.value || "all";

    // Update KPI stats
    updateStatsCards(allUsers);

    // Filter list
    const filtered = allUsers.filter((u) => {
      const matchesSearch =
        !query ||
        (u.displayName && u.displayName.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || (u.status || "active") === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });

    const userCountBadge = document.getElementById("userCountBadge");
    if (userCountBadge) userCountBadge.textContent = filtered.length;

    if (filtered.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-table-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <p>Không tìm thấy người dùng nào phù hợp với bộ lọc.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    userTableBody.innerHTML = filtered
      .map((u) => {
        const isBlocked = u.status === "blocked";
        const roleLabel = ROLE_LABELS[u.role] || u.roleLabel || "Thành viên";
        const initial = (u.displayName || u.email).charAt(0).toUpperCase();

        return `
          <tr data-uid="${u.uid}">
            <td>
              <div class="user-cell">
                <div class="user-cell-avatar">${initial}</div>
                <div class="user-cell-info">
                  <strong>${u.displayName || "Chưa đặt tên"}</strong>
                  <span>${u.email}</span>
                </div>
              </div>
            </td>
            <td>
              <strong>${u.phone || "Chưa có SĐT"}</strong>
            </td>
            <td>
              <span class="badge-role ${u.role || "parent"}">
                ${roleLabel}
              </span>
            </td>
            <td>
              <span style="font-size: 0.8rem; color: #64748b;">${u.createdAt || "Mới tạo"}</span>
            </td>
            <td>
              <span class="badge-status ${isBlocked ? "blocked" : "active"}">
                ${isBlocked ? "Tạm khóa" : "Hoạt động"}
              </span>
            </td>
            <td style="text-align: right;">
              <div class="action-btn-group" style="justify-content: flex-end;">
                <button type="button" class="btn-icon btn-edit-user" data-uid="${u.uid}" title="Sửa thông tin">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
                <button type="button" class="btn-icon btn-toggle-status" data-uid="${u.uid}" title="${isBlocked ? "Mở khóa tài khoản" : "Tạm khóa tài khoản"}">
                  ${
                    isBlocked
                      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`
                      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
                  }
                </button>
                <button type="button" class="btn-icon danger btn-delete-user" data-uid="${u.uid}" title="Xóa tài khoản">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    attachUserTableEvents();
  }

  function updateStatsCards(users) {
    const total = users.length;
    const parents = users.filter((u) => u.role === "parent").length;
    const centers = users.filter((u) => u.role === "center").length;
    const doctors = users.filter((u) => u.role === "doctor").length;

    const elTotal = document.getElementById("statTotalUsers");
    const elParents = document.getElementById("statTotalParents");
    const elCenters = document.getElementById("statTotalCenters");
    const elDoctors = document.getElementById("statTotalDoctors");

    if (elTotal) elTotal.textContent = total;
    if (elParents) elParents.textContent = parents;
    if (elCenters) elCenters.textContent = centers;
    if (elDoctors) elDoctors.textContent = doctors;
  }

  // Attach click events on action buttons inside table
  function attachUserTableEvents() {
    // Edit User
    document.querySelectorAll(".btn-edit-user").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.dataset.uid;
        openUserModalForEdit(uid);
      });
    });

    // Toggle Status
    document.querySelectorAll(".btn-toggle-status").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.dataset.uid;
        const updated = toggleUserStatusByAdmin(uid);
        if (updated) {
          const statusText = updated.status === "blocked" ? "đã tạm khóa" : "đã kích hoạt lại";
          showToast(`Tài khoản ${updated.displayName} ${statusText}.`);
          renderUsersTable();
        }
      });
    });

    // Delete User
    document.querySelectorAll(".btn-delete-user").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.dataset.uid;
        const allUsers = getAllUsersList();
        const user = allUsers.find((u) => u.uid === uid);
        if (user && user.role === "admin") {
          showToast("Không thể xóa tài khoản Quản trị viên chính.");
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user?.displayName || uid}" khỏi hệ thống?`)) {
          deleteUserByAdmin(uid);
          showToast("Đã xóa người dùng thành công.");
          renderUsersTable();
        }
      });
    });
  }

  // Filter & Search events
  userSearchInput?.addEventListener("input", renderUsersTable);
  userRoleFilter?.addEventListener("change", renderUsersTable);
  userStatusFilter?.addEventListener("change", renderUsersTable);

  // 4. USER MODAL (ADD & EDIT)
  function openUserModalForAdd() {
    if (!modalBackdrop) return;
    modalTitle.textContent = "Thêm Người Dùng Mới";
    editUid.value = "";
    editFullName.value = "";
    editEmail.value = "";
    editEmail.readOnly = false;
    editPhone.value = "";
    editRole.value = "parent";
    editStatus.value = "active";
    modalBackdrop.classList.add("active");
  }

  function openUserModalForEdit(uid) {
    if (!modalBackdrop) return;
    const allUsers = getAllUsersList();
    const user = allUsers.find((u) => u.uid === uid);
    if (!user) return;

    modalTitle.textContent = "Chỉnh Sửa Người Dùng";
    editUid.value = user.uid;
    editFullName.value = user.displayName || "";
    editEmail.value = user.email || "";
    editEmail.readOnly = true;
    editPhone.value = user.phone || "";
    editRole.value = user.role || "parent";
    editStatus.value = user.status || "active";
    modalBackdrop.classList.add("active");
  }

  function closeUserModal() {
    if (modalBackdrop) modalBackdrop.classList.remove("active");
  }

  btnOpenAddUserModal?.addEventListener("click", openUserModalForAdd);
  btnCloseModal?.addEventListener("click", closeUserModal);
  btnCancelModal?.addEventListener("click", closeUserModal);
  modalBackdrop?.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeUserModal();
  });

  formUserSave?.addEventListener("submit", (e) => {
    e.preventDefault();
    const uid = editUid.value;
    const displayName = editFullName.value.trim();
    const email = editEmail.value.trim();
    const phone = editPhone.value.trim();
    const role = editRole.value;
    const status = editStatus.value;

    if (!displayName || !email) {
      showToast("Vui lòng điền họ tên và email.");
      return;
    }

    saveUserByAdmin({
      uid: uid || null,
      displayName,
      email,
      phone,
      role,
      status
    });

    closeUserModal();
    showToast(uid ? "Đã cập nhật thông tin người dùng!" : "Đã thêm người dùng mới thành công!");
    renderUsersTable();
  });

  // 5. EXPORT USERS TO CSV
  btnExportUsersCSV?.addEventListener("click", () => {
    const allUsers = getAllUsersList();
    let csvContent = "\uFEFFUID,Họ Tên,Email,Số Điện Thoại,Vai Trò,Trạng Thái,Ngày Tham Gia\n";

    allUsers.forEach((u) => {
      const row = [
        `"${u.uid}"`,
        `"${u.displayName || ""}"`,
        `"${u.email}"`,
        `"${u.phone || ""}"`,
        `"${ROLE_LABELS[u.role] || u.role}"`,
        `"${u.status === "blocked" ? "Tạm khóa" : "Hoạt động"}"`,
        `"${u.createdAt || ""}"`
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EduTrace_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải danh sách người dùng về máy (File CSV)!");
  });

  // 6. RENDER BOOKINGS & LEADS TABLE
  function renderBookingsTable() {
    if (!bookingsTableBody) return;
    const allItems = getAllLeadsAndBookings();
    const typeFilter = bookingTypeFilter?.value || "all";
    const statusFilter = bookingStatusFilter?.value || "all";

    const filtered = allItems.filter((item) => {
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchType && matchStatus;
    });

    if (filtered.length === 0) {
      bookingsTableBody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-table-state">
              <p>Chưa có yêu cầu đặt lịch hoặc đơn tư vấn nào.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    bookingsTableBody.innerHTML = filtered
      .map((item) => {
        const isBooking = item.type === "booking";
        const typeBadge = isBooking
          ? `<span class="badge-role center">Đặt lịch can thiệp 1-1</span>`
          : `<span class="badge-role parent">Đăng ký tư vấn</span>`;

        const clientName = item.data?.parentName || item.data?.name || item.userName || "Khách hàng";
        const clientPhone = item.data?.parentPhone || item.data?.phone || "Chưa có SĐT";
        const centerName = item.data?.targetCenter || (isBooking ? "Trung tâm đối tác" : "Hệ thống EduTrace AI");
        const extraNote = item.data?.childInfo || (item.data?.role ? `Vai trò: ${item.data.role}` : "");

        return `
          <tr>
            <td>${typeBadge}</td>
            <td>
              <strong>${clientName}</strong>
              <div style="font-size: 0.76rem; color: #64748b;">📞 ${clientPhone}</div>
            </td>
            <td>
              <strong style="color: #1e3a8a;">${centerName}</strong>
              ${extraNote ? `<div style="font-size: 0.74rem; color: #475569;">${extraNote}</div>` : ""}
            </td>
            <td>
              <span style="font-size: 0.8rem; color: #64748b;">${item.createdAt}</span>
            </td>
            <td>
              <select class="filter-select update-status-select" data-id="${item.id}" style="padding: 4px 8px; font-size: 0.78rem;">
                <option value="pending" ${item.status === "pending" ? "selected" : ""}>🟡 Chờ tiếp nhận</option>
                <option value="contacted" ${item.status === "contacted" ? "selected" : ""}>🔵 Đã liên hệ</option>
                <option value="confirmed" ${item.status === "confirmed" ? "selected" : ""}>🟢 Đã xác nhận</option>
              </select>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-sm btn-outline-light btn-view-booking-detail" data-id="${item.id}" style="color: #2563eb; border-color: #bfdbfe; background: #eff6ff;">
                Chi tiết
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    // Status change listener
    document.querySelectorAll(".update-status-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        updateActivityStatus(id, newStatus);
        showToast("Đã cập nhật trạng thái đơn!");
      });
    });

    // Detail modal button
    document.querySelectorAll(".btn-view-booking-detail").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const item = getAllLeadsAndBookings().find((i) => i.id === id);
        if (item) {
          alert(`CHI TIẾT ĐƠN:\n- Khách hàng: ${item.data?.parentName || item.data?.name || "N/A"}\n- SĐT: ${item.data?.parentPhone || item.data?.phone || "N/A"}\n- Email: ${item.userEmail || item.data?.email || "N/A"}\n- Đơn vị tiếp nhận: ${item.data?.targetCenter || "EduTrace AI"}\n- Thời gian mong muốn: ${item.data?.preferredSchedule || "Không chỉ định"}\n- Ghi chú: ${item.data?.trialFeedback || item.data?.notes || "Không có"}`);
        }
      });
    });
  }

  bookingTypeFilter?.addEventListener("change", renderBookingsTable);
  bookingStatusFilter?.addEventListener("change", renderBookingsTable);

  // 5. AI KNOWLEDGE HUB & GEMINI MANAGEMENT
  function initAdminAIKnowledgeHub() {
    const btnAdminOpenAddKnowledge = document.getElementById("btnAdminOpenAddKnowledge");
    const modalAddKnowledgeBackdrop = document.getElementById("modalAddKnowledgeBackdrop");
    const btnCloseKnowledgeModal = document.getElementById("btnCloseKnowledgeModal");
    const btnCancelKnowledgeModal = document.getElementById("btnCancelKnowledgeModal");
    const formAddKnowledge = document.getElementById("formAddKnowledge");
    const adminKnowledgeTableBody = document.getElementById("adminKnowledgeTableBody");
    const adminDynKnowledgeCount = document.getElementById("adminDynKnowledgeCount");

    const adminGeminiStatusTitle = document.getElementById("adminGeminiStatusTitle");
    const adminGeminiStatusSubtitle = document.getElementById("adminGeminiStatusSubtitle");
    const adminGeminiKeyInput = document.getElementById("adminGeminiKeyInput");
    const adminGeminiModelSelect = document.getElementById("adminGeminiModelSelect");
    const btnAdminSaveGeminiKey = document.getElementById("btnAdminSaveGeminiKey");
    const btnAdminTestGeminiPing = document.getElementById("btnAdminTestGeminiPing");

    // Đồng bộ trạng thái Gemini
    function syncGeminiEngineStatus() {
      if (!window.geminiService) return;
      const isConfigured = window.geminiService.isConfigured();
      const model = window.geminiService.getModel();
      const key = window.geminiService.getApiKey();

      if (adminGeminiKeyInput) adminGeminiKeyInput.value = key;
      if (adminGeminiModelSelect) adminGeminiModelSelect.value = model;

      if (adminGeminiStatusTitle && adminGeminiStatusSubtitle) {
        if (isConfigured) {
          adminGeminiStatusTitle.innerHTML = `<span style="color: #0284c7;">🟢 Google ${model}</span> — Đang Chạy Trực Tiếp`;
          adminGeminiStatusSubtitle.textContent = `Hệ thống sẵn sàng bóc tách triệu chứng và tư vấn đa lượt bằng mô hình ${model}.`;
        } else {
          adminGeminiStatusTitle.innerHTML = `<span style="color: #10b981;">⚡ Phác Đồ Bác Sĩ Nhi Cần Thơ</span> — Chế Độ Offline`;
          adminGeminiStatusSubtitle.textContent = "Chưa nạp Gemini API Key. Đang sử dụng cơ sở tri thức cục bộ M-CHAT & Bác sĩ Ninh Kiều.";
        }
      }
    }

    syncGeminiEngineStatus();
    window.addEventListener("edutrace:gemini-status-changed", syncGeminiEngineStatus);

    // Lưu API Key & Model từ Admin
    btnAdminSaveGeminiKey?.addEventListener("click", () => {
      if (!window.geminiService || !adminGeminiKeyInput) return;
      const key = adminGeminiKeyInput.value.trim();
      const model = adminGeminiModelSelect ? adminGeminiModelSelect.value : "gemini-1.5-flash";

      window.geminiService.setApiKey(key);
      window.geminiService.setModel(model);
      syncGeminiEngineStatus();

      if (key) {
        showToast(`Đã lưu cấu hình Google ${model}!`);
      } else {
        showToast("Đã xóa Key. Chuyển về Chế độ Bác sĩ Cần Thơ (Offline).");
      }
    });

    // Test ping từ Admin
    btnAdminTestGeminiPing?.addEventListener("click", async () => {
      if (!window.geminiService || !adminGeminiKeyInput) return;
      const key = adminGeminiKeyInput.value.trim();
      const model = adminGeminiModelSelect ? adminGeminiModelSelect.value : "gemini-1.5-flash";

      if (!key) {
        showToast("Vui lòng nhập API Key để kiểm tra kết nối!");
        return;
      }

      btnAdminTestGeminiPing.disabled = true;
      btnAdminTestGeminiPing.textContent = "Đang test...";

      try {
        const res = await window.geminiService.testConnection(key, model);
        if (res.success) {
          showToast(`✅ Kết nối thành công tới ${model}! Độ trễ: ${res.latencyMs}ms`);
        } else {
          showToast(`❌ Lỗi kết nối: ${res.error}`);
        }
      } catch (err) {
        showToast(`❌ Lỗi test: ${err.message}`);
      } finally {
        btnAdminTestGeminiPing.disabled = false;
        btnAdminTestGeminiPing.textContent = "Live Ping";
      }
    });

    // Modal Thêm Tri Thức
    const openKnowledgeModal = () => {
      if (modalAddKnowledgeBackdrop) modalAddKnowledgeBackdrop.style.display = "flex";
    };
    const closeKnowledgeModal = () => {
      if (modalAddKnowledgeBackdrop) modalAddKnowledgeBackdrop.style.display = "none";
      if (formAddKnowledge) formAddKnowledge.reset();
    };

    btnAdminOpenAddKnowledge?.addEventListener("click", openKnowledgeModal);
    btnCloseKnowledgeModal?.addEventListener("click", closeKnowledgeModal);
    btnCancelKnowledgeModal?.addEventListener("click", closeKnowledgeModal);

    // Form Submit Thêm Tri Thức
    formAddKnowledge?.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("knTitle")?.value.trim();
      const category = document.getElementById("knCategory")?.value;
      const author = document.getElementById("knAuthor")?.value.trim();
      const content = document.getElementById("knContent")?.value.trim();

      if (!title || !content || !window.saveDynamicKnowledge) return;

      window.saveDynamicKnowledge({ title, category, author, content });
      showToast("Đã nạp tri thức mới thành công! Gemini AI sẽ ứng dụng ngay.");
      closeKnowledgeModal();
      renderAdminKnowledgeList();
    });

    // Render danh sách tri thức tùy biến
    function renderAdminKnowledgeList() {
      if (!adminKnowledgeTableBody || !window.getStoredDynamicKnowledge) return;
      const list = window.getStoredDynamicKnowledge();

      if (adminDynKnowledgeCount) {
        adminDynKnowledgeCount.textContent = list.length;
      }

      if (list.length === 0) {
        adminKnowledgeTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 32px; color: #94a3b8;">
              Chưa có tri thức tùy biến nào do Admin thêm. Nhấn "+ Thêm Tri Thức Mới" để bổ sung chuyên môn lâm sàng.
            </td>
          </tr>
        `;
        return;
      }

      adminKnowledgeTableBody.innerHTML = list.map((item) => `
        <tr>
          <td>
            <strong>${item.title}</strong>
            <div style="font-size: 0.72rem; color: #94a3b8;">Mã: ${item.id}</div>
          </td>
          <td>
            <span class="user-role-badge role-doctor" style="font-size: 0.76rem;">${item.category}</span>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: #475569; max-width: 380px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${item.content}
            </div>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: #1e3a8a; font-weight: 600;">${item.author || "Quản trị viên"}</span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn btn-sm btn-outline-light btn-delete-knowledge" data-id="${item.id}" style="color: #ef4444; border-color: #fca5a5;">
              Xóa
            </button>
          </td>
        </tr>
      `).join("");

      // Nút Xóa
      adminKnowledgeTableBody.querySelectorAll(".btn-delete-knowledge").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (confirm("Bạn có chắc chắn muốn xóa mục tri thức này khỏi bộ nhớ AI?")) {
            if (window.deleteDynamicKnowledge) {
              window.deleteDynamicKnowledge(id);
              showToast("Đã xóa mục tri thức!");
              renderAdminKnowledgeList();
            }
          }
        });
      });
    }

    renderAdminKnowledgeList();
  }

  initAdminAIKnowledgeHub();

  // Initialize service
  initAuthService();
}
