/**
 * Express Request Augmentation
 * Mở rộng Express Request type để include user info
 */
import { User } from '@modules/auth/interfaces/user.interface';
import { JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user?: User | JwtPayload;
    }
  }
}
