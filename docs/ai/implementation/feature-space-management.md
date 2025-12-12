---
phase: implementation
title: Hướng dẫn Triển khai - Quản lý Space
description: Chi tiết kỹ thuật triển khai, patterns và code guidelines cho Quản lý Space
---

# Hướng dẫn Triển khai

## Thiết lập Môi trường

### Prerequisites

- Node.js 18+
- **K3s cluster running** (local hoặc remote) - Lightweight Kubernetes distribution
- kubectl configured (hoặc sử dụng k3s kubectl built-in)
- PostgreSQL database

### Environment Variables

Project sử dụng **3 môi trường** với các file `.env` riêng biệt:

| Môi trường  | File               | Mô tả                        |
| :---------- | :----------------- | :--------------------------- |
| Development | `.env.development` | Local development (mặc định) |
| Production  | `.env.production`  | Triển khai production        |
| Test        | `.env.test`        | Chạy tests                   |

> **Logic load env:** `NODE_ENV` quyết định file nào được load. Xem [app.module.ts](../../backend/src/app.module.ts#L15)
>
> ```typescript
> envFilePath: ENV ? `.env.${ENV}` : ".env.development";
> ```

#### Backend `.env.development` (thêm biến K3s)

```env
# === Existing variables ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paas_k3s_dev"
# ... other vars

# === NEW: Kubernetes/K3s ===
KUBECONFIG="/etc/rancher/k3s/k3s.yaml"
```

````

#### Backend `.env.production` (K3s production cluster)

```env
# === Existing variables ===
DATABASE_URL="postgresql://user:pass@db-host:5432/paas_k3s"
# ... other vars

# === NEW: Kubernetes/K3s ===
# Option 1: In-cluster (khi backend chạy trong K3s pod)
# Không cần set KUBECONFIG, client tự detect

# Option 2: External cluster
KUBECONFIG="/path/to/production-kubeconfig"
```

#### Backend `.env.test` (Mock K3s)

```env
# === Existing variables ===
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paas_k3s_test"
# ... other vars

# === NEW: Kubernetes/K3s ===
# Test environment không cần real cluster - sử dụng mocked KubernetesService
KUBECONFIG=""
```

### Dependencies

```bash
# Backend
cd backend
pnpm add @kubernetes/client-node
```

## Cấu trúc Code

### Backend Structure

```
backend/src/
├── kubernetes/
│   ├── kubernetes.module.ts      # Global module, import 1 lần ở AppModule
│   ├── kubernetes.service.ts     # Core K8s client wrapper
│   ├── builders/
│   │   ├── namespace.builder.ts
│   │   ├── resource-quota.builder.ts
│   │   └── limit-range.builder.ts
│   └── interfaces/
│       └── k8s-resource.interface.ts
├── modules/spaces/
│   ├── spaces.module.ts
│   ├── spaces.controller.ts
│   ├── spaces.service.ts
│   ├── dto/
│   │   ├── create-space.dto.ts
│   │   ├── update-space.dto.ts
│   │   └── index.ts
│   └── interfaces/
│       └── space-quota.interface.ts
├── config/
│   └── tier-quotas.config.ts     # Quota definitions per tier
```

## Chi tiết Triển khai

### 1. KubernetesModule (Global)

```typescript
// backend/src/kubernetes/kubernetes.module.ts
import { Global, Module } from "@nestjs/common";
import { KubernetesService } from "./kubernetes.service";

@Global()
@Module({
  providers: [KubernetesService],
  exports: [KubernetesService],
})
export class KubernetesModule {}
```

### 2. KubernetesService

> **Note:** K3s sử dụng Kubernetes API chuẩn 100%, nên `@kubernetes/client-node` hoạt động bình thường.

```typescript
// backend/src/kubernetes/kubernetes.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as k8s from "@kubernetes/client-node";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class KubernetesService implements OnModuleInit {
  private readonly logger = new Logger(KubernetesService.name);
  private coreApi: k8s.CoreV1Api;
  private kc: k8s.KubeConfig;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.kc = new k8s.KubeConfig();

    const kubeconfig = this.configService.get<string>("KUBECONFIG");
    if (kubeconfig) {
      this.kc.loadFromFile(kubeconfig);
    } else {
      // Fallback: try in-cluster config
      this.kc.loadFromCluster();
    }

    this.coreApi = this.kc.makeApiClient(k8s.CoreV1Api);
    this.logger.log("Kubernetes client initialized (K3s compatible)");
  }

  // Namespace operations
  async createNamespace(
    name: string,
    labels: Record<string, string>,
  ): Promise<void> {
    const namespace: k8s.V1Namespace = {
      metadata: {
        name,
        labels: {
          "app.kubernetes.io/managed-by": "paas-k3s",
          ...labels,
        },
      },
    };

    await this.coreApi.createNamespace(namespace);
    this.logger.log(`Namespace created: ${name}`);
  }

  async deleteNamespace(name: string): Promise<void> {
    await this.coreApi.deleteNamespace(name);
    this.logger.log(`Namespace deleted: ${name}`);
  }

  async namespaceExists(name: string): Promise<boolean> {
    try {
      await this.coreApi.readNamespace(name);
      return true;
    } catch (error) {
      if (error instanceof k8s.HttpError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  // ResourceQuota operations
  async createResourceQuota(
    namespace: string,
    spec: k8s.V1ResourceQuotaSpec,
  ): Promise<void> {
    const quota: k8s.V1ResourceQuota = {
      metadata: {
        name: "space-quota",
        namespace,
        labels: {
          "app.kubernetes.io/managed-by": "paas-k3s",
        },
      },
      spec,
    };

    await this.coreApi.createNamespacedResourceQuota(namespace, quota);
    this.logger.log(`ResourceQuota created in namespace: ${namespace}`);
  }

  async getResourceQuotaUsage(namespace: string): Promise<{
    cpu: { used: string; limit: string };
    memory: { used: string; limit: string };
    storage: { used: string; limit: string };
  } | null> {
    try {
      const { body } = await this.coreApi.readNamespacedResourceQuota(
        "space-quota",
        namespace,
      );

      const status = body.status;
      if (!status?.hard || !status?.used) {
        return null;
      }

      return {
        cpu: {
          used: status.used["limits.cpu"] || "0",
          limit: status.hard["limits.cpu"] || "0",
        },
        memory: {
          used: status.used["limits.memory"] || "0",
          limit: status.hard["limits.memory"] || "0",
        },
        storage: {
          used: status.used["requests.storage"] || "0",
          limit: status.hard["requests.storage"] || "0",
        },
      };
    } catch (error) {
      if (error instanceof k8s.HttpError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // LimitRange operations
  async createLimitRange(
    namespace: string,
    limits: k8s.V1LimitRangeItem[],
  ): Promise<void> {
    const limitRange: k8s.V1LimitRange = {
      metadata: {
        name: "default-limits",
        namespace,
        labels: {
          "app.kubernetes.io/managed-by": "paas-k3s",
        },
      },
      spec: {
        limits,
      },
    };

    await this.coreApi.createNamespacedLimitRange(namespace, limitRange);
    this.logger.log(`LimitRange created in namespace: ${namespace}`);
  }
}
```

### 3. Tier Quotas Configuration

```typescript
// backend/src/config/tier-quotas.config.ts
import { ServiceTier } from "@prisma/client";

export interface TierQuota {
  cpu: string;
  memory: string;
  storage: string;
  maxSpaces: number;
  maxProjectsPerSpace: number;
  maxPodsPerSpace: number;
}

export const TIER_QUOTAS: Record<ServiceTier, TierQuota> = {
  FREE: {
    cpu: "500m",
    memory: "512Mi",
    storage: "1Gi",
    maxSpaces: 3,
    maxProjectsPerSpace: 3,
    maxPodsPerSpace: 5,
  },
  PRO: {
    cpu: "2",
    memory: "2Gi",
    storage: "10Gi",
    maxSpaces: 10,
    maxProjectsPerSpace: 10,
    maxPodsPerSpace: 20,
  },
  TEAM: {
    cpu: "8",
    memory: "8Gi",
    storage: "50Gi",
    maxSpaces: 100, // Effectively unlimited
    maxProjectsPerSpace: 50,
    maxPodsPerSpace: 100,
  },
};

export function getQuotaForTier(tier: ServiceTier): TierQuota {
  return TIER_QUOTAS[tier];
}
```

### 4. Spaces DTOs

```typescript
// backend/src/modules/spaces/dto/create-space.dto.ts
import { IsString, IsOptional, Matches, Length } from "class-validator";

export class CreateSpaceDto {
  @IsString()
  @Length(3, 50, { message: "Tên Space phải từ 3-50 ký tự" })
  @Matches(/^[a-z][a-z0-9-]*[a-z0-9]$/, {
    message:
      "Tên Space chỉ chứa lowercase letters, numbers, hyphens và phải bắt đầu bằng chữ cái",
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

// backend/src/modules/spaces/dto/update-space.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateSpaceDto } from "./create-space.dto";

export class UpdateSpaceDto extends PartialType(CreateSpaceDto) {}
```

### 5. SpacesService

```typescript
// backend/src/modules/spaces/spaces.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "@prisma/prisma.service";
import { KubernetesService } from "@kubernetes/kubernetes.service";
import { CreateSpaceDto, UpdateSpaceDto } from "./dto";
import { User, Space, SpaceStatus } from "@prisma/client";
import { getQuotaForTier, TIER_QUOTAS } from "@config/tier-quotas.config";
import { generateSpaceSlug } from "@common/utils/slug.util";

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly k8s: KubernetesService,
  ) {}

  async create(user: User, dto: CreateSpaceDto): Promise<Space> {
    // 1. Check quota
    const spaceCount = await this.prisma.space.count({
      where: { userId: user.id },
    });
    const quota = getQuotaForTier(user.tier);

    if (spaceCount >= quota.maxSpaces) {
      throw new BadRequestException({
        message: `Đã đạt giới hạn số lượng Space cho tier ${user.tier} (tối đa ${quota.maxSpaces})`,
        code: "SPACE_QUOTA_EXCEEDED",
      });
    }

    // 2. Generate slug
    const slug = generateSpaceSlug(user.id, dto.name);

    // 3. Check slug uniqueness
    const existingSpace = await this.prisma.space.findUnique({
      where: { slug },
    });
    if (existingSpace) {
      throw new ConflictException({
        message: "Space với tên này đã tồn tại",
        code: "SPACE_ALREADY_EXISTS",
      });
    }

    // 4. Create DB record with PENDING status
    const space = await this.prisma.space.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        userId: user.id,
        cpuLimit: quota.cpu,
        memoryLimit: quota.memory,
        storageLimit: quota.storage,
        status: SpaceStatus.PENDING,
      },
    });

    // 5. Create K3s resources (namespace, quota, limitrange)
    try {
      await this.createK8sResources(space, user);

      // 6. Update status to ACTIVE
      return await this.prisma.space.update({
        where: { id: space.id },
        data: { status: SpaceStatus.ACTIVE },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create K3s resources for space ${space.id}`,
        error,
      );

      await this.prisma.space.update({
        where: { id: space.id },
        data: {
          status: SpaceStatus.ERROR,
          statusMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  private async createK8sResources(space: Space, user: User): Promise<void> {
    // Note: K3s fully supports standard K8s resources
    const labels = {
      "paas.io/owner": user.id,
      "paas.io/type": "space",
      "paas.io/space-id": space.id,
    };

    // Create namespace
    await this.k8s.createNamespace(space.slug, labels);

    // Create ResourceQuota
    await this.k8s.createResourceQuota(space.slug, {
      hard: {
        "limits.cpu": space.cpuLimit,
        "limits.memory": space.memoryLimit,
        "requests.cpu": space.cpuLimit,
        "requests.memory": space.memoryLimit,
        "requests.storage": space.storageLimit,
        pods: String(getQuotaForTier(user.tier).maxPodsPerSpace),
      },
    });

    // Create LimitRange
    await this.k8s.createLimitRange(space.slug, [
      {
        type: "Container",
        default: { cpu: "100m", memory: "128Mi" },
        defaultRequest: { cpu: "50m", memory: "64Mi" },
      },
    ]);
  }

  async findAll(userId: string): Promise<(Space & { projectCount: number })[]> {
    const spaces = await this.prisma.space.findMany({
      where: { userId },
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return spaces.map((space) => ({
      ...space,
      projectCount: space._count.projects,
    }));
  }

  async findOne(id: string, userId: string): Promise<Space> {
    const space = await this.prisma.space.findFirst({
      where: { id, userId },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { services: true } },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException({
        message: "Space không tồn tại",
        code: "SPACE_NOT_FOUND",
      });
    }

    return space;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateSpaceDto,
  ): Promise<Space> {
    const space = await this.findOne(id, userId);

    return this.prisma.space.update({
      where: { id: space.id },
      data: dto,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const space = await this.prisma.space.findFirst({
      where: { id, userId },
      include: { _count: { select: { projects: true } } },
    });

    if (!space) {
      throw new NotFoundException({
        message: "Space không tồn tại",
        code: "SPACE_NOT_FOUND",
      });
    }

    if (space._count.projects > 0) {
      throw new ConflictException({
        message: `Không thể xóa Space vì còn ${space._count.projects} Projects bên trong`,
        code: "SPACE_DELETE_HAS_PROJECTS",
        details: { projectCount: space._count.projects },
      });
    }

    // Mark as PENDING_DELETE
    await this.prisma.space.update({
      where: { id },
      data: { status: SpaceStatus.PENDING_DELETE },
    });

    // Delete K8s namespace (this cascades all resources)
    try {
      await this.k8s.deleteNamespace(space.slug);
    } catch (error) {
      this.logger.error(`Failed to delete K8s namespace ${space.slug}`, error);

      await this.prisma.space.update({
        where: { id },
        data: {
          status: SpaceStatus.ERROR,
          statusMessage: "Failed to delete K8s namespace",
        },
      });

      throw error;
    }

    // Delete DB record
    await this.prisma.space.delete({ where: { id } });
  }

  async getQuotaUsage(id: string, userId: string) {
    const space = await this.findOne(id, userId);
    return this.k8s.getResourceQuotaUsage(space.slug);
  }
}
```

### 6. SpacesController

```typescript
// backend/src/modules/spaces/spaces.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "@modules/auth/guards/jwt-auth.guard";
import { User } from "@common/decorators/user.decorator";
import { SpacesService } from "./spaces.service";
import { CreateSpaceDto, UpdateSpaceDto } from "./dto";
import { User as UserEntity } from "@prisma/client";
import { validateJwtPayload } from "@modules/auth/guards/jwt-payload.guard";

@Controller("spaces")
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  async create(@User() user: UserEntity, @Body() dto: CreateSpaceDto) {
    const space = await this.spacesService.create(user, dto);
    return { data: space };
  }

  @Get()
  async findAll(@User() user: UserEntity) {
    const spaces = await this.spacesService.findAll(user.id);
    return {
      data: spaces,
      meta: {
        total: spaces.length,
        page: 1,
        limit: 100,
      },
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @User() user: UserEntity) {
    const space = await this.spacesService.findOne(id, user.id);
    return { data: space };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @User() user: UserEntity,
    @Body() dto: UpdateSpaceDto,
  ) {
    const space = await this.spacesService.update(id, user.id, dto);
    return { data: space };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @User() user: UserEntity) {
    await this.spacesService.remove(id, user.id);
  }

  @Get(":id/quota")
  async getQuota(@Param("id") id: string, @User() user: UserEntity) {
    const usage = await this.spacesService.getQuotaUsage(id, user.id);
    return { data: usage };
  }
}
```

### 7. Slug Utility

```typescript
// backend/src/common/utils/slug.util.ts
/**
 * Generate K3s/K8s-compatible namespace slug for a Space.
 * Format: space-{userId-prefix}-{spaceName}
 * Max length: 63 characters (Kubernetes namespace limit)
 */
export function generateSpaceSlug(userId: string, spaceName: string): string {
  const userPrefix = userId.slice(0, 8).toLowerCase();
  const normalizedName = spaceName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const slug = `space-${userPrefix}-${normalizedName}`;

  // Ensure max 63 chars (K3s/Kubernetes namespace limit)
  return slug.slice(0, 63).replace(/-$/, "");
}
```

## Patterns & Best Practices

### Error Code Pattern

Sử dụng error codes theo convention:

```typescript
// Good
throw new ConflictException({
  message: "Space với tên này đã tồn tại",
  code: "SPACE_ALREADY_EXISTS",
});

// Bad
throw new ConflictException("Space already exists");
```

### Type Guard Usage

Khi xử lý dữ liệu từ external sources (K3s API):

```typescript
// Validate K8s response before using
interface QuotaStatus {
  hard: Record<string, string>;
  used: Record<string, string>;
}

function isQuotaStatus(obj: unknown): obj is QuotaStatus {
  return (
    typeof obj === "object" && obj !== null && "hard" in obj && "used" in obj
  );
}
```

### Transaction Pattern

Khi cần rollback:

```typescript
// Create DB record first, then K3s resources
// If K3s fails, update DB status to ERROR instead of deleting
// This allows retry without losing data
```

## Xử lý Lỗi

### K3s/Kubernetes Error Handling

> K3s sử dụng Kubernetes API chuẩn nên error handling giống hệt.

```typescript
import * as k8s from "@kubernetes/client-node";

try {
  await this.coreApi.createNamespace(namespace);
} catch (error) {
  if (error instanceof k8s.HttpError) {
    if (error.statusCode === 409) {
      throw new ConflictException("Namespace already exists");
    }
    if (error.statusCode === 403) {
      throw new ForbiddenException("Insufficient permissions");
    }
  }
  throw error;
}
```

## Ghi chú Bảo mật

- **Authorization:** Luôn kiểm tra `userId` trong query để đảm bảo user chỉ access spaces của họ
- **Input Sanitization:** Slug generation phải strip tất cả special characters
- **K3s RBAC:** Service account cần quyền minimal (chỉ namespace, quota, limitrange)

```

```
````
