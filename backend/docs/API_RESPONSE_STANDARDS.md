# API Response Standards - MANDATORY 🚨

## 📋 Overview

**All API endpoints automatically return responses in standardized format.**  
A Global `TransformInterceptor` ensures consistency - **Frontend will never receive unexpected structures.**

---

## ✅ Standard Response Format

### Success Response Structure
```typescript
{
  data: T,           // REQUIRED: The actual response payload
  statusCode: number, // REQUIRED: HTTP status code (auto-added)
  message?: string,   // OPTIONAL: Human-readable message
  meta?: {            // OPTIONAL: Pagination/metadata
    total?: number,
    page?: number,
    limit?: number,
    hasNext?: boolean,
    hasPrevious?: boolean
  }
}
```

### Error Response Structure (NestJS handles automatically)
```typescript
{
  message: string,    // REQUIRED: Error message
  statusCode: number, // REQUIRED: HTTP status code
  error?: string,     // OPTIONAL: Error type
  details?: unknown   // OPTIONAL: Additional details
}
```

---

## 🛠️ How to Write Controllers

### ✅ Standard Approach (Recommended)

**Just return your data directly - TransformInterceptor handles the rest:**

```typescript
@Controller('users')
export class UsersController {
  
  // ✅ Return single resource
  @Get(':id')
  async getUser(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
    // Auto-wrapped to: { data: user, statusCode: 200 }
  }

  // ✅ Return list
  @Get()
  async getUsers(): Promise<User[]> {
    return this.usersService.findAll();
    // Auto-wrapped to: { data: users, statusCode: 200 }
  }

  // ✅ Return null (for delete operations)
  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<null> {
    await this.usersService.delete(id);
    return null;
    // Auto-wrapped to: { data: null, statusCode: 200 }
  }
}
```

### ✅ Custom Message/Meta (When Needed)

**Use `ResponseWrapper` for custom messages or metadata:**

```typescript
import { ResponseWrapper } from '@common/interfaces/api-response.interface';

@Controller('users')
export class UsersController {
  
  // ✅ Custom success message
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return ResponseWrapper.success(user, 'User created successfully');
    // Result: { data: user, message: 'User created successfully', statusCode: 201 }
  }

  // ✅ No content with message
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return ResponseWrapper.noContent('User deleted successfully');
    // Result: { data: null, message: 'User deleted successfully', statusCode: 200 }
  }

  // ✅ Paginated response
  @Get('paginated')
  async getUsersPaginated(@Query() query: PaginationDto) {
    const { users, total } = await this.usersService.findPaginated(query);
    
    return ResponseWrapper.success(users, undefined, {
      total,
      page: query.page,
      limit: query.limit,
      hasNext: query.page * query.limit < total,
      hasPrevious: query.page > 1,
    });
    // Result: { data: users, statusCode: 200, meta: { ... } }
  }
}
```

---

## ❌ What NOT to Do

### ❌ Manual Wrapping (Unnecessary)
```typescript
// WRONG - TransformInterceptor already handles this
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  return { data: user }; // Redundant!
}
```

### ❌ Custom Response Objects
```typescript
// WRONG - Breaks frontend expectations
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  return { user: user, success: true }; // Frontend expects { data: ... }
}
```

### ❌ Custom Error Handling
```typescript
// WRONG - Use NestJS exceptions instead
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  if (!user) {
    return { error: 'Not found' }; // Use throw new NotFoundException() instead
  }
  return user;
}
```

---

## 🧪 Testing Your Controllers

### Unit Tests
```typescript
describe('UsersController', () => {
  it('should return user data', async () => {
    const mockUser = { id: '1', name: 'Test' };
    jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);

    const result = await controller.getUser('1');

    expect(result).toBe(mockUser); // Controller returns raw data
    // TransformInterceptor will wrap it during actual HTTP requests
  });
});
```

### E2E Tests
```typescript
describe('/users (e2e)', () => {
  it('GET /users/:id should return wrapped response', () => {
    return request(app.getHttpServer())
      .get('/users/1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('statusCode', 200);
        expect(res.body.data).toHaveProperty('id', '1');
      });
  });
});
```

---

## 🔄 Migration Guide

### Existing Controllers

**If you have existing controllers with manual wrapping:**

```typescript
// OLD CODE (still works, but unnecessary)
@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  return { data: user };
}

// NEW CODE (cleaner)
@Get(':id')
async getUser(@Param('id') id: string) {
  return this.usersService.findOne(id);
}
```

**Both approaches work** - TransformInterceptor detects already-wrapped responses and handles them correctly.

---

## 📋 Pre-Deployment Checklist

- [ ] Controller methods return data directly (not wrapped in `{ data: ... }`)
- [ ] Use `ResponseWrapper` only when you need custom message/meta
- [ ] Use NestJS exceptions for errors (not custom error objects)
- [ ] E2E tests validate response structure has `data` and `statusCode` properties
- [ ] No custom response formats that deviate from the standard

---

## 🎯 Benefits

✅ **Zero Human Error**: Impossible to return wrong format  
✅ **Cleaner Controllers**: No manual wrapping boilerplate  
✅ **Frontend Consistency**: Always receives expected structure  
✅ **Backward Compatible**: Existing manual wrapping still works  
✅ **Type Safe**: TypeScript validates response structure  

---

## 📞 Questions?

**Remember**: The goal is **zero cognitive load** for developers. Just return your data - the system handles the rest! 🎉