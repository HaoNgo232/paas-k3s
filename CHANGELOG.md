# Changelog

Tất cả thay đổi đáng chú ý của dự án **PaaS K3s** sẽ được ghi lại trong file này.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án tuân theo [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Frontend Structure**: Refactored to Feature-based Architecture.
  - Moved `app` and `lib` to `src/`.
  - Created standard folders: `features/`, `components/` (ui, layout, common), `hooks/`, `types/`, `styles/`.
  - Updated `tsconfig.json` and `components.json` aliases.

### Added

- **Development Instructions**:
  - Added comprehensive GitHub Copilot instructions (`.github/copilot-instructions.md`).
  - Added Backend-specific instructions with NestJS patterns (`.github/instructions/backend.instructions.md`).
  - Added Frontend-specific instructions with Next.js patterns (`.github/instructions/frontend.instructions.md`).
- **Containerization**:
  - Added `Dockerfile` for Backend (NestJS optimized build).
  - Added `Dockerfile` for Frontend (Next.js standalone build).
- **CI/CD**:
  - Added GitHub Actions workflows: `frontend.yml` and `backend.yml`.
- **Kubernetes Manifests**:
  - Created `k8s/` directory.
  - Added `namespace.yaml`, `frontend.yaml`, `backend.yaml`, `ingress.yaml`, `secrets.yaml.example`.
- **Local Development**:
  - Added `docker-compose.yml` for PostgreSQL.
  - Added `.env.example` for both Frontend and Backend.
- **License**: Added MIT License.

---

## [0.3.0] - 2025-12-11

### Added

- **Backend Authentication (F01)**:
  - Implemented `AuthModule` with `passport-github2` and `jose` (JWT).
  - Added `GithubStrategy` for OAuth flow.
  - Added `JwtAuthGuard` for stateless authentication.
  - Added `AuthService` and `AuthController` with endpoints: `/auth/github`, `/callback`, `/me`.
  - Implemented **Secure by Default** DTOs using `class-transformer` (`@Exclude`/`@Expose`).
- **Frontend Authentication**:
  - Added `AuthProvider` context and `useAuth` hook.
- **Infrastructure**:
  - Added `module-alias` configuration for production builds.
  - Configured `ConfigModule` with `expandVariables: true` for nested env vars.

### Changed

- **Architecture**:
  - Refactored `User` interface to use **Facade Pattern** (re-exporting from `@prisma/client`).
  - Standardized `PrismaService` to use default `prisma-client-js` provider in `node_modules`.
  - Updated `tsconfig.json` to include `test` folder and optimize paths.

## [0.2.1] - 2025-12-11

### 🔧 Cấu hình VS Code & TypeScript Path Aliases Optimization

#### Added

- **VS Code Settings** (`.vscode/settings.json`):
  - Cấu hình để ép buộc VS Code ưu tiên absolute imports (non-relative)
  - Tự động gợi ý path sử dụng aliases thay vì relative paths
  - Áp dụng cho cả TypeScript và JavaScript

#### Changed

- **TypeScript Configuration** (`backend/tsconfig.json`):
  - Thay đổi `baseUrl` từ `./src` sang `./` để giúp VS Code hiểu rõ cấu trúc dự án
  - Cập nhật tất cả paths mappings để rõ ràng tham chiếu từ root: `@/*: ["src/*"]`
  - Cải thiện autocomplete cho path aliases trong VS Code

#### Notes

- Sau khi cập nhật, cần restart TypeScript Server trong VS Code (Ctrl+Shift+P > TypeScript: Restart TS Server)
- VS Code sẽ tự động gợi ý sử dụng `@modules/auth/...` thay vì `../../modules/auth/...`
- Cấu hình hoạt động cho development, production, và testing environments

---

## [0.2.0] - 2025-12-11

### 🏗️ Cải thiện Cấu trúc Dự án & Cấu hình

#### Added

**Cấu hình & Cấu trúc Backend**

- **Tái cấu trúc ConfigModule**:

  - Triển khai pattern namespaced configuration sử dụng `@nestjs/config`
  - Tạo file config riêng biệt cho từng domain: `app.config.ts`, `auth.config.ts`, `database.config.ts`, `kubernetes.config.ts`
  - Thêm validation schema tập trung (`validation.schema.ts`) sử dụng Joi
  - Triển khai config index (`config/index.ts`) để dễ quản lý

- **Scaffolding Cấu trúc Dự án**:

  - Tạo cấu trúc module hoàn chỉnh cho tất cả tính năng:
    - `modules/auth/` - xác thực với strategies, guards, DTOs
    - `modules/users/` - quản lý người dùng
    - `modules/spaces/` - quản lý space với DTOs
    - `modules/projects/` - quản lý dự án
    - `modules/services/` - quản lý K8s service với nhiều DTOs
    - `modules/deployments/`, `domains/`, `monitoring/`, `admin/`
  - Tạo thư mục `kubernetes/` với builders (deployment, service, ingress) và watchers (pod)
  - Tạo thư mục `common/` với các tiện ích chia sẻ:
    - `decorators/` - roles và user decorators
    - `filters/`, `interceptors/`, `pipes/` - NestJS utilities
    - `utils/` - slug utility functions

- **Cấu hình Absolute Path**:

  - Cấu hình TypeScript path aliases trong `tsconfig.json` với baseUrl và paths mappings
  - Triển khai module-alias để phân giải đường dẫn khi chạy production
  - Cập nhật `package.json` với cấu hình `_moduleAliases`
  - Thêm Jest moduleNameMapper cho môi trường test
  - Tất cả aliases đã cấu hình: `@/*`, `@config/*`, `@modules/*`, `@common/*`, `@kubernetes/*`, `@prisma/*`

- **Dependencies đã thêm**:

  - `@nestjs/config@^4.0.2` - quản lý cấu hình
  - `joi@^18.0.2` - validation biến môi trường
  - `module-alias@^2.2.3` - phân giải path alias cho production
  - `cross-env@^10.1.0` - xử lý biến môi trường đa nền tảng
  - `@types/module-alias@^2.0.4` - định nghĩa kiểu TypeScript

- **Tài liệu & Ví dụ**:
  - Thêm tài liệu AI-driven cho tính năng xác thực người dùng trong `docs/ai/`:
    - `requirements/feature-user-authentication.md`
    - `design/feature-user-authentication.md`
    - `planning/feature-user-authentication.md`
    - `implementation/feature-user-authentication.md`
    - `testing/feature-user-authentication.md`

#### Changed

- **AppModule**:

  - Tái cấu trúc để sử dụng ConfigModule với namespaced configs
  - Tích hợp validation schema cho biến môi trường
  - Thêm hỗ trợ cache và variable expansion
  - Cập nhật imports để sử dụng absolute paths

- **AppService**:

  - Cập nhật để minh họa namespace-based config injection
  - Thêm truy cập config type-safe sử dụng ConfigType

- **main.ts**:

  - Thêm khởi tạo module-alias cho môi trường production
  - Cập nhật imports để sử dụng absolute paths

- **Environment Scripts**:
  - Cập nhật npm scripts sử dụng cross-env để xử lý biến môi trường nhất quán trên các nền tảng
  - Scripts: `start:dev`, `start:debug`, `start:prod`, `test`, `test:watch`, `test:cov`, `test:debug`, `test:e2e`

---

## [0.1.0] - 2025-12-10

### Initial Release - Project Scaffolding

#### Added

**Frontend (Next.js 15.5.7)**

- Khởi tạo Next.js với App Router
- React 19 + TypeScript
- Tailwind CSS 4 configuration
- shadcn/ui components integration (base color: Zinc)
- ESLint configuration

**Backend (NestJS)**

- Khởi tạo NestJS project
- TypeScript configuration
- ESLint + Prettier setup
- Jest testing framework

**Documentation & AI Workflows**

- AI DevKit integration với structured workflows
- Prompts cho các IDE: VS Code, Cursor
- Workflows: code-review, debug, execute-plan, new-requirement, etc.
- UI/UX Pro Max utilities (colors, typography, styles data)

**Infrastructure**

- K3s cluster ready (master: 192.168.1.10, worker: 192.168.1.11)
- RBAC ServiceAccount `paas-backend` configured
- Prometheus + Grafana monitoring stack

### Commits

| Hash      | Message                                                                    | Date       |
| --------- | -------------------------------------------------------------------------- | ---------- |
| `ea5a4dd` | Add UI/UX Pro Max core functionality and search capabilities               | 2025-12-10 |
| `9c8f196` | feat: Add structured documentation and prompts for AI-assisted development | 2025-12-10 |
| `eb3dd3e` | init project                                                               | 2025-12-10 |

---

## Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Setup Prisma + PostgreSQL
- [ ] Docker Compose for local dev
- [ ] F01: GitHub OAuth authentication

### Phase 2: Core Resources (Week 2)

- [ ] F02: Space CRUD + K8s namespace
- [ ] F03: Project CRUD
- [ ] Basic UI layout (Dashboard shell)

### Phase 3: Deployment (Week 3-4)

- [ ] F04: Service CRUD + K8s deployment
- [ ] F05: Service status display
- [ ] F06: Environment variables management
- [ ] F09: Restart/Stop/Delete service

### Phase 4: Monitoring (Week 5)

- [ ] F07: Logs viewer (real-time WebSocket)
- [ ] F08: Metrics dashboard
- [ ] F10: Manual scaling

### Phase 5: Admin & Polish (Week 6)

- [ ] F11: Platform admin dashboard
- [ ] F12: User management
- [ ] Testing & bug fixes
- [ ] Documentation

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui |
| Backend        | NestJS, Prisma, PostgreSQL                      |
| Infrastructure | K3s, Traefik, Prometheus, Grafana               |
| CI/CD          | GitHub Actions                                  |
| Auth           | GitHub OAuth                                    |

---

## Links

- **Repository:** [github.com/HaoNgo232/paas-k3s](https://github.com/HaoNgo232/paas-k3s)
- **K3s Cluster:** 192.168.1.10 (master), 192.168.1.11 (worker)
