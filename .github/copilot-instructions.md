# PaaS K3s Platform - Repository Instructions

## Project Overview

This is a PaaS (Platform as a Service) system for managing infrastructure and automating web application deployment on K3s Kubernetes cluster.

**Tech Stack:**

- Backend: NestJS + Prisma + PostgreSQL
- Frontend: Next.js 15 (App Router) + TailwindCSS + shadcn/ui
- Orchestration: K3s (Kubernetes)
- Ingress: Traefik (built-in K3s)
- Monitoring: Prometheus + Grafana

## Repository Structure

This is a "polyrepo in monorepo" structure - frontend and backend are completely independent:

```
paas-k3s/
├── frontend/          # Next.js - independent, has own package.json
├── backend/           # NestJS - independent, has own package.json
├── k8s/               # Kubernetes manifests
├── docs/              # Documentation
└── .github/           # CI/CD workflows
```

**Important:** Never import between frontend and backend. They communicate only via REST API.

## Git Conventions

### Branch Naming

```
feature/{feature-id}-{short-description}
fix/{issue-id}-{short-description}
refactor/{short-description}

Examples:
feature/F01-github-oauth
feature/F04-deploy-docker-image
fix/123-space-quota-validation
```

### Commit Messages

Follow Conventional Commits format:

```
{type}({scope}): {description}

Types: feat, fix, refactor, docs, test, chore
Scopes: backend, frontend, k8s, docs

Examples:
feat(backend): implement space creation with K8s namespace
fix(frontend): handle service status polling error
refactor(backend): extract K8s deployment builder
```

## Kubernetes Resource Conventions

### Naming Patterns

| Resource   | Pattern                      | Example                  |
| ---------- | ---------------------------- | ------------------------ |
| Namespace  | `space-{userId}-{spaceName}` | `space-usr123-myproject` |
| Deployment | `{serviceName}`              | `nginx-app`              |
| Service    | `{serviceName}`              | `nginx-app`              |
| Ingress    | `{serviceName}-ingress`      | `nginx-app-ingress`      |
| ConfigMap  | `{serviceName}-env`          | `nginx-app-env`          |
| Secret     | `{serviceName}-secret`       | `nginx-app-secret`       |

### Required Labels

All K8s resources created by the platform MUST include these labels:

```yaml
metadata:
  labels:
    app.kubernetes.io/name: { serviceName }
    app.kubernetes.io/managed-by: paas-k3s
    paas.io/owner: { userId }
    paas.io/type: space | project | service
    paas.io/space-id: { spaceId }
    paas.io/project-id: { projectId } # for project/service resources
    paas.io/service-id: { serviceId } # for service resources
```

### Selector Labels

For Deployment and Service selectors, use:

```yaml
selector:
  matchLabels:
    app: { serviceName }
```

## API Response Format

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

### Error Code Convention

Pattern: `{RESOURCE}_{REASON}` or `{RESOURCE}_{ACTION}_{REASON}`

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

## Feature Development Order

Follow the MVP features in order (F01 → F12). Each feature should be completed and tested before moving to the next:

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

## Code Quality Requirements

- All code must be written in TypeScript with strict mode
- No `any` type unless absolutely necessary (document why)
- All API endpoints must have input validation
- All database operations must handle errors properly
- K8s operations must have timeout and retry logic

## ONE Pattern for ALL Features

**Backend:** Module → Controller (HTTP only) → Service (Logic) → DTO (Validation)
**Frontend:** Service (API) → Hook (React Query) → Component (UI only)

See detailed patterns in:

- `.github/instructions/backend.instructions.md`
- `.github/instructions/frontend.instructions.md`
