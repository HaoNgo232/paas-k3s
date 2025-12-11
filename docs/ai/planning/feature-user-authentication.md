---
phase: planning
title: Kế hoạch Dự án & Phân chia Công việc - Xác thực người dùng
description: Phân chia công việc thành các nhiệm vụ khả thi và ước tính thời gian cho Xác thực người dùng
---

# Kế hoạch Dự án & Phân chia Công việc

## Các cột mốc

**Các điểm kiểm tra chính là gì?**

- [ ] **Milestone 1: Nền tảng Auth Backend** (API endpoints hoạt động, phát hành JWT bằng `jose`)
- [ ] **Milestone 2: Tích hợp Frontend** (Giao diện đăng nhập, Xử lý Token, Các route được bảo vệ)
- [ ] **Milestone 3: Xác minh End-to-End** (Luồng đăng nhập đầy đủ hoạt động)

## Phân chia Nhiệm vụ

**Công việc cụ thể nào cần được thực hiện?**

### Giai đoạn 1: Triển khai Backend

- [x] **Task 1.1: Cài đặt Dependencies**
  - Cài đặt `@nestjs/passport`, `passport`, `passport-github2`, `jose`, `@types/passport-github2`.
- [x] **Task 1.2: Cấu hình Môi trường**
  - Thêm `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL` vào `.env`.
- [x] **Task 1.3: Triển khai Auth Module & Service**
  - Tạo `AuthModule`, `AuthService`.
  - Triển khai logic `validateUser` (upsert user).
  - Triển khai logic `login` (ký JWT dùng `jose`).
- [x] **Task 1.4: Triển khai GitHub Strategy**
  - Tạo class `GithubStrategy`.
- [x] **Task 1.5: Triển khai JWT Guard (Custom)**
  - Tạo `JwtAuthGuard` sử dụng `jose` để verify token.
- [x] **Task 1.6: Triển khai Auth Controller**
  - Tạo các endpoint `/auth/github`, `/auth/github/callback`, `/auth/me`.

### Giai đoạn 2: Triển khai Frontend

- [x] **Task 2.1: Thiết lập Auth Context**
  - Tạo context `AuthProvider`.
  - Triển khai trạng thái `login`, `logout`, `user`.
- [ ] **Task 2.2: Tạo Trang Đăng nhập**
  - Thiết kế trang `/login` với nút "Đăng nhập bằng GitHub".
- [ ] **Task 2.3: Tạo Trang Callback**
  - Tạo trang `/auth/callback` để parse `token` từ URL query.
  - Lưu token và chuyển hướng đến Dashboard.
- [ ] **Task 2.4: Triển khai API Client**
  - Cấu hình `axios` hoặc `fetch` wrapper để gắn Bearer token.
- [ ] **Task 2.5: Bảo vệ Routes**
  - Tạo Higher-Order Component hoặc Layout wrapper để kiểm tra trạng thái auth.

### Giai đoạn 3: Hạ tầng & Cấu hình

- [ ] **Task 3.1: GitHub OAuth App**
  - Đăng ký OAuth App mới trên GitHub.
  - Đặt Homepage URL: `http://localhost:3000`.
  - Đặt Callback URL: `http://localhost:3001/auth/github/callback`.

## Sự phụ thuộc

**Điều gì cần xảy ra theo thứ tự nào?**

- **Blocker:** Cần GitHub Client ID/Secret trước khi test.
- **Thứ tự:** Backend phải sẵn sàng trước khi Frontend có thể tích hợp đầy đủ.

## Thời gian & Ước tính

**Khi nào mọi thứ sẽ hoàn thành?**

- **Backend:** 3-4 giờ
- **Frontend:** 2-3 giờ
- **Tích hợp & Testing:** 1-2 giờ
- **Tổng ước tính:** 6-9 giờ

## Rủi ro & Giảm thiểu

**Điều gì có thể sai sót?**

- **Rủi ro:** Sai lệch URL callback GitHub OAuth (localhost vs production).
  - _Giảm thiểu:_ Sử dụng biến môi trường cho các URL callback.
- **Rủi ro:** Vấn đề CORS giữa Frontend (3000) và Backend (3001).
  - _Giảm thiểu:_ Cấu hình CORS trong `main.ts` của NestJS.
- **Rủi ro:** XSS attack có thể đánh cắp JWT token từ accessible cookies.
  - _Giảm thiểu MVP:_
    - Sử dụng Secure + SameSite flags
    - Next.js built-in XSS protection
    - Input sanitization
  - _Giảm thiểu Dài hạn:_ Migration sang HttpOnly cookies (xem Security Enhancement Plan)

## Security Enhancement Plan (Post-MVP)

**Kế hoạch nâng cấp bảo mật sau MVP:**

### Current State: Accessible Cookie + Bearer Token

**✅ Lợi ích:**

- Đơn giản, chuẩn REST API
- Dễ dàng support multi-client (web, mobile, CLI)
- Authorization header là industry standard
- Dễ debug và test

**⚠️ Trade-off:**

- JWT token có thể bị XSS attack đánh cắp
- Cần dựa vào Next.js built-in protections

### Future State: HttpOnly Cookie + Dual Auth Mode

**🎯 Migration Path (Giai đoạn nâng cao):**

#### Phase 1: Dual Auth Support (Tương thích ngược)

- [ ] **Backend:** Support cả Bearer token VÀ Cookie-based auth
  ```typescript
  // JwtAuthGuard checks:
  // 1. Authorization: Bearer {token} (mobile/CLI)
  // 2. Cookie: accessToken={token} (web HttpOnly)
  ```
- [ ] **Frontend:** Flag môi trường để toggle giữa 2 modes
- [ ] **Testing:** Verify cả 2 auth flows hoạt động

#### Phase 2: HttpOnly Migration (Web only)

- [ ] **Backend:** Set HttpOnly cookie trong auth callback response
  ```typescript
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  ```
- [ ] **Frontend:** Remove manual token storage
- [ ] **Axios:** Configure `withCredentials: true` để auto-send cookies
- [ ] **Testing:** E2E test với HttpOnly cookies

#### Phase 3: Token Refresh (Advanced)

- [ ] **Backend:** Implement refresh token mechanism
- [ ] **Frontend:** Auto-refresh trước khi token expire
- [ ] **Security:** Refresh token stored in HttpOnly cookie

**⏱️ Estimated Timeline:** 4-6 giờ (sau khi MVP stable)

**📌 Priority:** Medium (sau features F02-F05)
