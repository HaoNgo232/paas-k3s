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

## [0.1.0] - 2025-12-10

### 🎉 Initial Release - Project Scaffolding

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
