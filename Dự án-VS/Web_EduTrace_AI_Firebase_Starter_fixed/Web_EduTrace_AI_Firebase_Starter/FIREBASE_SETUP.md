# EduTrace AI — chạy và cấu hình

Đây là ứng dụng HTML/CSS/JavaScript tĩnh, có tích hợp Firebase và chế độ demo. Chạy `Chay_EduTrace_AI.bat` hoặc phục vụ thư mục này bằng máy chủ HTTP; không mở trực tiếp bằng `file://`. Trang chính là `index.html`, trang quản trị là `admin.html`.

## Firebase

- Cấu hình dự án web nằm trong `js/firebase-config.js`. Bật các phương thức Email/Password và Google trong Firebase Authentication nếu cần dùng đăng nhập thật; cấu hình các domain được phép trong Firebase Console.
- File `firestore.rules` yêu cầu custom claim `admin: true` cho các thao tác quản trị. Ngày 02/11/2026, phiên bản này đã được xuất bản cho database mặc định của dự án `edutrace-ai` và xác minh qua API; cấu hình cloud có thể thay đổi sau thời điểm này.
- Chế độ đăng nhập giả lập đã tắt trong mã nguồn. Tài khoản quản trị cần Firebase Authentication và custom claim `admin: true`; tài khoản demo không còn vào được cổng quản trị. Các thao tác tạo, khóa và xóa tài khoản Firebase Authentication vẫn chưa được triển khai phía máy chủ.
- Gemini hiện được gọi trực tiếp từ trình duyệt và khóa được lưu trong localStorage của trình duyệt đó. Không dùng khóa dùng chung hoặc dữ liệu nhạy cảm theo cách này trong môi trường thật.

## Cấu trúc và kiểm thử

- `index.html`, `style.css`, `script.js`: giao diện và chức năng trang chính.
- `admin.html`, `admin.css`, `js/admin.js`: giao diện và điều khiển trang quản trị.
- `js/firebase-auth.js`, `js/firebase-integration.js`: xác thực và dữ liệu Firebase; `js/cloud-page.js`, `js/pagination.js`, `js/admin-filters.js` và `js/admin-csv.js`: phân trang cloud, phân trang giao diện, lọc và xuất CSV; `admin-pagination.css`: giao diện phân trang.
- Cài công cụ kiểm thử với Node.js 24 và Java: `npm install`. Chạy kiểm thử đơn vị bằng `npm test`. Chạy Firebase Auth và Firestore Emulator với `npm run test:integration`; chỉ sử dụng project giả lập `demo-edutrace`, không kết nối dữ liệu thật. Lần chạy đầu có thể cần tải emulator.
- Nếu Firestore Emulator không khởi động từ đường dẫn chứa ký tự Unicode trên Windows, mở một terminal tại thư mục dự án và chạy `java -jar "$env:USERPROFILE\.cache\firebase\emulators\cloud-firestore-emulator-v1.22.0.jar" --host 127.0.0.1 --port 18080 --project_id demo-edutrace --rules firestore.rules`. Trong terminal thứ hai tại cùng thư mục, chạy `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:18080'; npx firebase emulators:exec --project demo-edutrace --config firebase.test.json --only auth "node --test tests/integration/firebase.test.js"`. Dừng Java sau khi kiểm thử.

Ngày 02/11/2026 đã xác minh Rules đang hoạt động là `ac361c91-1c8f-4877-81a3-7da4f2165361`; phiên bản trước là `e13a2a77-73c8-46cd-805e-844f71556801`. Người không đăng nhập bị từ chối khi đọc collection `users`. Chưa kiểm thử toàn bộ luồng ứng dụng với tài khoản admin thật.

Bảng người dùng tải toàn bộ hồ sơ cloud theo các lô tối đa 50 bản ghi và chỉ dùng bản tải đó cho tìm kiếm và thống kê; nút làm mới tải lại. CSV cũng đọc toàn bộ người dùng trực tiếp từ cloud, không kèm dữ liệu mẫu cục bộ. Các thay đổi đồng thời trong quá trình tải có thể ảnh hưởng kết quả; với dữ liệu lớn, cách này phát sinh số lượt đọc và cần thay bằng tìm kiếm/thống kê phía máy chủ. Bảng lịch hẹn vẫn tải từng lô và gộp dữ liệu cục bộ; bộ lọc chỉ bao gồm dữ liệu đã tải.

Các kiểm thử emulator sử dụng `firestore.rules` cục bộ; chúng không kiểm tra cấu hình cloud. Kiểm thử quản lý trạng thái chỉ thay đổi hồ sơ Firestore, chưa khóa tài khoản Firebase Authentication.

`firestore.secure.rules` là bản dự thảo tương ứng với Rules cục bộ. Khi Firestore Emulator đang chạy, kiểm thử bằng `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:18080'; node --test tests/integration/rules.test.js`. Kiểm thử xóa dữ liệu trong emulator; không trỏ biến này tới hệ thống thật. Cần kiểm thử toàn bộ luồng trước khi xuất bản Rules.

Tập lệnh `scripts/grant-admin.js` cấp custom claim cho một UID đã tồn tại, sử dụng Application Default Credentials của người vận hành: `node scripts/grant-admin.js edutrace-ai <UID>`. Không gửi hoặc lưu tệp khóa dịch vụ vào kho mã. Lệnh thay đổi quyền truy cập thật; phải xác minh UID, dự án, quyền người vận hành và Rules trước khi chạy. Người dùng được cấp quyền cần đăng nhập lại.

`firebase.deploy.json` là cấu hình chuẩn bị cho hosting và functions, chưa dùng để triển khai. Chạy `npm run build:hosting` để tạo `.hosting-public` chỉ gồm tệp website trước khi kiểm thử hosting hoặc triển khai. Các cờ `accountFunctionsEnabled` và `geminiCloudEnabled` đang tắt. Trước khi bật, cần triển khai và kiểm thử Functions; đối với Gemini còn cần cấu hình App Check, đặt `appCheckSiteKey`, đặt khóa trong Secret Manager, giới hạn mức sử dụng và kiểm thử phản hồi thực tế. Khi cờ Gemini còn tắt, giao diện vẫn dùng cách gọi cũ và khóa trong trình duyệt. Không coi việc có mã bridge là đã chuyển khóa sang máy chủ.

Kiểm thử quản lý tài khoản với Functions, Auth và Firestore Emulator (không dùng dự án thật): trong PowerShell đặt `$env:FUNCTIONS_EMULATOR_HOST='127.0.0.1:15001'`, sau đó chạy `npx firebase emulators:exec --project demo-edutrace --config firebase.test.json --only auth,firestore,functions "node --test tests/integration/account-functions.test.js"`. Nếu Firestore gặp lỗi đường dẫn Unicode, chạy Firestore Emulator thủ công như hướng dẫn ở trên, đặt thêm `$env:FIRESTORE_EMULATOR_HOST='127.0.0.1:18080'` và chạy lại lệnh với `--only auth,functions`. Kiểm thử này bao gồm từ chối người không có quyền admin, tạo, khóa, mở khóa, xóa và ngăn admin tự xóa. Emulator không chứng minh chức năng đã triển khai hoặc hoạt động với Firebase thật.
