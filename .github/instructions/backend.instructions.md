---
applyTo: "backend/**"
---

# Backend Instructions - NestJS + Prisma + Kubernetes

## Module Structure

Follow feature-based module organization:

```
src/
├── main.ts
├── app.module.ts
├── modules/
│   └── {feature}/
│       ├── {feature}.module.ts
│       ├── {feature}.controller.ts
│       ├── {feature}.service.ts
│       ├── dto/
│       │   ├── create-{feature}.dto.ts
│       │   ├── update-{feature}.dto.ts
│       │   └── {feature}-response.dto.ts
│       └── entities/              # Optional: for complex types
│           └── {feature}.entity.ts
├── kubernetes/
│   ├── kubernetes.module.ts
│   ├── kubernetes.service.ts
│   └── builders/
│       ├── deployment.builder.ts
│       ├── service.builder.ts
│       └── ingress.builder.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── exceptions/
├── config/
└── prisma/
```

## Controller Conventions

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { User } from "@prisma/client";

@Controller("spaces")
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateSpaceDto) {
    const space = await this.spacesService.create(user.id, dto);
    return { data: space, message: "Space created successfully" };
  }

  @Get()
  async findAll(@CurrentUser() user: User, @Query() query: ListSpacesQueryDto) {
    const result = await this.spacesService.findAll(user.id, query);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: query.page || 1,
        limit: query.limit || 10,
      },
    };
  }

  @Get(":id")
  async findOne(@CurrentUser() user: User, @Param("id") id: string) {
    const space = await this.spacesService.findOne(user.id, id);
    return { data: space };
  }

  @Patch(":id")
  async update(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    const space = await this.spacesService.update(user.id, id, dto);
    return { data: space, message: "Space updated successfully" };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.spacesService.remove(user.id, id);
  }
}
```

## Service Layer Conventions

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { KubernetesService } from "@/kubernetes/kubernetes.service";
import {
  SpaceNotFoundException,
  SpaceQuotaExceededException,
  SpaceDeleteHasProjectsException,
} from "./exceptions";

@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly k8s: KubernetesService,
  ) {}

  async create(userId: string, dto: CreateSpaceDto) {
    // 1. Validate quota
    const userSpaces = await this.prisma.space.count({
      where: { userId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const limits = TIER_LIMITS[user.tier];
    if (limits.maxSpaces !== -1 && userSpaces >= limits.maxSpaces) {
      throw new SpaceQuotaExceededException(user.tier, limits.maxSpaces);
    }

    // 2. Generate slug for K8s namespace
    const slug = this.generateSlug(userId, dto.name);

    // 3. Create in database (transaction)
    const space = await this.prisma.$transaction(async (tx) => {
      const space = await tx.space.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          userId,
        },
      });

      // 4. Create K8s namespace
      await this.k8s.createNamespace(slug, {
        "paas.io/owner": userId,
        "paas.io/type": "space",
        "paas.io/space-id": space.id,
      });

      return space;
    });

    return space;
  }

  async findOne(userId: string, id: string) {
    const space = await this.prisma.space.findFirst({
      where: { id, userId },
      include: {
        projects: {
          include: {
            _count: { select: { services: true } },
          },
        },
      },
    });

    if (!space) {
      throw new SpaceNotFoundException(id);
    }

    return space;
  }

  async remove(userId: string, id: string) {
    const space = await this.findOne(userId, id);

    // Check if space has projects
    if (space.projects.length > 0) {
      throw new SpaceDeleteHasProjectsException(id, space.projects.length);
    }

    await this.prisma.$transaction(async (tx) => {
      // Delete from database
      await tx.space.delete({ where: { id } });

      // Delete K8s namespace
      await this.k8s.deleteNamespace(space.slug);
    });
  }

  private generateSlug(userId: string, name: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return `space-${userId}-${sanitized}`.substring(0, 63);
  }
}
```

## DTO Conventions

Always use class-validator and class-transformer:

```typescript
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateSpaceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9-_]+$/, {
    message: "Name can only contain letters, numbers, hyphens, and underscores",
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}

export class UpdateSpaceDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}

export class ListQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}
```

## Custom Exception Conventions

