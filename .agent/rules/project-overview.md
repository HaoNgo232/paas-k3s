# PaaS K3s Platform - Tổng Quan Dự Án

## Giới Thiệu Dự Án

Đây là hệ thống PaaS (Platform as a Service) để quản lý hạ tầng và tự động hóa triển khai ứng dụng web trên K3s Kubernetes cluster.

**Tech Stack:**

- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 15 (App Router) + TailwindCSS + shadcn/ui
- Orchestration: K3s (Kubernetes)
- Ingress: Traefik (built-in K3s)
- Monitoring: Prometheus + Grafana

## Cấu Trúc Repository

Đây là cấu trúc "polyrepo in monorepo" - frontend và backend hoàn toàn độc lập:

```
paas-k3s/
├── frontend/          # Next.js - độc lập, có package.json riêng
├── backend/           # NestJS - độc lập, có package.json riêng
├── k8s/               # Kubernetes manifests
├── docs/              # Documentation
└── .github/           # CI/CD workflows
```

**Quan trọng:** Không bao giờ import giữa frontend và backend. Chúng chỉ giao tiếp qua REST API.

## Quy Ước Git

### Đặt Tên Branch

```
feature/{feature-id}-{short-description}
fix/{issue-id}-{short-description}
refactor/{short-description}

Ví dụ:
feature/F01-github-oauth
feature/F04-deploy-docker-image
fix/123-space-quota-validation
```

### Commit Messages

Tuân theo format Conventional Commits:

```
{type}({scope}): {description}

Types: feat, fix, refactor, docs, test, chore
Scopes: backend, frontend, k8s, docs

Ví dụ:
feat(backend): implement space creation with K8s namespace
fix(frontend): handle service status polling error
refactor(backend): extract K8s deployment builder
```

## Quy Ước Kubernetes Resources

### Naming Patterns

| Resource   | Pattern                      | Ví dụ                    |
| ---------- | ---------------------------- | ------------------------ |
| Namespace  | \`space-{userId}-{spaceName}\` | \`space-usr123-myproject\` |
| Deployment | \`{serviceName}\`              | \`nginx-app\`              |
| Service    | \`{serviceName}\`              | \`nginx-app\`              |
| Ingress    | \`{serviceName}-ingress\`      | \`nginx-app-ingress\`      |
| ConfigMap  | \`{serviceName}-env\`          | \`nginx-app-env\`          |
| Secret     | \`{serviceName}-secret\`       | \`nginx-app-secret\`       |

### Required Labels

Tất cả K8s resources được tạo bởi platform PHẢI có các labels này:

```yaml
metadata:
  labels:
    app.kubernetes.io/name: { serviceName }
    app.kubernetes.io/managed-by: paas-k3s
    paas.io/owner: { userId }
    paas.io/type: space | project | service
    paas.io/space-id: { spaceId }
    paas.io/project-id: { projectId } # cho project/service resources
    paas.io/service-id: { serviceId } # cho service resources
```

### Selector Labels

Cho Deployment và Service selectors, sử dụng:

```yaml
selector:
  matchLabels:
    app: { serviceName }
```

## Format API Response

### Success Response

```typescript
// Single resource
{
  data: T,
  message?: string
}

// List resources
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number
  }
}
```

### Error Response

```typescript
{
  statusCode: number,      // HTTP status code
  error: string,           // HTTP error name (Bad Request, Not Found, etc.)
  message: string,         // Human-readable message
  code: string,            // Application error code
  details?: object         // Optional additional context
}
```

### Quy Ước Error Code

Pattern: \`{RESOURCE}_{REASON}\` hoặc \`{RESOURCE}_{ACTION}_{REASON}\`

```typescript
// Authentication & Authorization
AUTH_UNAUTHORIZED;
AUTH_TOKEN_EXPIRED;
AUTH_GITHUB_OAUTH_FAILED;

// User
USER_NOT_FOUND;
USER_DISABLED;

// Space
SPACE_NOT_FOUND;
SPACE_ALREADY_EXISTS;
SPACE_QUOTA_EXCEEDED;
SPACE_DELETE_HAS_PROJECTS;

// Project
PROJECT_NOT_FOUND;
PROJECT_ALREADY_EXISTS;
PROJECT_DELETE_HAS_SERVICES;

// Service
SERVICE_NOT_FOUND;
SERVICE_ALREADY_EXISTS;
SERVICE_DEPLOY_FAILED;
SERVICE_DEPLOY_IMAGE_PULL_FAILED;
SERVICE_DEPLOY_QUOTA_EXCEEDED;
SERVICE_RESTART_FAILED;
SERVICE_SCALE_FAILED;
SERVICE_DELETE_FAILED;

// Domain
DOMAIN_NOT_FOUND;
DOMAIN_ALREADY_EXISTS;
DOMAIN_VERIFICATION_FAILED;

// Kubernetes
K8S_NAMESPACE_CREATE_FAILED;
K8S_DEPLOYMENT_CREATE_FAILED;
K8S_CONNECTION_FAILED;
```

## Environment Variables

### Backend (.env)

```env
# Required
DATABASE_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JWT_SECRET=
KUBECONFIG=

# Optional with defaults
NODE_ENV=development
PORT=3001
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
# Required
NEXT_PUBLIC_API_URL=
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional
NEXTAUTH_URL=http://localhost:3000
```

## Thứ Tự Phát Triển Features

Tuân theo các MVP features theo thứ tự (F01 → F12). Mỗi feature phải hoàn thành và test trước khi chuyển sang feature tiếp theo:

1. F01: user-authentication (GitHub OAuth)
2. F02: space-management
3. F03: project-management
4. F04: deploy-docker-image
5. F05: service-status-view
6. F06: service-environment-variables
7. F07: service-logs-viewer
8. F08: service-metrics-dashboard
9. F09: service-restart-delete
10. F10: manual-scaling
11. F11: platform-dashboard
12. F12: user-management-admin

## Yêu Cầu Code Quality

- Tất cả code phải được viết bằng TypeScript với strict mode
- Không dùng \`any\` type trừ khi thực sự cần thiết (phải document lý do)
- Tất cả API endpoints phải có input validation
- Tất cả database operations phải handle errors đúng cách
- K8s operations phải có timeout và retry logic

## MỘT Pattern cho TẤT CẢ Features

**Backend:** Module → Controller (HTTP only) → Service (Logic) → DTO (Validation)
**Frontend:** Service (API) → Hook (React Query) → Component (UI only)

Xem chi tiết patterns trong:

- \`.agent/rules/backend-pattern.md\`
- \`.agent/rules/frontend-pattern.md\`
