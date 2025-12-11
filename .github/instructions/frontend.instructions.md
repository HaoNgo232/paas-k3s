---
applyTo: "frontend/**"
---

# Frontend Pattern - Next.js 15 + React Query + Zustand

## ONE Pattern for ALL Features

Mọi feature đều tuân theo cấu trúc này:

```
src/features/{feature}/
├── services/
│    └── {feature}.service.ts    # API calls (Class Pattern)
├── hooks/
│    └── use-{feature}.ts        # React Query hooks
├── stores/
│   └── {feature}-store.ts      # Client state (Zustand)
├── components/
│   ├── {feature}-list.tsx      # Container components
│   └── {feature}-card.tsx      # Presentational components
└── types/
     └── index.ts                # TypeScript types
```

**3 Layers:**

1. **Service** → API communication (Class Pattern)
2. **Hook** → React Query + Zustand (Composition)
3. **Component** → UI only (No logic)

---

## 1. Service Layer (API Calls)

**Rules:**

- Dùng Class Pattern với instance methods
- Inject `httpClient` qua constructor (DI)
- Export singleton instance để dùng trong hooks
- Throw `ApiError` khi lỗi
- Validate response structure

```typescript
// features/spaces/services/spaces.service.ts
import { httpClient, HttpClient } from "@/lib/http";
import { ApiError } from "@/lib/http/errors";
import { API_ENDPOINTS } from "@/lib/constants";
import { Space, CreateSpaceInput, ApiResponse } from "../types";

export class SpacesService {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<Space[]> {
    const response = await this.http.get<ApiResponse<Space[]>>(
      API_ENDPOINTS.SPACES.LIST,
    );
    return response.data.data;
  }

  async getById(id: string): Promise<Space> {
    const response = await this.http.get<ApiResponse<Space>>(
      API_ENDPOINTS.SPACES.GET(id),
    );
    return response.data.data;
  }

  async create(input: CreateSpaceInput): Promise<Space> {
    const response = await this.http.post<ApiResponse<Space>>(
      API_ENDPOINTS.SPACES.CREATE,
      input,
    );
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await this.http.delete(API_ENDPOINTS.SPACES.DELETE(id));
  }
}

// Singleton instance - inject httpClient
export const spacesService = new SpacesService(httpClient);
```

**Lợi ích DI Pattern:**

- ✅ Dễ mock `httpClient` khi test
- ✅ Có thể swap implementation (axios → fetch)
- ✅ Tách biệt dependencies rõ ràng

---

## 2. Hook Layer (React Query)

**Rules:**

- Compose service + React Query
- Handle loading/error states
- Invalidate queries sau mutation
- Export query keys factory

```typescript
// features/spaces/hooks/use-spaces.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spacesService } from "../services/spaces.service";
import { QUERY_KEYS } from "@/lib/constants";

// Query Keys Factory
export const spaceKeys = {
  all: ["spaces"] as const,
  lists: () => [...spaceKeys.all, "list"] as const,
  detail: (id: string) => [...spaceKeys.all, "detail", id] as const,
};

// List Hook
export function useSpaces() {
  return useQuery({
    queryKey: spaceKeys.lists(),
    queryFn: () => spacesService.list(),
  });
}

// Detail Hook
export function useSpace(id: string) {
  return useQuery({
    queryKey: spaceKeys.detail(id),
    queryFn: () => spacesService.getById(id),
    enabled: !!id,
  });
}

// Create Mutation
export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => spacesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
    },
  });
}

// Delete Mutation
export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => spacesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: spaceKeys.lists() });
    },
  });
}
```

---

## 3. Store Layer (Client State)

**Rules:**

- Chỉ cho UI state (search, filters, selected items)
- Không lưu server data (dùng React Query)
- Dùng `storage` abstraction nếu cần persist

