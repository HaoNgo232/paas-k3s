---
phase: requirements
title: Yêu cầu & Hiểu vấn đề - Xác thực người dùng
description: Làm rõ không gian vấn đề, thu thập yêu cầu và xác định tiêu chí thành công cho Xác thực người dùng
---

# Yêu cầu & Hiểu vấn đề

## Tuyên bố vấn đề

**Chúng ta đang giải quyết vấn đề gì?**

- **Vấn đề cốt lõi:** Người dùng hiện tại không thể truy cập nền tảng một cách an toàn. Không có cơ chế để xác định người dùng, quản lý phiên làm việc của họ hoặc gán tài nguyên (Spaces, Projects) cho các cá nhân cụ thể.
- **Người dùng bị ảnh hưởng:** Tất cả người dùng (Sinh viên, Giảng viên, Quản trị viên).
- **Tình trạng hiện tại:** Hệ thống đang mở/không thể truy cập nếu không có quản lý danh tính.

## Mục tiêu & Mục đích

**Chúng ta muốn đạt được điều gì?**

- **Mục tiêu chính:**
  - Triển khai xác thực an toàn sử dụng GitHub OAuth.
  - Tự động tạo tài khoản người dùng khi đăng nhập lần đầu.
  - Quản lý phiên người dùng sử dụng JWT (thư viện `jose`).
  - Bảo vệ các route riêng tư và các API endpoint.
- **Không phải mục tiêu:**
  - Đăng ký bằng Email/Mật khẩu (chúng ta chỉ sử dụng GitHub).
  - Xác thực đa yếu tố (MFA) cho MVP.
  - Các nhà cung cấp đăng nhập xã hội khác ngoài GitHub.

## User Stories & Use Cases

**Người dùng sẽ tương tác với giải pháp như thế nào?**

- **US-01:** Là một **Khách**, tôi muốn thấy nút "Đăng nhập bằng GitHub" trên trang đăng nhập để tôi có thể bắt đầu quá trình xác thực.
- **US-02:** Là một **Khách**, tôi muốn được chuyển hướng đến GitHub để ủy quyền cho ứng dụng để tôi không phải chia sẻ mật khẩu của mình với nền tảng.
- **US-03:** Là một **Người dùng mới**, tôi muốn tài khoản của mình được tạo tự động sau khi ủy quyền GitHub thành công để tôi có thể bắt đầu sử dụng nền tảng ngay lập tức.
- **US-04:** Là một **Người dùng đã đăng nhập**, tôi muốn được chuyển hướng đến Dashboard sau khi đăng nhập để tôi có thể truy cập không gian làm việc của mình.
- **US-05:** Là một **Người dùng đã đăng nhập**, tôi muốn có thể đăng xuất để tôi có thể bảo mật phiên làm việc của mình trên máy tính dùng chung.

## Tiêu chí thành công

**Làm sao chúng ta biết khi nào đã hoàn thành?**

- [ ] **Giao diện:** Trang đăng nhập hiển thị chính xác với nút đăng nhập GitHub.
- [ ] **Luồng:** Nhấp vào đăng nhập chuyển hướng đến GitHub, và xác thực thành công chuyển hướng trở lại nền tảng.
- [ ] **Dữ liệu:** Bản ghi người dùng được tạo trong PostgreSQL với đúng GitHub ID, email và username.
- [ ] **Bảo mật:** JWT token được tạo, ký (bằng `jose`), và lưu trữ an toàn trên client.
- [ ] **Kiểm soát truy cập:** Các route được bảo vệ (ví dụ: `/dashboard`) chuyển hướng đến `/login` nếu không có token hợp lệ.
- [ ] **Đăng xuất:** Hành động đăng xuất xóa token và chuyển hướng đến trang đăng nhập.

## Ràng buộc & Giả định

**Chúng ta cần làm việc trong những giới hạn nào?**

- **Ràng buộc kỹ thuật:**
  - Phải sử dụng **GitHub OAuth** là nhà cung cấp danh tính duy nhất.
  - Phải sử dụng **JWT** cho xác thực không trạng thái (stateless).
  - Backend: NestJS + Passport + **jose** (thay vì `@nestjs/jwt`).
  - Frontend: Next.js 15.
- **Giả định:**
  - Người dùng có tài khoản GitHub hợp lệ.
  - Ứng dụng đã được đăng ký là OAuth App trên GitHub (Client ID/Secret có sẵn).

## Câu hỏi & Các mục mở

**Chúng ta vẫn cần làm rõ điều gì?**

- **Thời hạn Token:** Thời gian hết hạn của JWT là bao lâu? (Đề xuất: 7 ngày cho MVP).
- **Refresh Token:** Chúng ta có cần cơ chế refresh token không? (Đề xuất: Không, giữ đơn giản cho MVP, access token sống lâu).
