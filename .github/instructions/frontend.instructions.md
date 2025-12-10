---
applyTo: "frontend/**"
---

# Frontend Instructions - Next.js 15 + React Query + Zustand

## Folder Structure

Follow feature-based organization:

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/              # Protected routes group
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── spaces/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [spaceId]/
│   │   └── settings/
│   ├── (admin)/                  # Admin routes group
│   ├── layout.tsx
│   └── page.tsx
├── features/                     # Feature modules
│   └── {feature}/
│       ├── components/
│       ├── hooks/
│       └── services/
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   └── common/
├── lib/                          # Utilities
├── hooks/                        # Global hooks
├── stores/                       # Zustand stores
└── types/                        # TypeScript types
```

## API Client Setup

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.statusCode || response.status,
      data.code || "UNKNOWN_ERROR",
      data.message || "An error occurred",
      data.details,
    );
  }

  return data.data;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return handleResponse<T>(response);
  },
};
```

## Feature Service Pattern

```typescript
// features/spaces/services/spaces.service.ts
import { api } from "@/lib/api";
import type { Space, CreateSpaceInput, UpdateSpaceInput } from "@/types";

export const spacesService = {
  list: () => api.get<Space[]>("/spaces"),

  getById: (id: string) => api.get<Space>(`/spaces/${id}`),

  create: (data: CreateSpaceInput) => api.post<Space>("/spaces", data),

  update: (id: string, data: UpdateSpaceInput) =>
    api.patch<Space>(`/spaces/${id}`, data),

  delete: (id: string) => api.delete<void>(`/spaces/${id}`),
};
```

## React Query Hooks Pattern

```typescript
// features/spaces/hooks/use-spaces.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesService } from "../services/spaces.service";
import { toast } from "sonner";

// Query keys factory
export const spaceKeys = {
  all: ["spaces"] as const,
  lists: () => [...spaceKeys.all, "list"] as const,
  list: (filters: string) => [...spaceKeys.lists(), filters] as const,
  details: () => [...spaceKeys.all, "detail"] as const,
  detail: (id: string) => [...spaceKeys.details(), id] as const,
};

// List hook
export function useSpaces() {
  return useQuery({
    queryKey: spaceKeys.lists(),
    queryFn: spacesService.list,
  });
}

// Detail hook
export function useSpace(id: string) {
  return useQuery({
    queryKey: spaceKeys.detail(id),
    queryFn: () => spacesService.getById(id),
    enabled: !!id,
  });
}

// Create mutation
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spacesService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
      toast.success("Space created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update mutation
export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpaceInput }) =>
      spacesService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: spaceKeys.detail(variables.id),
      });
      toast.success("Space updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete mutation
export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: spacesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
      toast.success("Space deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

## Component Patterns

### Feature Component

```typescript
// features/spaces/components/space-list.tsx
"use client";

import { useSpaces } from "../hooks/use-spaces";
import { SpaceCard } from "./space-card";
import { SpaceListSkeleton } from "./space-list-skeleton";
import { EmptyState } from "@/components/common/empty-state";

