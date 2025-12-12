---
phase: testing
title: Chiến lược Testing - Quản lý Space
description: Xác định phương pháp testing, test cases và đảm bảo chất lượng cho Quản lý Space
---

# Chiến lược Testing

## Môi trường Test

> **Important:** Tests chạy với `NODE_ENV=test`, sử dụng file `.env.test`
>
> ```bash
> # .env.test - không cần real K3s cluster
> DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paas_k3s_test"
> KUBECONFIG=""  # KubernetesService sẽ được mock
> ```

## Mục tiêu Coverage

**Mức độ testing chúng ta nhắm đến?**

| Layer             | Target Coverage | Scope                                |
| :---------------- | :-------------- | :----------------------------------- |
| SpacesService     | 100%            | Tất cả business logic                |
| SpacesController  | 100%            | Routing, validation, response format |
| KubernetesService | 90%+            | Mock K8s client, test error handling |
| DTOs              | 100%            | Validation rules                     |
| Utils (slug)      | 100%            | Edge cases                           |

## Unit Tests

### KubernetesService Tests

**File:** `backend/src/kubernetes/kubernetes.service.spec.ts`

- [ ] **Test case 1: createNamespace - success**

  - Given: Valid namespace name and labels
  - When: createNamespace() called
  - Then: K8s API called with correct manifest, log message printed

- [ ] **Test case 2: createNamespace - already exists**

  - Given: Namespace already exists (409 error)
  - When: createNamespace() called
  - Then: HttpError propagated

- [ ] **Test case 3: deleteNamespace - success**

  - Given: Existing namespace
  - When: deleteNamespace() called
  - Then: K8s API called, namespace deleted

- [ ] **Test case 4: deleteNamespace - not found**

  - Given: Non-existent namespace
  - When: deleteNamespace() called
  - Then: 404 error propagated

- [ ] **Test case 5: namespaceExists - returns true**

  - Given: Existing namespace
  - When: namespaceExists() called
  - Then: Returns true

- [ ] **Test case 6: namespaceExists - returns false**

  - Given: Non-existent namespace (404 error)
  - When: namespaceExists() called
  - Then: Returns false

- [ ] **Test case 7: createResourceQuota - success**

  - Given: Valid namespace and quota spec
  - When: createResourceQuota() called
  - Then: K8s API called with correct quota manifest

- [ ] **Test case 8: getResourceQuotaUsage - success**

  - Given: Namespace with ResourceQuota
  - When: getResourceQuotaUsage() called
  - Then: Returns parsed usage data

- [ ] **Test case 9: getResourceQuotaUsage - not found**

  - Given: Namespace without ResourceQuota
  - When: getResourceQuotaUsage() called
  - Then: Returns null

- [ ] **Test case 10: createLimitRange - success**
  - Given: Valid namespace and limit spec
  - When: createLimitRange() called
  - Then: K8s API called with correct LimitRange manifest

### SpacesService Tests

**File:** `backend/src/modules/spaces/spaces.service.spec.ts`

#### Create Space

- [ ] **Test case 1: create - success**

  - Given: Authenticated user with FREE tier, no spaces
  - When: create() called with valid name
  - Then: Space created in DB, K8s resources created, status ACTIVE

- [ ] **Test case 2: create - quota exceeded**

  - Given: User already has 3 spaces (FREE tier limit)
  - When: create() called
  - Then: BadRequestException with code SPACE_QUOTA_EXCEEDED

- [ ] **Test case 3: create - name already exists**

  - Given: Space with same slug already exists
  - When: create() called with same name
  - Then: ConflictException with code SPACE_ALREADY_EXISTS

- [ ] **Test case 4: create - K3s failure rollback**

  - Given: Valid input
  - When: K3s namespace creation fails
  - Then: Space status updated to ERROR, error message stored

- [ ] **Test case 5: create - PRO tier uses PRO quotas**
  - Given: User with PRO tier
  - When: create() called
  - Then: ResourceQuota uses PRO limits (2 CPU, 2Gi memory)

#### Find Spaces

- [ ] **Test case 6: findAll - returns user's spaces**

  - Given: User has 2 spaces
  - When: findAll() called
  - Then: Returns 2 spaces with projectCount

- [ ] **Test case 7: findAll - empty list**

  - Given: User has no spaces
  - When: findAll() called
  - Then: Returns empty array

