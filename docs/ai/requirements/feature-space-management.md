---
phase: requirements
title: Yêu cầu & Hiểu vấn đề - Quản lý Space
description: Làm rõ không gian vấn đề, thu thập yêu cầu và xác định tiêu chí thành công cho Quản lý Space
---

# Yêu cầu & Hiểu vấn đề

## Tuyên bố vấn đề

**Chúng ta đang giải quyết vấn đề gì?**

- **Vấn đề cốt lõi:** Người dùng cần workspace riêng để tổ chức các dự án (projects) của mình. Hiện tại không có cơ chế để phân chia và cô lập tài nguyên giữa các người dùng khác nhau.
- **Người dùng bị ảnh hưởng:** User (người dùng cá nhân), Team Admin (quản lý nhóm).
- **Tình trạng hiện tại:** Sau khi đăng nhập (F01), người dùng chưa có nơi để tạo và quản lý projects.

## Mục tiêu & Mục đích

**Chúng ta muốn đạt được điều gì?**

- **Mục tiêu chính:**
  - Cho phép người dùng tạo Space làm workspace riêng.
  - Tự động tạo K3s Namespace tương ứng khi tạo Space.
  - Áp dụng ResourceQuota theo tier người dùng (K3s hỗ trợ đầy đủ ResourceQuota như K8s standard).
  - Cho phép xem, đổi tên và xóa Space.
  - Hiển thị thông tin quota sử dụng.
- **Không phải mục tiêu:**
  - Chia sẻ Space giữa nhiều người dùng (sẽ làm ở feature sau).
  - Team/Organization management (out of scope cho MVP).
  - Billing/Payment integration.

## User Stories & Use Cases

**Người dùng sẽ tương tác với giải pháp như thế nào?**

- **US-01: Tạo Space**
  - Là một **User đã đăng nhập**, tôi muốn tạo một Space mới (nhập tên, chọn tier miễn phí) để tôi có workspace cho các projects của mình.
- **US-02: Xem danh sách Spaces**
  - Là một **User**, tôi muốn xem danh sách tất cả Spaces của mình (tên, ngày tạo, số projects) để tôi có thể quản lý chúng.
- **US-03: Vào Space**
  - Là một **User**, tôi muốn click vào một Space để xem chi tiết và danh sách Projects bên trong.
- **US-04: Đổi tên Space**
  - Là một **User**, tôi muốn có thể đổi tên Space để cập nhật khi mục đích sử dụng thay đổi.
- **US-05: Xóa Space**
  - Là một **User**, tôi muốn xóa Space (chỉ khi trống, không có projects) để dọn dẹp workspace không còn sử dụng.
- **US-06: Xem Quota**
  - Là một **User**, tôi muốn xem tổng quan quota (số CPU, RAM, storage đã dùng/giới hạn) để tôi biết còn bao nhiêu tài nguyên có thể sử dụng.

## Tiêu chí thành công

**Làm sao chúng ta biết khi nào đã hoàn thành?**

- [ ] **Tạo Space:** Khi tạo Space, K3s Namespace được tự động tạo với naming convention `space-{userId}-{spaceName}`.
- [ ] **ResourceQuota:** ResourceQuota được tự động áp dụng theo tier của user (Free tier: 500m CPU, 512Mi RAM, 1Gi storage).
- [ ] **Xóa Space:** Chỉ cho phép xóa khi Space không có projects, đồng thời xóa K3s Namespace tương ứng.
- [ ] **UI:** Giao diện hiển thị danh sách Spaces với thông tin quota usage (progress bar hoặc số liệu).
- [ ] **Validation:** Tên Space phải unique per user, chỉ chứa lowercase letters, numbers, hyphens.
- [ ] **Error Handling:** Thông báo lỗi rõ ràng khi tạo thất bại hoặc xóa Space còn projects.

## Ràng buộc & Giả định

**Chúng ta cần làm việc trong những giới hạn nào?**

- **Ràng buộc kỹ thuật:**
  - **1 Space = 1 K3s Namespace** để đảm bảo isolation.
  - Naming convention: `space-{userId}-{spaceName}` (lowercase, max 63 chars theo Kubernetes limit).
  - Backend phải dùng `@kubernetes/client-node` để tương tác với K3s cluster (K3s tuân thủ Kubernetes API chuẩn).
  - Cần xử lý trường hợp K3s Namespace creation/deletion thất bại.
- **Ràng buộc Business:**
  - Free tier quota: 500m CPU, 512Mi RAM, 1Gi storage.
  - Mỗi user có thể tạo tối đa 3 Spaces (Free tier).
- **Giả định:**
  - User đã đăng nhập và có JWT token hợp lệ (F01 đã hoàn thành).
  - K3s cluster đã được setup và KUBECONFIG đã được cấu hình.
  - User mặc định là Free tier (chưa có billing system).
  - **Environment files:** Project sử dụng `.env.development`, `.env.production`, `.env.test` cho các môi trường khác nhau.

## Mối quan hệ với các tính năng khác

**Phụ thuộc (Dependencies):**

| Feature                   | Trạng thái    | Mô tả                                    |
| :------------------------ | :------------ | :--------------------------------------- |
| F01 - User Authentication | ✅ Hoàn thành | User phải đăng nhập để tạo/quản lý Space |

**Ảnh hưởng đến (Impacts):**

| Feature                   | Mô tả                                                 |
| :------------------------ | :---------------------------------------------------- |
| F03 - Project Management  | Projects sẽ được tạo bên trong Space                  |
| F04 - Deploy Docker Image | Services sẽ được deploy trong K3s Namespace của Space |

## Câu hỏi & Các mục mở

**Chúng ta vẫn cần làm rõ điều gì?**

- [x] **Naming convention:** Đã xác định - `space-{userId}-{spaceName}`
- [x] **Free tier quota:** Đã xác định - 500m CPU, 512Mi RAM, 1Gi storage
- [ ] **Soft delete vs Hard delete:** Có nên giữ lại metadata của Space đã xóa không? → Đề xuất: Hard delete cho MVP.
- [ ] **Namespace cleanup:** Nếu xóa Space nhưng K3s Namespace deletion thất bại, xử lý như thế nào? → Đề xuất: Mark as "pending-deletion" và retry.

## Ước tính thời gian

| Giai đoạn       | Thời gian ước tính |
| :-------------- | :----------------- |
| Backend API     | 3-4 giờ            |
| K3s Integration | 2-3 giờ            |
| Frontend UI     | 2-3 giờ            |
| Testing         | 1-2 giờ            |
| **Tổng**        | **8-12 giờ**       |

```

```