Create domain-specific exceptions in each module:

```typescript
// modules/spaces/exceptions/index.ts
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";

export class SpaceNotFoundException extends NotFoundException {
  constructor(spaceId: string) {
    super({
      statusCode: 404,
      error: "Not Found",
      message: `Space with ID "${spaceId}" not found`,
      code: "SPACE_NOT_FOUND",
    });
  }
}

export class SpaceAlreadyExistsException extends ConflictException {
  constructor(name: string) {
    super({
      statusCode: 409,
      error: "Conflict",
      message: `Space with name "${name}" already exists`,
      code: "SPACE_ALREADY_EXISTS",
    });
  }
}

export class SpaceQuotaExceededException extends ForbiddenException {
  constructor(tier: string, maxSpaces: number) {
    super({
      statusCode: 403,
      error: "Forbidden",
      message: `Space quota exceeded. ${tier} tier allows maximum ${maxSpaces} spaces`,
      code: "SPACE_QUOTA_EXCEEDED",
      details: { tier, maxSpaces },
    });
  }
}

export class SpaceDeleteHasProjectsException extends ConflictException {
  constructor(spaceId: string, projectCount: number) {
    super({
      statusCode: 409,
      error: "Conflict",
      message: `Cannot delete space. It contains ${projectCount} project(s). Delete all projects first.`,
      code: "SPACE_DELETE_HAS_PROJECTS",
      details: { spaceId, projectCount },
    });
  }
}
```

## Kubernetes Service Conventions

```typescript
import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as k8s from "@kubernetes/client-node";

@Injectable()
export class KubernetesService implements OnModuleInit {
  private readonly logger = new Logger(KubernetesService.name);
  private coreApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private networkingApi: k8s.NetworkingV1Api;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const kc = new k8s.KubeConfig();

    if (this.config.get("NODE_ENV") === "production") {
      kc.loadFromCluster();
    } else {
      kc.loadFromFile(this.config.get("KUBECONFIG"));
    }

    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
  }

  // Always wrap K8s operations with try-catch and meaningful errors
  async createNamespace(
    name: string,
    labels: Record<string, string>,
  ): Promise<void> {
    try {
      await this.coreApi.createNamespace({
        metadata: {
          name,
          labels: {
            "app.kubernetes.io/managed-by": "paas-k3s",
            ...labels,
          },
        },
      });
      this.logger.log(`Namespace "${name}" created successfully`);
    } catch (error) {
      this.logger.error(`Failed to create namespace "${name}"`, error);
      throw new K8sNamespaceCreateFailedException(name, error.message);
    }
  }

  async deleteNamespace(name: string): Promise<void> {
    try {
      await this.coreApi.deleteNamespace(name);
      this.logger.log(`Namespace "${name}" deleted successfully`);
    } catch (error) {
      // Ignore 404 errors (already deleted)
      if (error.statusCode !== 404) {
        this.logger.error(`Failed to delete namespace "${name}"`, error);
        throw new K8sNamespaceDeleteFailedException(name, error.message);
      }
    }
  }

  // Use builders for complex resources
  async createDeployment(
    namespace: string,
    config: DeploymentConfig,
  ): Promise<void> {
    const deployment = new DeploymentBuilder()
      .setName(config.name)
      .setNamespace(namespace)
      .setImage(config.image)
      .setReplicas(config.replicas)
      .setPort(config.port)
      .setEnvVars(config.envVars)
      .setResources(config.resources)
      .setLabels(config.labels)
      .build();

    try {
      await this.appsApi.createNamespacedDeployment(namespace, deployment);
      this.logger.log(
        `Deployment "${config.name}" created in namespace "${namespace}"`,
      );
    } catch (error) {
      this.logger.error(`Failed to create deployment "${config.name}"`, error);
      throw new K8sDeploymentCreateFailedException(
        config.name,
        namespace,
        error.message,
      );
    }
  }
}
```

## Builder Pattern for K8s Resources

