import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ResponseWrapper } from '../interfaces/api-response.interface';

/**
 * Transform Interceptor
 * 
 * Tự động đóng gói TẤT CẢ các phản hồi từ controller vào một định dạng chuẩn: { data: T, statusCode: number }
 * 
 * Lợi ích:
 * - Các Controller có thể trả về dữ liệu trực tiếp (code sạch hơn)
 * - Ngăn chặn các định dạng phản hồi không nhất quán
 * - Frontend luôn nhận được cấu trúc mong đợi
 * - Không có cơ hội xảy ra lỗi do con người
 * 
 * Cách sử dụng trong Controllers:
 * return user;              // Tự động đóng gói thành { data: user, statusCode: 200 }
 * return users;             // Tự động đóng gói thành { data: users, statusCode: 200 }
 * return ResponseWrapper.success(data, 'Custom message');  // Kiểm soát thủ công
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Handle ResponseWrapper for manual control
        if (data instanceof ResponseWrapper) {
          return {
            data: data.data,
            message: data.message,
            statusCode: response.statusCode,
            meta: data.meta,
          };
        }

        // Handle already-wrapped responses (backward compatibility)
        if (data && typeof data === 'object' && 'data' in data) {
          return {
            ...data,
            statusCode: response.statusCode,
          } as ApiResponse<T>;
        }

        // Default: Auto-wrap controller return value
        return {
          data,
          statusCode: response.statusCode,
        };
      }),
    );
  }
}