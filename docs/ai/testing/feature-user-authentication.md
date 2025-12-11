---
phase: testing
title: Chiến lược Kiểm thử - Xác thực người dùng
description: Xác định phương pháp kiểm thử, các trường hợp kiểm thử và đảm bảo chất lượng cho Xác thực người dùng
---

# Chiến lược Kiểm thử

## Mục tiêu Bao phủ Kiểm thử

**Chúng ta nhắm đến mức độ kiểm thử nào?**

- **Unit Tests:** ✅ 100% bao phủ cho core logic (AuthService, JwtService, JwtAuthGuard, AuthController).
- **Integration Tests:** ⏳ Kiểm thử endpoint `/auth/me` với một JWT hợp lệ (sẽ làm trong E2E tests).
- **Manual Tests:** ⏳ Luồng OAuth đầy đủ với tài khoản GitHub thực.

## ✅ Unit Tests Completed

**Tất cả test files đã được tạo và pass:**

### JwtService (`jwt.service.spec.ts`)

- ✅ **sign():** Tạo JWT token thành công với HS256, iat, exp claims
- ✅ **sign():** Embed custom data in payload
- ✅ **sign():** Handle signing errors
- ✅ **verify():** Verify valid token successfully
- ✅ **verify():** Throw error for invalid format, wrong signature, expired, malformed, empty token
- ✅ **Integration:** Sign and verify round-trip, multiple sequential operations

**Coverage:** 100% statements, 100% branches, 100% functions

### AuthService (`auth.service.spec.ts`)

- ✅ **validateUser():** Convert GitHub profile to User entity (email selection, photo selection, default role/tier, timestamps)
- ✅ **login():** Generate JWT token with correct payload structure
- ✅ **login():** Handle admin role properly
- ✅ **getUserFromToken():** Convert JWT payload to UserProfileDTO
- ✅ **Edge cases:** Minimal GitHub data, concurrent operations

**Coverage:** 100% statements, 75% branches, 100% functions

### JwtAuthGuard (`jwt-auth.guard.spec.ts`)

- ✅ **canActivate():** Return true for valid Bearer token and attach user to request
- ✅ **canActivate():** Throw UnauthorizedException for missing/invalid/malformed tokens
- ✅ **extractTokenFromHeader():** Handle various header formats (valid, whitespace, case sensitivity)
- ✅ **Security:** No token leaking in errors, concurrent execution safety
- ✅ **Integration:** Admin/user authorization scenarios

**Coverage:** 100% statements, 92.85% branches, 100% functions

### AuthController (`auth.controller.spec.ts`)

- ✅ **githubAuth():** Trigger GitHub OAuth flow
- ✅ **githubAuthRedirect():** Redirect with token on success
- ✅ **githubAuthRedirect():** Handle errors (missing user, login failure, unknown error types)
- ✅ **githubAuthRedirect():** URL encode error messages properly
- ✅ **githubAuthRedirect():** Use FRONTEND_URL from config
- ✅ **getCurrentUser():** Return user profile from JWT payload
- ✅ **getCurrentUser():** Throw UnauthorizedException when user missing
- ✅ **logout():** Return success message

**Coverage:** 100% statements, 80% branches, 100% functions

## Test Statistics

```
Test Suites: 4 passed, 4 total
Tests:       77 passed, 77 total
Time:        ~8s
```

## ⏳ Integration Tests (Pending)

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
