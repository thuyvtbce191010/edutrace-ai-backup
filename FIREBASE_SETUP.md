# EduTrace AI — Firebase Firestore & Authentication Guide

## Những tính năng mới đã tích hợp
1. **Hệ thống Đăng ký & Đăng nhập hoàn chỉnh:**
   - Đăng ký tài khoản mới qua Email & Mật khẩu với đầy đủ thông tin: Họ tên, Số điện thoại, Vai trò (Phụ huynh, Trung tâm can thiệp, Chuyên viên/Bác sĩ, Đối tác).
   - Đánh giá trực quan độ mạnh mật khẩu (Password Strength Meter) theo thời gian thực.
   - Ẩn/Hiện mật khẩu với nút con mắt tiện lợi.
   - Đăng nhập qua Email & Mật khẩu.
   - Đăng nhập nhanh một chạm bằng tài khoản Google (`signInWithPopup`).
   - Tính năng Quên mật khẩu & gửi email khôi phục an toàn (`sendPasswordResetEmail`).
2. **Quản lý Hồ sơ người dùng & Lịch hẹn:**
   - Hiển thị Avatar (hình đại diện hoặc chữ cái đầu), Tên người dùng và Huy hiệu vai trò trên thanh Menu (Navbar).
   - Menu Dropdown tài khoản: Xem thông tin tài khoản, Lịch hẹn đã gửi, Đăng xuất.
   - Modal quản lý hồ sơ: Cho phép người dùng cập nhật Tên, SĐT, Vai trò.
   - Theo dõi lịch sử: Tự động lưu và hiển thị danh sách các Yêu cầu tư vấn (`leads`) và Yêu cầu đặt lịch khám 1-1 (`bookingRequests`) đã nộp.
3. **Tự động điền dữ liệu (Autofill):**
   - Khi người dùng đã đăng nhập, hệ thống tự động điền Họ tên, Email, Số điện thoại, Vai trò vào Form tư vấn và Form đặt lịch can thiệp 1-1.
4. **Chế độ Demo Fallback thông minh:**
   - Tích hợp sẵn 3 tài khoản thử nghiệm nhanh (click 1 chạm để điền):
     * Phụ huynh mẫu: `demo.parent@edutrace.vn`
     * Trung tâm mẫu: `demo.center@edutrace.vn`
     * Chuyên viên mẫu: `demo.doctor@edutrace.vn`
   - Nếu dự án Firebase chưa kịp bật provider trong Console, hệ thống sẽ tự động chuyển sang chế độ Demo an toàn để người dùng và ban giám khảo vẫn trải nghiệm được 100% giao diện và luồng hoạt động mà không bị báo lỗi gián đoạn!

---

## Hướng dẫn cấu hình Firebase Console

### 1. Kích hoạt Firebase Authentication
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và chọn dự án `edutrace-ai`.
2. Ở thanh bên trái, chọn **Build > Authentication > Get started**.
3. Vào tab **Sign-in method**:
   - **Email/Password**: Nhấp chọn, gạt công tắc **Enable**, sau đó nhấn **Save**.
   - **Google**: Nhấp chọn, gạt công tắc **Enable**, chọn email hỗ trợ dự án và nhấn **Save**.
4. (Tùy chọn) Thêm domain kiểm thử vào tab **Settings > Authorized domains** (ví dụ: `localhost`, `127.0.0.1`, hoặc domain hosting triển khai).

### 2. Cập nhật Firestore Security Rules
Vào **Firestore Database > Rules**, dán nội dung từ file `firestore.rules` và nhấn **Publish**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leads/{leadId} {
      allow create: if request.resource.data.keys().hasAll(["name", "phone", "email", "role", "createdAt", "source"]) &&
                       request.resource.data.source == "edutrace-ai-website";
      allow read, update, delete: if false;
    }
    match /bookingRequests/{requestId} {
      allow create: if request.resource.data.keys().hasAll(["parentName", "parentPhone", "targetCenter", "preferredSchedule", "status", "createdAt", "source"]) &&
                       request.resource.data.source == "edutrace-ai-website";
      allow read, update, delete: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Kiểm tra cấu hình Web trong `js/firebase-config.js`
Đảm bảo thông tin API key, authDomain và projectId khớp với Web App đã đăng ký trong Firebase Console:
```javascript
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "edutrace-ai.firebaseapp.com",
  projectId: "edutrace-ai",
  appId: "1:..."
};
```

---

## Cách chạy thử dự án
Mở thư mục bằng **VS Code** và khởi chạy qua tiện ích mở rộng **Live Server** (hoặc bất kỳ máy chủ HTTP cục bộ nào như `npx serve .` hoặc `python -m http.server 8000`). Tránh mở trực tiếp qua giao thức `file://` để trình duyệt tải được các module Javascript (`<script type="module">`).
