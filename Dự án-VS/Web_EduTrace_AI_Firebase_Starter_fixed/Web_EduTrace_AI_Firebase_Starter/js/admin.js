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
  fetchAllCloudUsers,
  saveUserByAdmin,
  deleteUserByAdmin,
  toggleUserStatusByAdmin,
  syncUsersWithFirestore,
  syncActivitiesWithFirestore,
  getAllLeadsAndBookings,
  updateActivityStatus,
  ROLE_LABELS
} from "./firebase-auth.js";
import { paginate, updatePagination } from "./pagination.js";
import { filterUsers, filterActivities } from "./admin-filters.js";
import { createUsersCsv } from "./admin-csv.js";
import { escapeHtml } from "./escape-html.js";
import { accountFunctionsEnabled, manageUserAccount } from "./admin-functions.js";
import "./gemini-cloud-client.js";

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
  const btnSyncFirestore = document.getElementById("btnSyncFirestore");
  const btnSyncBookingsFirestore = document.getElementById("btnSyncBookingsFirestore");

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
  let dashboardLoaded = false;
  let cloudUsers = [];
  let bookingCloudHasMore = true;
  let userPage = 1;
  let bookingPage = 1;
  const userPagination = document.getElementById("userPagination");
  const bookingPagination = document.getElementById("bookingPagination");
  userPagination?.addEventListener("click", (event) => {
    const action = event.target.dataset.page;
    if (action === "previous" || action === "next") {
      userPage += action === "next" ? 1 : -1;
      renderUsersTable();
    }
  });
  bookingPagination?.addEventListener("click", (event) => {
    const action = event.target.dataset.page;
    if (action === "previous" || action === "next") {
      bookingPage += action === "next" ? 1 : -1;
      renderBookingsTable();
    }
  });

  // 1. AUTH STATE & ACCESS GUARD
  subscribeAuth((user) => {
    currentAdminUser = user;
    if (user?.isAdmin === true && !user.isDemo) {
      // Authenticated as Admin
      guardSection.style.display = "none";
      workspace.classList.add("active");
      if (headerUserPill) headerUserPill.style.display = "flex";
      if (headerName) headerName.textContent = user.displayName || "Admin";
      if (headerAvatar) headerAvatar.textContent = (user.displayName || "A").charAt(0).toUpperCase();

      renderDashboard();
    } else {
      // Not logged in or not admin
      cloudUsers = [];
      dashboardLoaded = false;
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
      if (!res.user?.isAdmin || res.user.isDemo) {
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
    if (!dashboardLoaded) {
      dashboardLoaded = true;
      btnSyncFirestore?.click();
      btnSyncBookingsFirestore?.click();
    }
  }

  // Render Users Table with search and filters
  function renderUsersTable() {
    if (!userTableBody) return;

    const allUsers = cloudUsers;
    const query = (userSearchInput?.value || "").toLowerCase().trim();
    const roleFilter = userRoleFilter?.value || "all";
    const statusFilter = userStatusFilter?.value || "all";

    // Update KPI stats
    updateStatsCards(allUsers);

    // Filter list
    const filtered = filterUsers(allUsers, { search: query, role: roleFilter, status: statusFilter });

    const userCountBadge = document.getElementById("userCountBadge");
    if (userCountBadge) userCountBadge.textContent = filtered.length;
    const page = paginate(filtered, userPage);
    userPage = page.page;
    updatePagination(userPagination, page);

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

    userTableBody.innerHTML = page.items
      .map((record) => {
        const u = { ...record, uid: escapeHtml(record.uid), displayName: escapeHtml(record.displayName), email: escapeHtml(record.email), phone: escapeHtml(record.phone), role: escapeHtml(record.role), roleLabel: escapeHtml(record.roleLabel), createdAt: escapeHtml(record.createdAt) };
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
      btn.addEventListener("click", async () => {
        const uid = btn.dataset.uid;
        btn.disabled = true;
        try {
        const existing = cloudUsers.find(user => user.uid === uid);
        if (accountFunctionsEnabled) {
          const action = existing?.status === 'blocked' ? 'enable' : 'disable';
          const result = await manageUserAccount({ uid, action });
          if (!result.profileUpdated) throw new Error('Tài khoản Auth đã thay đổi nhưng hồ sơ chưa đồng bộ.');
          showToast('Đã cập nhật tài khoản đăng nhập và hồ sơ.');
          await refreshUsers();
          return;
        }
        const updated = await toggleUserStatusByAdmin(uid, existing?.status || 'active');
        if (updated) {
          const statusText = updated.status === "blocked" ? "đã tạm khóa" : "đã kích hoạt lại";
          showToast(`Hồ sơ ${existing?.displayName || ''} ${statusText}; trạng thái đăng nhập chưa thay đổi.`);
          await refreshUsers();
        }
        } catch (error) {
          console.error("Cập nhật trạng thái thất bại:", error);
          showToast(error.message?.includes('đã thay đổi') ? error.message : "Không thể cập nhật trạng thái hồ sơ.");
        } finally { btn.disabled = false; }
      });
    });

    // Delete User
    document.querySelectorAll(".btn-delete-user").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const uid = btn.dataset.uid;
        const allUsers = cloudUsers;
        const user = allUsers.find((u) => u.uid === uid);
        if (user && user.role === "admin") {
          showToast("Không thể xóa tài khoản Quản trị viên chính.");
          return;
        }

        if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${user?.displayName || uid}" khỏi hệ thống?`)) {
          btn.disabled = true;
          try {
            if (accountFunctionsEnabled) {
              const result = await manageUserAccount({ action: 'delete', uid });
              if (!result.profileDeleted) throw new Error('Đã xóa tài khoản Auth nhưng chưa xóa được hồ sơ.');
              showToast('Đã xóa tài khoản đăng nhập và hồ sơ.');
            } else {
              await deleteUserByAdmin(uid);
              showToast("Đã xóa hồ sơ; tài khoản đăng nhập vẫn còn.");
            }
            await refreshUsers();
          } catch (error) {
            console.error("Xóa hồ sơ thất bại:", error);
            showToast(error.message?.includes('Đã xóa tài khoản') ? error.message : "Không thể xóa hồ sơ người dùng.");
          } finally { btn.disabled = false; }
        }
      });
    });
  }

  // Filter & Search events
  const resetUserPage = () => { userPage = 1; renderUsersTable(); };
  userSearchInput?.addEventListener("input", resetUserPage);
  userRoleFilter?.addEventListener("change", resetUserPage);
  userStatusFilter?.addEventListener("change", resetUserPage);

  // 4. USER MODAL (ADD & EDIT)
  function openUserModalForAdd() {
    if (!modalBackdrop) return;
    modalTitle.textContent = "Thêm Hồ Sơ Người Dùng";
    editUid.value = "";
    editFullName.value = "";
    editEmail.value = "";
    editEmail.readOnly = false;
    editPhone.value = "";
    editRole.value = "parent";
    editStatus.value = "active";
    document.getElementById('accountManagementHint').textContent = accountFunctionsEnabled
      ? 'Tạo tài khoản đăng nhập và hồ sơ. Quyền admin được cấp riêng.'
      : 'Thao tác này chỉ quản lý hồ sơ; không tạo, khóa hoặc xóa tài khoản đăng nhập.';
    const passwordGroup = document.getElementById('groupUserPassword');
    if (passwordGroup) passwordGroup.hidden = !accountFunctionsEnabled;
    if (editPassword) { editPassword.value = ''; editPassword.required = accountFunctionsEnabled; }
    editStatus.disabled = accountFunctionsEnabled;
    modalBackdrop.classList.add("active");
  }

  function openUserModalForEdit(uid) {
    if (!modalBackdrop) return;
    const allUsers = cloudUsers;
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
    document.getElementById('accountManagementHint').textContent = 'Sửa hồ sơ; dùng nút khóa hoặc mở khóa để thay đổi trạng thái đăng nhập.';
    const passwordGroup = document.getElementById('groupUserPassword');
    if (passwordGroup) passwordGroup.hidden = true;
    if (editPassword) { editPassword.value = ''; editPassword.required = false; }
    editStatus.disabled = accountFunctionsEnabled;
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

  formUserSave?.addEventListener("submit", async (e) => {
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

    btnSubmitUserModal.disabled = true;
    try {
    if (!uid && accountFunctionsEnabled) {
      const result = await manageUserAccount({ action: 'create', email, password: editPassword.value, displayName, phone, role });
      if (!result.profileCreated) throw new Error('Tài khoản được tạo nhưng hồ sơ chưa được lưu; cần xử lý thủ công.');
    } else await saveUserByAdmin({
      uid: uid || null,
      displayName,
      email,
      phone,
      role,
      status
    });

    closeUserModal();
    showToast(uid ? "Đã cập nhật hồ sơ người dùng." : accountFunctionsEnabled ? "Đã tạo tài khoản và hồ sơ." : "Đã thêm hồ sơ; chưa tạo tài khoản đăng nhập.");
    await refreshUsers();
    } catch (error) {
      console.error("Lưu hồ sơ thất bại:", error);
      showToast(error.message?.includes('được tạo') ? error.message : "Không thể lưu hồ sơ người dùng.");
    } finally { btnSubmitUserModal.disabled = false; }
  });

  // 5. EXPORT USERS TO CSV
  btnExportUsersCSV?.addEventListener("click", async () => {
    btnExportUsersCSV.disabled = true;
    try {
    const allUsers = await fetchAllCloudUsers();
    const csvContent = createUsersCsv(allUsers, ROLE_LABELS);

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `EduTrace_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Đã xuất ${allUsers.length} người dùng từ Cloud.`);
    } catch (error) {
      console.error("Không xuất được người dùng từ Cloud:", error);
      showToast("Không xuất được CSV từ Cloud. Hãy kiểm tra kết nối và quyền truy cập.");
    } finally {
      btnExportUsersCSV.disabled = false;
    }
  });

  // 5.1 SYNC CLOUD FIRESTORE USERS (ĐỒNG BỘ ĐA MÁY)
  async function refreshUsers() {
    const callerUid = currentAdminUser?.uid;
    btnSyncFirestore.disabled = true;
    btnSyncFirestore.classList.add("spinning");
    showToast("Đang đồng bộ người dùng từ Cloud Firestore...");

    try {
      const users = await fetchAllCloudUsers();
      if (!currentAdminUser?.isAdmin || currentAdminUser.uid !== callerUid) return;
      cloudUsers = users;
      renderUsersTable();
      document.getElementById("userCloudStatus").textContent = `Đã tải ${users.length} hồ sơ cloud lúc ${new Date().toLocaleTimeString('vi-VN')}. Làm mới để xem thay đổi sau đó.`;
      showToast(`Đã tải ${users.length} hồ sơ từ Cloud.`);
    } catch (err) {
      document.getElementById("userCloudStatus").textContent = "Không tải được dữ liệu cloud; danh sách trước đó có thể đã cũ.";
      console.error("Lỗi đồng bộ users:", err);
      showToast("Lỗi khi kết nối Cloud Firestore. Vui lòng kiểm tra Rules trên Console.");
    } finally {
      btnSyncFirestore.disabled = false;
      btnSyncFirestore.classList.remove("spinning");
    }
  }
  btnSyncFirestore?.addEventListener("click", refreshUsers);

  // 5.2 SYNC CLOUD FIRESTORE BOOKINGS & LEADS
  btnSyncBookingsFirestore?.addEventListener("click", async () => {
    btnSyncBookingsFirestore.disabled = true;
    btnSyncBookingsFirestore.classList.add("spinning");
    showToast("Đang đồng bộ yêu cầu tư vấn & lịch hẹn từ Cloud...");

    try {
      const res = await syncActivitiesWithFirestore({ reset: !bookingCloudHasMore });
      bookingCloudHasMore = res.hasMore;
      document.getElementById("bookingCloudButtonLabel").textContent = res.hasMore ? "Tải thêm từ Cloud" : "Tải lại từ đầu";
      document.getElementById("bookingCloudStatus").textContent = (res.hasMore ? "Còn dữ liệu cloud chưa tải. " : "Đã duyệt hết dữ liệu cloud. ") + "Bộ lọc chỉ áp dụng cho dữ liệu đã tải hoặc lưu trên trình duyệt.";
      renderBookingsTable();
      showToast(`Đã tải ${res.cloudCount} lịch hẹn và yêu cầu từ Cloud.`);
    } catch (err) {
      document.getElementById("bookingCloudStatus").textContent = "Không tải được dữ liệu cloud; đang hiển thị dữ liệu đã lưu trên trình duyệt.";
      console.error("Lỗi đồng bộ activities:", err);
      showToast(err.code === "permission-denied"
        ? "Firebase từ chối đọc lịch hẹn và yêu cầu tư vấn. Kiểm tra quyền truy cập."
        : "Lỗi khi đồng bộ lịch hẹn từ Cloud Firestore.");
    } finally {
      btnSyncBookingsFirestore.disabled = false;
      btnSyncBookingsFirestore.classList.remove("spinning");
    }
  });

  // 6. RENDER BOOKINGS & LEADS TABLE
  function renderBookingsTable() {
    if (!bookingsTableBody) return;
    const allItems = getAllLeadsAndBookings();
    const typeFilter = bookingTypeFilter?.value || "all";
    const statusFilter = bookingStatusFilter?.value || "all";

    const filtered = filterActivities(allItems, { type: typeFilter, status: statusFilter });
    const page = paginate(filtered, bookingPage);
    bookingPage = page.page;
    updatePagination(bookingPagination, page);

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

    bookingsTableBody.innerHTML = page.items
      .map((item) => {
        const isBooking = item.type === "booking";
        const typeBadge = isBooking
          ? `<span class="badge-role center">Đặt lịch can thiệp 1-1</span>`
          : `<span class="badge-role parent">Đăng ký tư vấn</span>`;

        const clientName = escapeHtml(item.data?.parentName || item.data?.name || item.userName || "Khách hàng");
        const clientPhone = escapeHtml(item.data?.parentPhone || item.data?.phone || "Chưa có SĐT");
        const centerName = escapeHtml(item.data?.targetCenter || (isBooking ? "Trung tâm đối tác" : "Hệ thống EduTrace AI"));
        const extraNote = escapeHtml(item.data?.childInfo || (item.data?.role ? `Vai trò: ${item.data.role}` : ""));
        const itemId = escapeHtml(item.id);

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
              <span style="font-size: 0.8rem; color: #64748b;">${escapeHtml(item.createdAt)}</span>
            </td>
            <td>
              <select class="filter-select update-status-select" data-id="${itemId}" data-type="${isBooking ? "booking" : "consultation"}" style="padding: 4px 8px; font-size: 0.78rem;">
                <option value="pending" ${item.status === "pending" ? "selected" : ""}>🟡 Chờ tiếp nhận</option>
                <option value="contacted" ${item.status === "contacted" ? "selected" : ""}>🔵 Đã liên hệ</option>
                <option value="confirmed" ${item.status === "confirmed" ? "selected" : ""}>🟢 Đã xác nhận</option>
              </select>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn btn-sm btn-outline-light btn-view-booking-detail" data-id="${itemId}" style="color: #2563eb; border-color: #bfdbfe; background: #eff6ff;">
                Chi tiết
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    // Status change listener
    document.querySelectorAll(".update-status-select").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const id = sel.dataset.id;
        const type = sel.dataset.type;
        const newStatus = e.target.value;
        sel.disabled = true;
        try {
          const updated = await updateActivityStatus(id, type, newStatus);
          if (!updated) throw new Error("Không tìm thấy yêu cầu.");
          showToast("Đã đồng bộ trạng thái lên Cloud.");
        } catch (error) {
          console.error("Không thể cập nhật trạng thái:", error);
          showToast("Không thể đồng bộ trạng thái. Kiểm tra quyền và kết nối.");
        } finally {
          renderBookingsTable();
        }
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

  const resetBookingPage = () => { bookingPage = 1; renderBookingsTable(); };
  bookingTypeFilter?.addEventListener("change", resetBookingPage);
  bookingStatusFilter?.addEventListener("change", resetBookingPage);

  // 7. AI KNOWLEDGE HUB & GEMINI MANAGEMENT
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

    // ========================================================================
    // QUẢN TRỊ TRI THỨC AI KÈM TẢI FILE VÀ TẢI VIDEO HƯỚNG DẪN
    // ========================================================================
    let currentAttachedFile = null;
    let currentAttachedVideo = null;

    // Các phần tử giao diện trong modal tri thức
    const editKnId = document.getElementById("editKnId");
    const knTitle = document.getElementById("knTitle");
    const knCategory = document.getElementById("knCategory");
    const knAuthor = document.getElementById("knAuthor");
    const knContent = document.getElementById("knContent");
    const modalKnowledgeTitle = document.getElementById("modalKnowledgeTitle");
    const btnSubmitKnowledgeModal = document.getElementById("btnSubmitKnowledgeModal");

    // File Elements
    const btnKnTabFileUpload = document.getElementById("btnKnTabFileUpload");
    const btnKnTabFileUrl = document.getElementById("btnKnTabFileUrl");
    const knFileTabUploadContent = document.getElementById("knFileTabUploadContent");
    const knFileTabUrlContent = document.getElementById("knFileTabUrlContent");
    const knFileInput = document.getElementById("knFileInput");
    const knFileDropzone = document.getElementById("knFileDropzone");
    const knSelectedFileCard = document.getElementById("knSelectedFileCard");
    const knSelectedFileName = document.getElementById("knSelectedFileName");
    const knSelectedFileSize = document.getElementById("knSelectedFileSize");
    const knFileIconPreview = document.getElementById("knFileIconPreview");
    const btnRemoveKnFile = document.getElementById("btnRemoveKnFile");
    const knFileUrl = document.getElementById("knFileUrl");
    const knFileDescription = document.getElementById("knFileDescription");

    // Video Elements
    const btnKnTabVideoUrl = document.getElementById("btnKnTabVideoUrl");
    const btnKnTabVideoUpload = document.getElementById("btnKnTabVideoUpload");
    const knVideoTabUrlContent = document.getElementById("knVideoTabUrlContent");
    const knVideoTabUploadContent = document.getElementById("knVideoTabUploadContent");
    const knVideoUrl = document.getElementById("knVideoUrl");
    const knVideoUrlPreviewBox = document.getElementById("knVideoUrlPreviewBox");
    const knVideoUrlThumbImg = document.getElementById("knVideoUrlThumbImg");
    const knVideoFileInput = document.getElementById("knVideoFileInput");
    const knVideoDropzone = document.getElementById("knVideoDropzone");
    const knSelectedVideoCard = document.getElementById("knSelectedVideoCard");
    const knSelectedVideoName = document.getElementById("knSelectedVideoName");
    const knSelectedVideoSize = document.getElementById("knSelectedVideoSize");
    const btnRemoveKnVideo = document.getElementById("btnRemoveKnVideo");
    const knVideoTitle = document.getElementById("knVideoTitle");

    // Media Preview Modal Elements
    const modalMediaPreviewBackdrop = document.getElementById("modalMediaPreviewBackdrop");
    const modalMediaPreviewTitle = document.getElementById("modalMediaPreviewTitle");
    const modalMediaPreviewContent = document.getElementById("modalMediaPreviewContent");
    const btnCloseMediaPreviewModal = document.getElementById("btnCloseMediaPreviewModal");

    const closeMediaPreviewModal = () => {
      if (modalMediaPreviewBackdrop) modalMediaPreviewBackdrop.style.display = "none";
      if (modalMediaPreviewContent) modalMediaPreviewContent.innerHTML = "";
    };
    btnCloseMediaPreviewModal?.addEventListener("click", closeMediaPreviewModal);
    modalMediaPreviewBackdrop?.addEventListener("click", (e) => {
      if (e.target === modalMediaPreviewBackdrop) closeMediaPreviewModal();
    });

    // Chuyển Tab Tải File
    btnKnTabFileUpload?.addEventListener("click", () => {
      btnKnTabFileUpload.classList.add("active");
      btnKnTabFileUrl?.classList.remove("active");
      if (knFileTabUploadContent) knFileTabUploadContent.style.display = "block";
      if (knFileTabUrlContent) knFileTabUrlContent.style.display = "none";
    });
    btnKnTabFileUrl?.addEventListener("click", () => {
      btnKnTabFileUrl.classList.add("active");
      btnKnTabFileUpload?.classList.remove("active");
      if (knFileTabUrlContent) knFileTabUrlContent.style.display = "block";
      if (knFileTabUploadContent) knFileTabUploadContent.style.display = "none";
    });

    // Chuyển Tab Video
    btnKnTabVideoUrl?.addEventListener("click", () => {
      btnKnTabVideoUrl.classList.add("active");
      btnKnTabVideoUpload?.classList.remove("active");
      if (knVideoTabUrlContent) knVideoTabUrlContent.style.display = "block";
      if (knVideoTabUploadContent) knVideoTabUploadContent.style.display = "none";
    });
    btnKnTabVideoUpload?.addEventListener("click", () => {
      btnKnTabVideoUpload.classList.add("active");
      btnKnTabVideoUrl?.classList.remove("active");
      if (knVideoTabUploadContent) knVideoTabUploadContent.style.display = "block";
      if (knVideoTabUrlContent) knVideoTabUrlContent.style.display = "none";
    });

    // Chọn file tài liệu từ máy
    knFileDropzone?.addEventListener("click", () => knFileInput?.click());
    knFileDropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      knFileDropzone.classList.add("dragover");
    });
    knFileDropzone?.addEventListener("dragleave", () => knFileDropzone.classList.remove("dragover"));
    knFileDropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      knFileDropzone.classList.remove("dragover");
      if (e.dataTransfer.files?.length) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
    knFileInput?.addEventListener("change", (e) => {
      if (e.target.files?.length) {
        handleFileSelection(e.target.files[0]);
      }
    });

    function handleFileSelection(file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast("⚠️ Tệp quá lớn! Vui lòng chọn tệp nhỏ hơn 25MB.");
        return;
      }
      currentAttachedFile = {
        fileObject: file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        source: "upload"
      };

      if (knSelectedFileCard) knSelectedFileCard.style.display = "flex";
      if (knSelectedFileName) knSelectedFileName.textContent = file.name;
      if (knSelectedFileSize) knSelectedFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng nạp cho AI`;

      let icon = "📄";
      if (file.name.endsWith(".pdf")) icon = "📕";
      else if (file.name.match(/\.(doc|docx)$/i)) icon = "📝";
      else if (file.name.match(/\.(png|jpg|jpeg|webp)$/i)) icon = "🖼️";
      if (knFileIconPreview) knFileIconPreview.textContent = icon;

      if (knFileDescription && !knFileDescription.value.trim()) {
        knFileDescription.value = file.name.replace(/\.[^/.]+$/, "");
      }
    }

    btnRemoveKnFile?.addEventListener("click", () => {
      currentAttachedFile = null;
      if (knFileInput) knFileInput.value = "";
      if (knSelectedFileCard) knSelectedFileCard.style.display = "none";
    });

    // Xử lý link Video YouTube / Web
    knVideoUrl?.addEventListener("input", (e) => {
      const url = e.target.value.trim();
      const ytId = window.parseYouTubeId ? window.parseYouTubeId(url) : null;
      if (ytId) {
        if (knVideoUrlPreviewBox) knVideoUrlPreviewBox.style.display = "block";
        if (knVideoUrlThumbImg) knVideoUrlThumbImg.src = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        if (knVideoTitle && !knVideoTitle.value.trim()) {
          knVideoTitle.value = "Video hướng dẫn thực hành trên YouTube";
        }
      } else {
        if (knVideoUrlPreviewBox) knVideoUrlPreviewBox.style.display = "none";
      }
    });

    // Chọn file video từ máy
    knVideoDropzone?.addEventListener("click", () => knVideoFileInput?.click());
    knVideoDropzone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      knVideoDropzone.classList.add("dragover");
    });
    knVideoDropzone?.addEventListener("dragleave", () => knVideoDropzone.classList.remove("dragover"));
    knVideoDropzone?.addEventListener("drop", (e) => {
      e.preventDefault();
      knVideoDropzone.classList.remove("dragover");
      if (e.dataTransfer.files?.length) {
        handleVideoSelection(e.dataTransfer.files[0]);
      }
    });
    knVideoFileInput?.addEventListener("change", (e) => {
      if (e.target.files?.length) {
        handleVideoSelection(e.target.files[0]);
      }
    });

    function handleVideoSelection(file) {
      if (file.size > 50 * 1024 * 1024) {
        showToast("⚠️ Video quá lớn! Vui lòng chọn tệp nhỏ hơn 50MB.");
        return;
      }
      currentAttachedVideo = {
        fileObject: file,
        name: file.name,
        size: file.size,
        type: file.type || "video/mp4",
        source: "upload"
      };

      if (knSelectedVideoCard) knSelectedVideoCard.style.display = "flex";
      if (knSelectedVideoName) knSelectedVideoName.textContent = file.name;
      if (knSelectedVideoSize) knSelectedVideoSize.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB • Đã sẵn sàng phát cho người dùng`;

      if (knVideoTitle && !knVideoTitle.value.trim()) {
        knVideoTitle.value = file.name.replace(/\.[^/.]+$/, "");
      }
    }

    btnRemoveKnVideo?.addEventListener("click", () => {
      currentAttachedVideo = null;
      if (knVideoFileInput) knVideoFileInput.value = "";
      if (knSelectedVideoCard) knSelectedVideoCard.style.display = "none";
    });

    // Mở Modal (Chế độ Thêm mới hoặc Sửa)
    const openKnowledgeModal = (editItem = null) => {
      currentAttachedFile = null;
      currentAttachedVideo = null;
      if (formAddKnowledge) formAddKnowledge.reset();
      if (knSelectedFileCard) knSelectedFileCard.style.display = "none";
      if (knSelectedVideoCard) knSelectedVideoCard.style.display = "none";
      if (knVideoUrlPreviewBox) knVideoUrlPreviewBox.style.display = "none";

      if (editItem) {
        if (modalKnowledgeTitle) modalKnowledgeTitle.textContent = "Chỉnh Sửa Tri Thức Y Khoa Cho AI";
        if (editKnId) editKnId.value = editItem.id;
        if (knTitle) knTitle.value = editItem.title || "";
        if (knCategory) knCategory.value = editItem.category || "Chậm nói & Ngôn ngữ";
        if (knAuthor) knAuthor.value = editItem.author || "";
        if (knContent) knContent.value = editItem.content || "";
        if (btnSubmitKnowledgeModal) btnSubmitKnowledgeModal.textContent = "Cập Nhật & Nạp Vào Gemini";

        // Khôi phục tệp đã đính kèm nếu có
        if (editItem.file) {
          currentAttachedFile = { ...editItem.file };
          if (editItem.file.source === "url" && editItem.file.url) {
            btnKnTabFileUrl?.click();
            if (knFileUrl) knFileUrl.value = editItem.file.url;
          } else {
            btnKnTabFileUpload?.click();
            if (knSelectedFileCard) knSelectedFileCard.style.display = "flex";
            if (knSelectedFileName) knSelectedFileName.textContent = editItem.file.name;
            if (knSelectedFileSize) knSelectedFileSize.textContent = "Tệp đã lưu trong bộ nhớ AI";
          }
          if (knFileDescription) knFileDescription.value = editItem.file.description || editItem.file.name || "";
        }

        // Khôi phục video đã đính kèm nếu có
        if (editItem.video) {
          currentAttachedVideo = { ...editItem.video };
          if (editItem.video.source === "url" && editItem.video.url) {
            btnKnTabVideoUrl?.click();
            if (knVideoUrl) {
              knVideoUrl.value = editItem.video.url;
              knVideoUrl.dispatchEvent(new Event("input"));
            }
          } else {
            btnKnTabVideoUpload?.click();
            if (knSelectedVideoCard) knSelectedVideoCard.style.display = "flex";
            if (knSelectedVideoName) knSelectedVideoName.textContent = editItem.video.name || editItem.video.title;
            if (knSelectedVideoSize) knSelectedVideoSize.textContent = "Video đã lưu trong bộ nhớ AI";
          }
          if (knVideoTitle) knVideoTitle.value = editItem.video.title || "";
        }
      } else {
        if (modalKnowledgeTitle) modalKnowledgeTitle.textContent = "Thêm Tri Thức Y Khoa & Tài Liệu / Video Cho AI";
        if (editKnId) editKnId.value = "";
        if (btnSubmitKnowledgeModal) btnSubmitKnowledgeModal.textContent = "Lưu & Nạp Vào Gemini";
        btnKnTabFileUpload?.click();
        btnKnTabVideoUrl?.click();
      }

      if (modalAddKnowledgeBackdrop) modalAddKnowledgeBackdrop.style.display = "flex";
    };

    const closeKnowledgeModal = () => {
      if (modalAddKnowledgeBackdrop) modalAddKnowledgeBackdrop.style.display = "none";
      if (formAddKnowledge) formAddKnowledge.reset();
      currentAttachedFile = null;
      currentAttachedVideo = null;
    };

    btnAdminOpenAddKnowledge?.addEventListener("click", () => openKnowledgeModal(null));
    btnCloseKnowledgeModal?.addEventListener("click", closeKnowledgeModal);
    btnCancelKnowledgeModal?.addEventListener("click", closeKnowledgeModal);

    // Xử lý Submit Form (Lưu hoặc Cập nhật)
    formAddKnowledge?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = editKnId ? editKnId.value : "";
      const title = knTitle?.value.trim();
      const category = knCategory?.value;
      const author = knAuthor?.value.trim();
      const content = knContent?.value.trim();

      if (!title || !content) {
        showToast("Vui lòng điền đầy đủ tiêu đề và nội dung tri thức!");
        return;
      }

      if (btnSubmitKnowledgeModal) {
        btnSubmitKnowledgeModal.disabled = true;
        btnSubmitKnowledgeModal.textContent = "Đang nạp tri thức & tệp...";
      }

      try {
        // 1. Chuẩn bị thông tin File
        let fileData = null;
        if (currentAttachedFile && currentAttachedFile.fileObject) {
          const storageKey = `kn_file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          if (window.saveMediaBlob) {
            await window.saveMediaBlob(storageKey, currentAttachedFile.fileObject);
          }
          fileData = {
            name: currentAttachedFile.name,
            size: currentAttachedFile.size,
            type: currentAttachedFile.type,
            source: "upload",
            storageKey: storageKey,
            description: knFileDescription?.value.trim() || currentAttachedFile.name
          };
        } else if (knFileUrl && knFileUrl.value.trim()) {
          fileData = {
            name: knFileDescription?.value.trim() || "Tài liệu trực tuyến",
            source: "url",
            url: knFileUrl.value.trim(),
            description: knFileDescription?.value.trim() || ""
          };
        } else if (currentAttachedFile && !currentAttachedFile.fileObject) {
          // Giữ nguyên file cũ nếu đang sửa
          fileData = currentAttachedFile;
          if (knFileDescription) fileData.description = knFileDescription.value.trim();
        }

        // 2. Chuẩn bị thông tin Video
        let videoData = null;
        if (currentAttachedVideo && currentAttachedVideo.fileObject) {
          const storageKey = `kn_video_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          if (window.saveMediaBlob) {
            await window.saveMediaBlob(storageKey, currentAttachedVideo.fileObject);
          }
          videoData = {
            title: knVideoTitle?.value.trim() || currentAttachedVideo.name,
            source: "upload",
            storageKey: storageKey,
            size: currentAttachedVideo.size,
            duration: "Video tải lên"
          };
        } else if (knVideoUrl && knVideoUrl.value.trim()) {
          const vUrl = knVideoUrl.value.trim();
          const ytId = window.parseYouTubeId ? window.parseYouTubeId(vUrl) : null;
          videoData = {
            title: knVideoTitle?.value.trim() || "Video hướng dẫn thực hành",
            source: "url",
            url: vUrl,
            youtubeId: ytId,
            duration: ytId ? "YouTube" : "Video Web"
          };
        } else if (currentAttachedVideo && !currentAttachedVideo.fileObject) {
          // Giữ nguyên video cũ nếu đang sửa
          videoData = currentAttachedVideo;
          if (knVideoTitle) videoData.title = knVideoTitle.value.trim();
        }

        // 3. Lưu vào Storage
        const payload = {
          title,
          category,
          author,
          content,
          file: fileData,
          video: videoData
        };

        if (id && window.updateDynamicKnowledge) {
          window.updateDynamicKnowledge(id, payload);
          showToast("Đã cập nhật tri thức và tệp/video cho AI thành công!");
        } else if (window.saveDynamicKnowledge) {
          window.saveDynamicKnowledge(payload);
          showToast("Đã nạp tri thức, tệp và video vào Gemini AI thành công!");
        }

        closeKnowledgeModal();
        renderAdminKnowledgeList();
      } catch (err) {
        console.error("Lỗi khi lưu tri thức:", err);
        showToast("❌ Gặp lỗi khi lưu tri thức: " + err.message);
      } finally {
        if (btnSubmitKnowledgeModal) {
          btnSubmitKnowledgeModal.disabled = false;
          btnSubmitKnowledgeModal.textContent = "Lưu & Nạp Vào Gemini";
        }
      }
    });

    // Render danh sách tri thức tùy biến ra bảng
    function renderAdminKnowledgeList() {
      if (!adminKnowledgeTableBody || !window.getStoredDynamicKnowledge) return;
      const list = window.getStoredDynamicKnowledge();

      if (adminDynKnowledgeCount) {
        adminDynKnowledgeCount.textContent = list.length;
      }

      if (list.length === 0) {
        adminKnowledgeTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 36px; color: #94a3b8;">
              Chưa có tri thức tùy biến nào do Admin thêm. Nhấn "+ Thêm Tri Thức Mới" để bổ sung chuyên môn, tải file tài liệu và video minh họa.
            </td>
          </tr>
        `;
        return;
      }

      adminKnowledgeTableBody.innerHTML = list.map((rawItem) => {
        const item = {
          ...rawItem,
          id: escapeHtml(rawItem.id),
          title: escapeHtml(rawItem.title),
          category: escapeHtml(rawItem.category),
          content: escapeHtml(rawItem.content),
          author: escapeHtml(rawItem.author)
        };
        // Render huy hiệu tệp đính kèm
        let mediaHtml = '<div style="display: flex; flex-direction: column; gap: 4px;">';
        if (item.file) {
          const fileName = item.file.name || "Tài liệu";
          const shortName = fileName.length > 18 ? fileName.slice(0, 15) + "..." : fileName;
          mediaHtml += `
            <button type="button" class="btn-preview-file" data-id="${item.id}" title="Bấm để xem/tải: ${escapeHtml(fileName)}">
              📄 ${escapeHtml(shortName)}
            </button>
          `;
        }
        if (item.video) {
          const vTitle = item.video.title || "Video";
          const shortTitle = vTitle.length > 18 ? vTitle.slice(0, 15) + "..." : vTitle;
          mediaHtml += `
            <button type="button" class="btn-preview-video" data-id="${item.id}" title="Bấm để xem thử: ${escapeHtml(vTitle)}">
              🎬 ${item.video.youtubeId ? "YouTube" : "Video"}: ${escapeHtml(shortTitle)}
            </button>
          `;
        }
        if (!item.file && !item.video) {
          mediaHtml += `<span style="font-size: 0.74rem; color: #94a3b8; font-style: italic;">Chưa có</span>`;
        }
        mediaHtml += "</div>";

        return `
          <tr>
            <td>
              <strong>${item.title}</strong>
              <div style="font-size: 0.72rem; color: #94a3b8;">ID: ${item.id}</div>
            </td>
            <td>
              <span class="user-role-badge role-doctor" style="font-size: 0.76rem;">${item.category}</span>
            </td>
            <td>
              <div style="font-size: 0.82rem; color: #475569; max-width: 320px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${item.content}
              </div>
            </td>
            <td>
              ${mediaHtml}
            </td>
            <td>
              <span style="font-size: 0.82rem; color: #1e3a8a; font-weight: 600;">${item.author || "Quản trị viên"}</span>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <button type="button" class="btn btn-sm btn-outline-light btn-edit-knowledge" data-id="${item.id}" style="color: #0284c7; border-color: #bae6fd; margin-right: 6px;">
                Sửa
              </button>
              <button type="button" class="btn btn-sm btn-outline-light btn-delete-knowledge" data-id="${item.id}" style="color: #ef4444; border-color: #fca5a5;">
                Xóa
              </button>
            </td>
          </tr>
        `;
      }).join("");

      // Nút Sửa
      adminKnowledgeTableBody.querySelectorAll(".btn-edit-knowledge").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          const target = list.find((k) => k.id === id);
          if (target) openKnowledgeModal(target);
        });
      });

      // Nút Xóa
      adminKnowledgeTableBody.querySelectorAll(".btn-delete-knowledge").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (confirm("Bạn có chắc chắn muốn xóa mục tri thức này (kèm tệp và video) khỏi bộ nhớ AI?")) {
            if (window.deleteDynamicKnowledge) {
              window.deleteDynamicKnowledge(id);
              showToast("Đã xóa mục tri thức và tệp đính kèm!");
              renderAdminKnowledgeList();
            }
          }
        });
      });

      // Xem/Tải tệp
      adminKnowledgeTableBody.querySelectorAll(".btn-preview-file").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (window.downloadKnowledgeFile) {
            window.downloadKnowledgeFile(id);
          }
        });
      });

      // Xem video
      adminKnowledgeTableBody.querySelectorAll(".btn-preview-video").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.id;
          if (window.openKnowledgeVideoPlayer) {
            window.openKnowledgeVideoPlayer(id);
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
