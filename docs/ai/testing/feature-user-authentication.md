---
phase: testing
title: Chiến lược Kiểm thử - Xác thực người dùng
description: Xác định phương pháp kiểm thử, các trường hợp kiểm thử và đảm bảo chất lượng cho Xác thực người dùng
---

# Chiến lược Kiểm thử

## Mục tiêu Bao phủ Kiểm thử

**Chúng ta nhắm đến mức độ kiểm thử nào?**

- **Unit Tests:** 100% bao phủ cho `AuthService` (validateUser, login).
- **Integration Tests:** Kiểm thử endpoint `/auth/me` với một JWT hợp lệ (được tạo bởi `jose`).
- **Manual Tests:** Luồng OAuth đầy đủ với tài khoản GitHub thực.

## Unit Tests

**Những thành phần riêng lẻ nào cần kiểm thử?**

### AuthService

- [ ] **validateUser:** Nên tạo người dùng mới nếu chưa tồn tại.
- [ ] **validateUser:** Nên trả về người dùng hiện có nếu tìm thấy.
- [ ] **login:** Nên trả về một JWT token đã ký (kiểm tra bằng `jose.jwtVerify` trong test).

### JwtAuthGuard (Custom)

- [ ] **canActivate:** Nên trả về true và gắn user vào request nếu token hợp lệ.
- [ ] **canActivate:** Nên ném lỗi UnauthorizedException nếu token không hợp lệ hoặc hết hạn.

## Integration Tests

**Chúng ta kiểm thử tương tác giữa các thành phần như thế nào?**

- [ ] **GET /auth/me (Unauthorized):** Nên trả về 401 khi không có token.
- [ ] **GET /auth/me (Authorized):** Nên trả về hồ sơ người dùng khi có token hợp lệ.

## End-to-End Tests (Thủ công)

**Những luồng người dùng nào cần xác minh?**

- [ ] **Luồng 1: Đăng nhập thành công**

  1. Vào `/login`.
  2. Nhấp "Đăng nhập bằng GitHub".
  3. Ủy quyền trên GitHub.
  4. Xác minh chuyển hướng đến Dashboard.
  5. Xác minh dữ liệu người dùng chính xác ở góc trên bên phải.

- [ ] **Luồng 2: Đăng xuất**

  1. Nhấp Menu Người dùng -> Đăng xuất.
  2. Xác minh chuyển hướng đến `/login`.
  3. Xác minh không thể truy cập `/dashboard` nữa.

- [ ] **Luồng 3: Lưu trữ Token**
  1. Đăng nhập.
  2. Tải lại trang (Refresh).
  3. Xác minh vẫn đang đăng nhập.

## Dữ liệu Kiểm thử

**Chúng ta sử dụng dữ liệu nào để kiểm thử?**

- **Mock User:**
  ```json
  {
    "githubId": "12345",
    "username": "testuser",
    "email": "test@example.com"
  }
  ```
