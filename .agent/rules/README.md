# Agent Rules - PaaS K3s Platform

Thư mục này chứa các quy tắc và hướng dẫn cho AI coding assistants khi làm việc với dự án PaaS K3s.

## Danh Sách Rules

### 1. project-overview.md
**Mục đích:** Tổng quan về dự án, tech stack, và các quy ước chung

**Nội dung chính:**
- Tech stack và kiến trúc hệ thống
- Cấu trúc repository (polyrepo in monorepo)
- Quy ước Git (branch naming, commit messages)
- Quy ước Kubernetes resources (naming, labels, selectors)
- Format API response (success/error)
- Error code conventions
- Environment variables
- Thứ tự phát triển features (F01-F12)
- Yêu cầu code quality

**Áp dụng cho:** Toàn bộ dự án

### 2. backend-pattern.md
**Mục đích:** Pattern và best practices cho backend (NestJS)

**Nội dung chính:**
- Cấu trúc module/controller/service/dto
- Controller pattern (HTTP only, no business logic)
- Service pattern (business logic, validation, K8s integration)
- DTO pattern (class-validator)
- Custom exceptions
- Kubernetes integration
- Path aliases (absolute paths với `@/*`)
- Type guard pattern (runtime validation cho external data)
- Checklist khi tạo feature mới

**Áp dụng cho:** `backend/**`

### 3. frontend-pattern.md
**Mục đích:** Pattern và best practices cho frontend (Next.js 15)

**Nội dung chính:**
- Cấu trúc 3 layers: Service → Hook → Component
- Service layer (Class pattern với DI)
- Hook layer (React Query)
- Store layer (Zustand cho UI state)
- Component layer (Container vs Presentational)
- Constants layer (centralize hardcoded values)
- Path aliases (absolute paths với `@/*`)
- Type guard pattern (runtime validation cho API response)
- Form handling pattern (react-hook-form + zod)
- Data flow (React Query cho server data, Zustand cho UI state)
- Checklist khi tạo feature mới

**Áp dụng cho:** `frontend/**`

## Nguồn Gốc

Các rules này được tạo từ các file trong thư mục `.github/`:

- `project-overview.md` ← `.github/copilot-instructions.md`
- `backend-pattern.md` ← `.github/instructions/backend.instructions.md`
- `frontend-pattern.md` ← `.github/instructions/frontend.instructions.md`

## Cách Sử Dụng

Các AI coding assistants (như GitHub Copilot, Cursor, v.v.) sẽ tự động đọc và áp dụng các rules này khi:

1. Tạo feature mới
2. Refactor code
3. Review code
4. Suggest improvements
5. Generate code snippets

## Nguyên Tắc Chung

### SOLID Principles
- **S**ingle Responsibility: Mỗi class/function chỉ làm một việc
- **O**pen/Closed: Mở cho mở rộng, đóng cho sửa đổi
- **L**iskov Substitution: Subclass có thể thay thế base class
- **I**nterface Segregation: Nhiều interface nhỏ hơn một interface lớn
- **D**ependency Inversion: Phụ thuộc vào abstraction, không phụ thuộc vào implementation

### Clean Architecture
- Tách biệt concerns (HTTP, Business Logic, Data Access)
- Dependency Injection
- Type safety (TypeScript strict mode)
- Runtime validation (Type Guards)
- Error handling rõ ràng

### Best Practices
- **Absolute paths**: Luôn dùng `@/*` thay vì relative paths
- **Type Guards**: Validate external data (API, JWT, user input)
- **No `any` type**: Trừ khi thực sự cần thiết và có document
- **Custom exceptions**: Không dùng generic Error
- **Consistent naming**: Semantic, self-explanatory
- **DRY**: Don't Repeat Yourself
- **Testing**: Unit tests cho critical business logic

## Cập Nhật

Khi có thay đổi trong `.github/instructions/`, cần cập nhật lại các rules tương ứng trong thư mục này.

**Lệnh tạo lại rules:**
```bash
# Xem nội dung .github/instructions/
ls -la .github/instructions/

# Copy và convert sang .agent/rules/
# (hoặc dùng AI assistant để tự động sync)
```

## Liên Hệ

Nếu có thắc mắc hoặc đề xuất cải thiện rules, vui lòng tạo issue hoặc PR.
