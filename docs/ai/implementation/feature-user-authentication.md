---
phase: implementation
title: Hướng dẫn Triển khai - Xác thực người dùng
description: Ghi chú triển khai kỹ thuật, các mẫu và hướng dẫn mã cho Xác thực người dùng
---

# Hướng dẫn Triển khai

## Thiết lập Phát triển

**Chúng ta bắt đầu như thế nào?**

### Backend Dependencies

```bash
cd backend
pnpm add @nestjs/passport passport passport-github2 jose
pnpm add -D @types/passport-github2
# Lưu ý: Không cài @nestjs/jwt hay passport-jwt vì chúng ta dùng jose
```

### Frontend Dependencies

```bash
cd frontend
pnpm add js-cookie lucide-react
pnpm add -D @types/js-cookie
```

### Biến Môi trường

**Backend (.env)**

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
JWT_SECRET=super-secret-key-must-be-at-least-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
CALLBACK_URL=http://localhost:3001/auth/github/callback
```

**Frontend (.env)**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Cấu trúc Mã

**Mã được tổ chức như thế nào?**

### Backend

```
src/modules/auth/
├── auth.controller.ts      # Endpoints
├── auth.module.ts          # Định nghĩa Module
├── auth.service.ts         # Logic nghiệp vụ (validateUser)
├── services/
│   └── jwt.service.ts      # Wrapper cho thư viện jose (sign/verify)
├── dto/
│   └── auth.dto.ts
├── guards/
│   ├── github-auth.guard.ts
│   └── jwt-auth.guard.ts   # Custom guard dùng JwtService
├── strategies/
│   └── github.strategy.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

### Frontend

```
src/features/auth/
├── components/
│   ├── login-form.tsx
│   └── user-nav.tsx
├── hooks/
│   └── use-auth.ts
├── providers/
│   └── auth-provider.tsx
└── types/
    └── index.ts

src/app/(auth)/
├── login/
│   └── page.tsx
└── callback/
    └── page.tsx
```

## Ghi chú Triển khai

### Backend: GitHub Strategy

Phương thức `validate` trong `GithubStrategy` nên trả về hồ sơ người dùng.

```typescript
async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
  const { id, username, displayName, photos, emails } = profile;
  const user = {
    githubId: id,
    username,
    email: emails[0].value,
    name: displayName,
    avatarUrl: photos[0].value,
  };
  done(null, user);
}
```

### Backend: JwtService (Wrapper cho jose)

Tạo service riêng để xử lý logic JWT, giúp code sạch và dễ test hơn.

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import * as jose from "jose";
import authConfig from "@config/auth.config";

@Injectable()
export class JwtService {
  private secret: Uint8Array;

  constructor(
    @Inject(authConfig.KEY)
    private config: ConfigType<typeof authConfig>,
  ) {
    this.secret = new TextEncoder().encode(this.config.jwtSecret);
  }

  async sign(payload: any): Promise<string> {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.config.jwtExpiresIn)
      .sign(this.secret);
  }

  async verify(token: string): Promise<any> {
    const { payload } = await jose.jwtVerify(token, this.secret);
    return payload;
  }
}
```

### Backend: AuthService

Sử dụng `JwtService` để ký token thay vì gọi trực tiếp `jose`.

```typescript
@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) // ... other services
  {}

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.sign(payload);
    return { accessToken };
  }
}
```

### Backend: JwtAuthGuard

Sử dụng `JwtService` để verify token.

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = await this.jwtService.verify(token);
      request["user"] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
  // ... extractTokenFromHeader implementation
}
```

### Backend: Auth Controller Callback

Callback nên chuyển hướng đến frontend với token.

```typescript
@Get('github/callback')
@UseGuards(GithubAuthGuard)
async githubAuthRedirect(@Req() req, @Res() res) {
  const { accessToken } = await this.authService.login(req.user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
}
```

### Frontend: Auth Provider

Sử dụng Context để giữ trạng thái người dùng. Khi mount, kiểm tra token trong cookies và fetch hồ sơ người dùng (`/auth/me`).

## Xử lý Lỗi

**Chúng ta xử lý thất bại như thế nào?**

- **Lỗi OAuth:** Nếu GitHub từ chối truy cập, chuyển hướng đến `/login?error=access_denied`.
- **Token Hết hạn:** Nếu `/auth/me` trả về 401, xóa token và chuyển hướng đến `/login`.

## Bảo mật

- Đảm bảo `JWT_SECRET` đủ phức tạp (ít nhất 32 ký tự cho HS256).
- Validate `FRONTEND_URL` để ngăn chặn lỗ hổng open redirect.
