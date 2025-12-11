# Cursor Rules - PaaS K3s Platform

Thư mục này chứa các quy tắc cho Cursor AI khi làm việc với dự án PaaS K3s.

## Danh Sách Rules

### 1. project-overview.mdc
**Metadata:** `alwaysApply: true`

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

**Áp dụng:** Luôn luôn (alwaysApply)

### 2. backend-pattern.mdc
**Metadata:** `globs: ["backend/**"]`

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

**Áp dụng:** Chỉ cho files trong `backend/**`

### 3. frontend-pattern.mdc
**Metadata:** `globs: ["frontend/**"]`

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

**Áp dụng:** Chỉ cho files trong `frontend/**`

## Format File .mdc

Cursor sử dụng format `.mdc` (Markdown with Cursor metadata) với YAML frontmatter:

```markdown
---
alwaysApply: true  # Áp dụng cho tất cả files
# hoặc
globs: ["backend/**"]  # Áp dụng cho files match pattern
---

# Nội dung rule ở đây
```

## Nguồn Gốc

Các rules này được tạo từ các file trong thư mục `.github/`:

- `project-overview.mdc` ← `.github/copilot-instructions.md`
- `backend-pattern.mdc` ← `.github/instructions/backend.instructions.md`
- `frontend-pattern.mdc` ← `.github/instructions/frontend.instructions.md`

## Cách Cursor Sử Dụng

Cursor AI sẽ tự động:

1. **Đọc rules** khi mở project
2. **Áp dụng rules** dựa trên:
   - `alwaysApply: true` → Luôn áp dụng
   - `globs: ["pattern"]` → Áp dụng khi file match pattern
3. **Suggest code** theo patterns đã định nghĩa
4. **Review code** theo checklist trong rules
5. **Generate code** tuân theo conventions

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

## So Sánh với .agent/rules

| Aspect | .cursor/rules | .agent/rules |
|--------|---------------|--------------|
| Format | `.mdc` (Cursor-specific) | `.md` (Standard Markdown) |
| Metadata | YAML frontmatter với `alwaysApply`, `globs` | Chỉ có frontmatter `applyTo` |
| Target | Cursor AI | Generic AI assistants |
| Nội dung | Giống nhau | Giống nhau |

## Cập Nhật

Khi có thay đổi trong `.github/instructions/`, cần cập nhật lại các rules tương ứng:

```bash
# Xem thay đổi
git diff .github/instructions/

# Sync rules (manual hoặc dùng script)
# Cập nhật .cursor/rules/*.mdc
# Cập nhật .agent/rules/*.md
```

## Debug Rules

Để kiểm tra xem Cursor có đọc rules không:

1. Mở Cursor Settings → Rules
2. Kiểm tra danh sách rules được load
3. Xem preview của từng rule
4. Test bằng cách tạo file mới và xem suggestions

## Liên Hệ

Nếu có thắc mắc hoặc đề xuất cải thiện rules, vui lòng tạo issue hoặc PR.
