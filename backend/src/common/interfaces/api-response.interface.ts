/**
 * Standard API Response Interface
 * 
 * CRITICAL: Frontend expects ALL API responses in this exact format
 * Global TransformInterceptor automatically wraps controller returns into this structure
 */

export interface ApiResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
  meta?: ApiResponseMeta;
}

/**
 * Type guard to validate API response structure
 * Use in tests and error handling
 */
export function isApiResponse<T>(
  response: unknown,
): response is ApiResponse<T> {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const obj = response as Record<string, unknown>;
  return (
    'data' in obj &&
    'statusCode' in obj &&
    typeof obj.statusCode === 'number'
  );
}

/**
 * Special response wrapper for manual control (rare cases)
 * Use only when you need custom message or meta
 */
export class ResponseWrapper<T> {
  constructor(
    public readonly data: T,
    public readonly message?: string,
    public readonly meta?: ApiResponseMeta,
  ) {}

  static success<T>(
    data: T,
    message?: string,
    meta?: ApiResponseMeta,
  ): ResponseWrapper<T> {
    return new ResponseWrapper(data, message, meta);
  }

  static noContent(message?: string): ResponseWrapper<null> {
    return new ResponseWrapper(null, message);
  }
}