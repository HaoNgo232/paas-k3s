/**
 * Test Helper Utilities
 * Validate API responses in tests to catch format violations early
 */

import {
  ApiResponse,
  isApiResponse,
} from '../interfaces/api-response.interface';

/**
 * Assert that HTTP response matches standard ApiResponse format
 * Use in E2E tests to validate actual HTTP responses
 *
 * @example
 * it('should return standard format', () => {
 *   return request(app.getHttpServer())
 *     .get('/users/1')
 *     .expect(200)
 *     .expect(assertHttpResponseFormat);
 * });
 */
export function assertHttpResponseFormat(res: { body: unknown }): void {
  if (!isApiResponse(res.body)) {
    throw new Error(
      `HTTP response does not match ApiResponse format. Got: ${JSON.stringify(res.body, null, 2)}`,
    );
  }

  const response = res.body;

  if (typeof response.statusCode !== 'number') {
    throw new Error('Response missing required "statusCode" property');
  }

  if (!('data' in response)) {
    throw new Error('Response missing required "data" property');
  }
}

/**
 * Assert that response data is not null
 * Use for endpoints that should always return data
 */
export function assertHasData<T>(
  response: ApiResponse<T>,
): asserts response is ApiResponse<NonNullable<T>> {
  if (response.data === null || response.data === undefined) {
    throw new Error(
      'Expected response.data to be defined, but got null/undefined',
    );
  }
}

/**
 * Assert that response data is null (for delete, logout operations)
 */
export function assertNoContent(response: ApiResponse<unknown>): void {
  if (response.data !== null) {
    throw new Error(
      `Expected response.data to be null for no-content operation, but got: ${typeof response.data}`,
    );
  }
}

/**
 * Assert that response has pagination meta
 */
export function assertHasPaginationMeta(response: ApiResponse<unknown>): void {
  if (!response.meta) {
    throw new Error(
      'Expected response.meta to be defined for paginated response',
    );
  }

  const requiredFields = ['total', 'page', 'limit'];
  for (const field of requiredFields) {
    if (!(field in response.meta)) {
      throw new Error(`Expected response.meta.${field} to be defined`);
    }
  }
}

/**
 * Create mock API response for testing
 * Use in unit tests to mock service responses
 */
export function createMockApiResponse<T>(
  data: T,
  statusCode = 200,
  message?: string,
): ApiResponse<T> {
  return {
    data,
    statusCode,
    message,
  };
}