```typescript
// features/spaces/stores/space-ui-store.ts
import { create } from "zustand";

interface SpaceUIState {
  searchQuery: string;
  selectedId: string | null;
  setSearchQuery: (query: string) => void;
  selectSpace: (id: string | null) => void;
}

export const useSpaceUIStore = create<SpaceUIState>((set) => ({
  searchQuery: "",
  selectedId: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectSpace: (id) => set({ selectedId: id }),
}));
```

---

## 4. Component Layer

**Rules:**

- **Container components**: Connect hooks to UI
- **Presentational components**: Pure UI, nhận props
- Không có business logic trong component

### Container Component (connects logic)

```typescript
// features/spaces/components/space-list.tsx
"use client";

import { useSpaces } from "../hooks/use-spaces";
import { SpaceCard } from "./space-card";

export function SpaceList() {
  const { data: spaces, isLoading } = useSpaces();

  if (isLoading) return <div>Loading...</div>;
  if (!spaces?.length) return <div>No spaces found</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {spaces.map((space) => (
        <SpaceCard key={space.id} space={space} />
      ))}
    </div>
  );
}
```

### Presentational Component (pure UI)

```typescript
// features/spaces/components/space-card.tsx
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import type { Space } from "../types";

interface SpaceCardProps {
  space: Space;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <Link href={`${ROUTES.SPACES}/${space.id}`}>
      <Card className="hover:border-primary cursor-pointer">
        <CardHeader>
          <CardTitle>{space.name}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
```

---

## 5. Constants Layer

**Centralize tất cả hardcoded values:**

```typescript
// lib/constants.ts
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SPACES: "/spaces",
} as const;

export const API_ENDPOINTS = {
  SPACES: {
    LIST: "/spaces",
    GET: (id: string) => `/spaces/${id}`,
    CREATE: "/spaces",
    DELETE: (id: string) => `/spaces/${id}`,
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
} as const;

export const QUERY_KEYS = {
  SPACES: {
    LIST: ["spaces", "list"] as const,
    DETAIL: (id: string) => ["spaces", "detail", id] as const,
  },
} as const;
```

---

## 6. HTTP Client Setup (One-time)

```typescript
// lib/http/index.ts
import { AxiosHttpClient } from "./axios-client";

class HttpClientFactory {
  private static instance: HttpClient;

  static createClient(): HttpClient {
    if (!this.instance) {
      this.instance = new AxiosHttpClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      });
    }
    return this.instance;
  }
}

export const httpClient = HttpClientFactory.createClient();
```

---

## 7. Storage Setup (One-time)

```typescript
// lib/storage/index.ts
import { CookieStorage } from "./implementations";

class StorageFactory {
  private static instance: IStorage;

  static createStorage(): IStorage {
    if (!this.instance) {
      this.instance = new CookieStorage();
    }
    return this.instance;
  }
}

export const storage = StorageFactory.createStorage();
```

---

## Form Handling Pattern

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateSpace } from "../hooks/use-spaces";

const createSpaceSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(200).optional(),
});

type FormValues = z.infer<typeof createSpaceSchema>;

export function CreateSpaceForm() {
  const { mutate, isPending } = useCreateSpace();
  const form = useForm<FormValues>({
    resolver: zodResolver(createSpaceSchema),
  });

  function onSubmit(values: FormValues) {
    mutate(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>{/* Form fields */}</form>
  );
}
```

---

## Checklist khi tạo Feature mới

- [ ] Service class với static methods (API calls only)
- [ ] Hooks với React Query (useQuery + useMutation)
- [ ] Store cho UI state (search, filters, không lưu server data)
- [ ] Container component (connect hooks)
- [ ] Presentational component (pure UI)
- [ ] Add routes/endpoints/keys vào `lib/constants.ts`
- [ ] Dùng `httpClient` và `storage` từ lib
- [ ] Path aliases: `@/*`

---

## Data Flow

```
User clicks → Component → Hook → Service → API
                  ↓
              Store (UI state only)
                  ↓
          React Query (Server data)
```

**Rule:** Server data goes to React Query, UI state goes to Zustand.
