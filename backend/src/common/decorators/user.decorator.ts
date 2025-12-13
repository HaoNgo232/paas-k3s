import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface';

/**
 * User Decorator
 * Extract user từ request (được set bởi JwtAuthGuard)
 * Trả về JWT payload với user info
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    if (!request.user) {
      throw new Error(
        'User not found in request. Ensure JwtAuthGuard is applied.',
      );
    }
    return request.user;
  },
);
