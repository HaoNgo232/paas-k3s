import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

const detailsPayload = (
  resource: string,
  namespace?: string,
  action?: string,
  cause?: string,
) => ({
  resource,
  namespace,
  action,
  cause,
});

export class K8sResourceNotFoundException extends NotFoundException {
  constructor(
    resource: string,
    namespace?: string,
    action?: string,
    cause?: string,
  ) {
    super({
      statusCode: 404,
      error: 'Not Found',
      message: `${resource} không tồn tại${namespace ? ` trong namespace ${namespace}` : ''}`,
      code: 'K8S_RESOURCE_NOT_FOUND',
      details: detailsPayload(resource, namespace, action, cause),
    });
  }
}

export class K8sResourceForbiddenException extends ForbiddenException {
  constructor(
    resource: string,
    namespace?: string,
    action?: string,
    cause?: string,
  ) {
    super({
      statusCode: 403,
      error: 'Forbidden',
      message: `Không đủ quyền thực hiện (${action ?? 'operation'}) trên ${resource}`,
      code: 'K8S_FORBIDDEN',
      details: detailsPayload(resource, namespace, action, cause),
    });
  }
}

export class K8sResourceConflictException extends ConflictException {
  constructor(
    resource: string,
    namespace?: string,
    action?: string,
    cause?: string,
  ) {
    super({
      statusCode: 409,
      error: 'Conflict',
      message: `${resource} bị xung đột/trùng lặp`,
      code: 'K8S_RESOURCE_CONFLICT',
      details: detailsPayload(resource, namespace, action, cause),
    });
  }
}

export class K8sInternalException extends InternalServerErrorException {
  constructor(
    resource: string,
    namespace?: string,
    action?: string,
    cause?: string,
  ) {
    super({
      statusCode: 500,
      error: 'Internal Server Error',
      message: `Lỗi khi ${action ?? 'xử lý'} ${resource}`,
      code: 'K8S_INTERNAL_ERROR',
      details: detailsPayload(resource, namespace, action, cause),
    });
  }
}