- [ ] **Test case 8: findAll - does not include other user's spaces**
  - Given: User A has 1 space, User B has 2 spaces
  - When: findAll() called for User A
  - Then: Returns only 1 space (User A's)

#### Find One Space

- [ ] **Test case 9: findOne - success**

  - Given: Space exists and belongs to user
  - When: findOne() called
  - Then: Returns space with projects

- [ ] **Test case 10: findOne - not found**

  - Given: Space doesn't exist
  - When: findOne() called
  - Then: NotFoundException with code SPACE_NOT_FOUND

- [ ] **Test case 11: findOne - belongs to other user**
  - Given: Space exists but belongs to another user
  - When: findOne() called
  - Then: NotFoundException (authorization by exclusion)

#### Update Space

- [ ] **Test case 12: update - success**

  - Given: Existing space
  - When: update() called with new name
  - Then: Name updated in DB

- [ ] **Test case 13: update - not found**
  - Given: Space doesn't exist
  - When: update() called
  - Then: NotFoundException

#### Delete Space

- [ ] **Test case 14: remove - success**

  - Given: Empty space (no projects)
  - When: remove() called
  - Then: K3s namespace deleted, DB record deleted

- [ ] **Test case 15: remove - has projects**

  - Given: Space with 2 projects
  - When: remove() called
  - Then: ConflictException with code SPACE_DELETE_HAS_PROJECTS

- [ ] **Test case 16: remove - K3s failure**

  - Given: Valid space
  - When: K3s namespace deletion fails
  - Then: Space status updated to ERROR

- [ ] **Test case 17: remove - not found**
  - Given: Space doesn't exist
  - When: remove() called
  - Then: NotFoundException

#### Quota Usage

- [ ] **Test case 18: getQuotaUsage - success**

  - Given: Space with K3s ResourceQuota
  - When: getQuotaUsage() called
  - Then: Returns CPU, memory, storage usage

- [ ] **Test case 19: getQuotaUsage - no quota found**
  - Given: Space exists but K3s ResourceQuota missing
  - When: getQuotaUsage() called
  - Then: Returns null

### SpacesController Tests

**File:** `backend/src/modules/spaces/spaces.controller.spec.ts`

- [ ] **Test case 1: POST /spaces - success 201**

  - Given: Valid request body
  - When: POST /spaces
  - Then: Returns 201 with { data: space }

- [ ] **Test case 2: POST /spaces - validation error 400**

  - Given: Invalid name (uppercase letters)
  - When: POST /spaces
  - Then: Returns 400 with validation errors

- [ ] **Test case 3: GET /spaces - success 200**

  - Given: Authenticated user
  - When: GET /spaces
  - Then: Returns 200 with { data: [...], meta: {...} }

- [ ] **Test case 4: GET /spaces/:id - success 200**

  - Given: Valid space id
  - When: GET /spaces/:id
  - Then: Returns 200 with { data: space }

- [ ] **Test case 5: GET /spaces/:id - not found 404**

  - Given: Invalid space id
  - When: GET /spaces/:id
  - Then: Returns 404

- [ ] **Test case 6: PATCH /spaces/:id - success 200**

  - Given: Valid update body
  - When: PATCH /spaces/:id
  - Then: Returns 200 with updated space

- [ ] **Test case 7: DELETE /spaces/:id - success 204**

  - Given: Empty space
  - When: DELETE /spaces/:id
  - Then: Returns 204 No Content

- [ ] **Test case 8: DELETE /spaces/:id - conflict 409**

  - Given: Space with projects
  - When: DELETE /spaces/:id
  - Then: Returns 409 with SPACE_DELETE_HAS_PROJECTS

- [ ] **Test case 9: All endpoints - unauthorized 401**
  - Given: No JWT token
  - When: Any endpoint called
  - Then: Returns 401 Unauthorized

### DTO Validation Tests

**File:** `backend/src/modules/spaces/dto/create-space.dto.spec.ts`

- [ ] **Test case 1: Valid name - lowercase alphanumeric**

  - Input: "my-project-1"
  - Expected: Pass

- [ ] **Test case 2: Invalid name - uppercase**

  - Input: "MyProject"
  - Expected: Fail

- [ ] **Test case 3: Invalid name - starts with number**

  - Input: "1project"
  - Expected: Fail

- [ ] **Test case 4: Invalid name - special characters**

  - Input: "my_project"
  - Expected: Fail

- [ ] **Test case 5: Invalid name - too short**

  - Input: "ab"
  - Expected: Fail (min 3 chars)

- [ ] **Test case 6: Invalid name - too long**

  - Input: 51-char string
  - Expected: Fail (max 50 chars)

- [ ] **Test case 7: Optional description - valid**
  - Input: { name: "test", description: "My desc" }
  - Expected: Pass

### Slug Utility Tests

**File:** `backend/src/common/utils/slug.util.spec.ts`

- [ ] **Test case 1: Basic slug generation**

  - Input: userId="abc123def", name="my-project"
  - Expected: "space-abc123de-my-project"

- [ ] **Test case 2: Long name truncation**

  - Input: Very long name (>50 chars)
  - Expected: Slug <= 63 chars

- [ ] **Test case 3: Special characters sanitized**

  - Input: name="My Project!!!"
  - Expected: "space-xxx-my-project"

- [ ] **Test case 4: Multiple hyphens collapsed**

  - Input: name="my---project"
  - Expected: "space-xxx-my-project"

- [ ] **Test case 5: Trailing hyphen removed**
  - Input: name ending with hyphen
  - Expected: No trailing hyphen

## Integration Tests

**File:** `backend/test/spaces.e2e-spec.ts`

- [ ] **Integration test 1: Full create flow**

  - Given: Authenticated user, K3s cluster available
  - When: POST /spaces with valid data
  - Then: Space created in DB, Namespace exists in K3s, ResourceQuota applied

- [ ] **Integration test 2: Full delete flow**

  - Given: Existing empty space
  - When: DELETE /spaces/:id
  - Then: DB record deleted, K3s Namespace deleted

- [ ] **Integration test 3: Quota enforcement**
  - Given: Space with ResourceQuota in K3s
  - When: Create pod exceeding quota
  - Then: Pod rejected by K3s

## Test Data

### Fixtures

```typescript
// test/fixtures/spaces.fixtures.ts
export const mockUser = {
  id: "cuid123",
  email: "test@example.com",
  name: "Test User",
  githubId: "12345",
  tier: "FREE",
  role: "USER",
};

export const mockSpace = {
  id: "space123",
  name: "test-project",
  slug: "space-cuid123-test-project",
  description: "Test space",
  userId: "cuid123",
  cpuLimit: "500m",
  memoryLimit: "512Mi",
  storageLimit: "1Gi",
  status: "ACTIVE",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockK3sQuotaStatus = {
  hard: {
    "limits.cpu": "500m",
    "limits.memory": "512Mi",
    "requests.storage": "1Gi",
  },
  used: {
    "limits.cpu": "100m",
    "limits.memory": "128Mi",
    "requests.storage": "256Mi",
  },
};
```

````

### Mock Setup

```typescript
// Mock KubernetesService (K3s compatible)
const mockK8sService = {
  createNamespace: jest.fn().mockResolvedValue(undefined),
  deleteNamespace: jest.fn().mockResolvedValue(undefined),
  namespaceExists: jest.fn().mockResolvedValue(false),
  createResourceQuota: jest.fn().mockResolvedValue(undefined),
  getResourceQuotaUsage: jest.fn().mockResolvedValue(mockK3sQuotaStatus),
  createLimitRange: jest.fn().mockResolvedValue(undefined),
};

// Mock PrismaService
const mockPrismaService = {
  space: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};
```

## Manual Testing Checklist

### UI/UX Testing

- [ ] Spaces list page loads correctly
- [ ] Empty state displayed when no spaces
- [ ] Create Space dialog opens and closes properly
- [ ] Form validation shows inline errors
- [ ] Loading states displayed during API calls
- [ ] Success toast shown after create/delete
- [ ] Error toast shown with meaningful message on failure
- [ ] Quota progress bars show correct percentages
- [ ] Space card hover effects work
- [ ] Delete confirmation dialog works
- [ ] Responsive layout on mobile

### Accessibility

- [ ] All interactive elements keyboard navigable
- [ ] Focus states visible
- [ ] ARIA labels on icons and buttons
- [ ] Color contrast meets WCAG AA

## Performance Testing

### Load Testing Scenarios

- [ ] 100 concurrent users listing spaces
- [ ] 10 concurrent space creations
- [ ] API response times < 500ms for list/detail
- [ ] API response times < 2s for create (includes K3s calls)

## Bug Tracking

### Issue Labels

- `bug/spaces-backend` - Backend bugs
- `bug/spaces-frontend` - Frontend bugs
- `bug/spaces-k3s` - K3s integration bugs

### Severity Levels

- **P0 Critical:** Space creation fails, data loss
- **P1 High:** Cannot delete space, quota not enforced
- **P2 Medium:** UI glitches, slow responses
- **P3 Low:** Minor visual issues

## Test Commands

```bash
# Run all Spaces tests
cd backend
pnpm test -- --testPathPattern=spaces

# Run with coverage
pnpm test -- --testPathPattern=spaces --coverage

# Run specific test file
pnpm test -- spaces.service.spec.ts

# Run E2E tests (requires K3s cluster)
pnpm test:e2e -- --testPathPattern=spaces
```

## Definition of Done (Testing)

Feature testing được coi là hoàn thành khi:

- [ ] Tất cả unit tests pass
- [ ] Coverage >= 95% cho service layer
- [ ] Coverage >= 90% cho controller layer
- [ ] Integration tests pass (với real K3s cluster hoặc k3d)
- [ ] Manual testing checklist completed
- [ ] No P0/P1 bugs open
- [ ] Performance benchmarks met

```

```
````