```typescript
// kubernetes/builders/deployment.builder.ts
import { V1Deployment } from "@kubernetes/client-node";

export class DeploymentBuilder {
  private deployment: V1Deployment = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      labels: {},
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: {} },
      template: {
        metadata: { labels: {} },
        spec: {
          containers: [
            {
              name: "",
              image: "",
              ports: [],
              env: [],
              resources: {
                requests: { cpu: "50m", memory: "64Mi" },
                limits: { cpu: "200m", memory: "256Mi" },
              },
            },
          ],
        },
      },
    },
  };

  setName(name: string): this {
    this.deployment.metadata.name = name;
    this.deployment.metadata.labels["app.kubernetes.io/name"] = name;
    this.deployment.spec.selector.matchLabels = { app: name };
    this.deployment.spec.template.metadata.labels = { app: name };
    this.deployment.spec.template.spec.containers[0].name = name;
    return this;
  }

  setNamespace(namespace: string): this {
    this.deployment.metadata.namespace = namespace;
    return this;
  }

  setImage(image: string): this {
    this.deployment.spec.template.spec.containers[0].image = image;
    return this;
  }

  setReplicas(replicas: number): this {
    this.deployment.spec.replicas = replicas;
    return this;
  }

  setPort(port: number): this {
    this.deployment.spec.template.spec.containers[0].ports = [
      { containerPort: port },
    ];
    return this;
  }

  setEnvVars(envVars: Record<string, string>): this {
    this.deployment.spec.template.spec.containers[0].env = Object.entries(
      envVars,
    ).map(([name, value]) => ({ name, value }));
    return this;
  }

  setResources(resources: {
    cpuRequest: string;
    cpuLimit: string;
    memoryRequest: string;
    memoryLimit: string;
  }): this {
    this.deployment.spec.template.spec.containers[0].resources = {
      requests: {
        cpu: resources.cpuRequest,
        memory: resources.memoryRequest,
      },
      limits: {
        cpu: resources.cpuLimit,
        memory: resources.memoryLimit,
      },
    };
    return this;
  }

  setLabels(labels: Record<string, string>): this {
    this.deployment.metadata.labels = {
      ...this.deployment.metadata.labels,
      "app.kubernetes.io/managed-by": "paas-k3s",
      ...labels,
    };
    return this;
  }

  build(): V1Deployment {
    return this.deployment;
  }
}
```

## Prisma Conventions

### Schema Naming

- Model names: PascalCase singular (`User`, `Space`, `Service`)
- Field names: camelCase (`userId`, `createdAt`)
- Relation fields: camelCase (`user`, `projects`, `services`)
- Enum names: PascalCase (`UserRole`, `ServiceStatus`)
- Enum values: UPPER_SNAKE_CASE (`RUNNING`, `PENDING`)

### Common Patterns

```prisma
model Space {
  id          String   @id @default(cuid())

  // Required fields first
  name        String
  slug        String   @unique

  // Optional fields
  description String?

  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  projects    Project[]

  // Timestamps always at the end
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Indexes
  @@index([userId])
}
```

### Prisma Service

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

## Testing Conventions

```typescript
// Use descriptive test names
describe("SpacesService", () => {
  describe("create", () => {
    it("should create a space and K8s namespace", async () => {
      // Arrange
      const dto: CreateSpaceDto = { name: "test-space" };

      // Act
      const result = await service.create(mockUser.id, dto);

      // Assert
      expect(result.name).toBe(dto.name);
      expect(k8sService.createNamespace).toHaveBeenCalledWith(
        expect.stringContaining("test-space"),
        expect.objectContaining({
          "paas.io/owner": mockUser.id,
        }),
      );
    });

    it("should throw SpaceQuotaExceededException when quota exceeded", async () => {
      // Arrange
      prismaService.space.count.mockResolvedValue(5);
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        tier: "FREE",
      });

      // Act & Assert
      await expect(service.create(mockUser.id, dto)).rejects.toThrow(
        SpaceQuotaExceededException,
      );
    });
  });
});
```

## Import Conventions

Use path aliases configured in tsconfig.json:

```typescript
// Good - use path aliases
import { PrismaService } from "@/prisma/prisma.service";
import { KubernetesService } from "@/kubernetes/kubernetes.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

// Bad - relative paths for distant modules
import { PrismaService } from "../../../prisma/prisma.service";
```

tsconfig.json paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