export function SpaceList() {
  const { data: spaces, isLoading, error } = useSpaces();

  if (isLoading) {
    return <SpaceListSkeleton />;
  }

  if (error) {
    return (
      <div className="text-destructive">
        Failed to load spaces: {error.message}
      </div>
    );
  }

  if (!spaces?.length) {
    return (
      <EmptyState
        title="No spaces yet"
        description="Create your first space to get started"
        action={{
          label: "Create Space",
          href: "/spaces/new",
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </div>
  );
}
```

### Presentational Component

```typescript
// features/spaces/components/space-card.tsx
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Folder, ChevronRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { Space } from "@/types";

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link href={`/spaces/${space.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{space.name}</CardTitle>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {space.description && (
            <CardDescription className="line-clamp-2">
              {space.description}
            </CardDescription>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{space._count?.projects || 0} projects</span>
            <span>
              Created {formatDistanceToNow(new Date(space.createdAt))} ago
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

## Form Handling with Zod

```typescript
// features/spaces/components/create-space-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCreateSpace } from "../hooks/use-spaces";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const createSpaceSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      "Name can only contain letters, numbers, hyphens, and underscores",
    ),
  description: z.string().max(200).optional(),
});

type CreateSpaceFormValues = z.infer<typeof createSpaceSchema>;

export function CreateSpaceForm() {
  const router = useRouter();
  const { mutate: createSpace, isPending } = useCreateSpace();

  const form = useForm<CreateSpaceFormValues>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(values: CreateSpaceFormValues) {
    createSpace(values, {
      onSuccess: (space) => {
        router.push(`/spaces/${space.id}`);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="my-awesome-project" {...field} />
              </FormControl>
              <FormDescription>
                This will be used to create your Kubernetes namespace
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of your space"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Space"}
        </Button>
      </form>
    </Form>
  );
}
```

## Zustand Store Pattern

```typescript
// stores/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
```

## Page Component Pattern

```typescript
// app/(dashboard)/spaces/page.tsx
import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { SpaceList } from "@/features/spaces/components/space-list";
import { SpaceListSkeleton } from "@/features/spaces/components/space-list-skeleton";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Spaces | PaaS Platform",
  description: "Manage your deployment spaces",
};

export default function SpacesPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Spaces</h1>
          <p className="text-muted-foreground">
            Organize your projects into isolated workspaces
          </p>
        </div>
        <Button asChild>
          <Link href="/spaces/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Space
          </Link>
        </Button>
      </div>

      <Suspense fallback={<SpaceListSkeleton />}>
        <SpaceList />
      </Suspense>
    </div>
  );
}
```

## Error Handling Pattern

```typescript
// components/common/error-boundary.tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## TypeScript Types

```typescript
// types/index.ts

// Base entity with common fields
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User
export interface User extends BaseEntity {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  githubId: string;
  role: "USER" | "ADMIN";
  tier: "FREE" | "PRO" | "TEAM";
}

// Space
export interface Space extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  userId: string;
  cpuLimit: string;
  memoryLimit: string;
  storageLimit: string;
  _count?: {
    projects: number;
  };
}

export interface CreateSpaceInput {
  name: string;
  description?: string;
}

export interface UpdateSpaceInput {
  name?: string;
  description?: string;
}

// Project
export interface Project extends BaseEntity {
  name: string;
  description: string | null;
  spaceId: string;
  _count?: {
    services: number;
  };
}

// Service
export interface Service extends BaseEntity {
  name: string;
  appName: string;
  description: string | null;
  projectId: string;
  sourceType: "DOCKER_IMAGE" | "GITHUB_REPO" | "SCAFFOLD";
  dockerImage: string | null;
  replicas: number;
  port: number;
  status: ServiceStatus;
}

export type ServiceStatus =
  | "IDLE"
  | "PENDING"
  | "DEPLOYING"
  | "RUNNING"
  | "STOPPED"
  | "ERROR"
  | "SCALING";

// API Error
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
```

## Import Conventions

Use path aliases:

```typescript
// Good
import { Button } from "@/components/ui/button";
import { useSpaces } from "@/features/spaces/hooks/use-spaces";
import { api } from "@/lib/api";
import type { Space } from "@/types";

// Bad
import { Button } from "../../../components/ui/button";
```

tsconfig.json paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Naming Conventions

| Type            | Convention                        | Example             |
| --------------- | --------------------------------- | ------------------- |
| Component files | kebab-case                        | `space-card.tsx`    |
| Component names | PascalCase                        | `SpaceCard`         |
| Hook files      | kebab-case with `use-` prefix     | `use-spaces.ts`     |
| Hook names      | camelCase with `use` prefix       | `useSpaces`         |
| Service files   | kebab-case with `.service` suffix | `spaces.service.ts` |
| Store files     | kebab-case with `.store` suffix   | `auth.store.ts`     |
| Type files      | kebab-case                        | `index.ts`          |
| Utility files   | kebab-case                        | `format-date.ts`    |

## Client vs Server Components

- Default to Server Components
- Use `'use client'` directive only when needed:
  - Using hooks (useState, useEffect, etc.)
  - Using browser APIs
  - Using event handlers
  - Using React Query hooks

```typescript
// Server Component (default) - no directive needed
export default function SpacesPage() {
  return <SpaceList />;
}

// Client Component - needs directive
("use client");

import { useSpaces } from "../hooks/use-spaces";

export function SpaceList() {
  const { data } = useSpaces();
  // ...
}
```
