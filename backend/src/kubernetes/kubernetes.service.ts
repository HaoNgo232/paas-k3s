import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as k8s from '@kubernetes/client-node';
import * as os from 'os';
import * as path from 'path';
import {
  K8sInternalException,
  K8sResourceConflictException,
  K8sResourceForbiddenException,
  K8sResourceNotFoundException,
} from '@kubernetes/exceptions/k8s.exceptions';

export interface IKubernetesService {
  createNamespace(name: string, labels: Record<string, string>): Promise<void>;
  deleteNamespace(name: string): Promise<void>;
  namespaceExists(name: string): Promise<boolean>;
  createResourceQuota(
    namespace: string,
    spec: k8s.V1ResourceQuotaSpec,
  ): Promise<void>;
  getResourceQuotaUsage(namespace: string): Promise<{
    cpu: { used: string; limit: string };
    memory: { used: string; limit: string };
    storage: { used: string; limit: string };
  } | null>;
  createLimitRange(
    namespace: string,
    limits: k8s.V1LimitRangeItem[],
  ): Promise<void>;
}

@Injectable()
export class KubernetesService implements OnModuleInit, IKubernetesService {
  private readonly logger = new Logger(KubernetesService.name);
  private coreApi: k8s.CoreV1Api | null = null;
  private kubeConfig: k8s.KubeConfig | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.kubeConfig = new k8s.KubeConfig();

    const kubeconfigPath = this.configService.get<string>(
      'kubernetes.kubeconfig',
    );
    if (kubeconfigPath) {
      // Expand ~ thành home directory
      const expandedPath = this.expandPath(kubeconfigPath);
      try {
        this.kubeConfig.loadFromFile(expandedPath);
        this.logger.log(
          `Kubernetes kubeconfig loaded from file: ${expandedPath}`,
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to load kubeconfig from ${expandedPath}: ${errorMessage}, falling back to in-cluster config`,
        );
        this.kubeConfig.loadFromCluster();
        this.logger.log('Kubernetes kubeconfig loaded from cluster (fallback)');
      }
    } else {
      this.kubeConfig.loadFromCluster();
      this.logger.log('Kubernetes kubeconfig loaded from cluster');
    }

    this.coreApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
    this.logger.log('Kubernetes CoreV1Api client initialized (K3s compatible)');
  }

  // Tạo Namespace với labels chuẩn của platform
  async createNamespace(
    name: string,
    labels: Record<string, string>,
  ): Promise<void> {
    const client = this.getClient();
    const namespace: k8s.V1Namespace = {
      metadata: {
        name,
        labels: {
          'app.kubernetes.io/managed-by': 'paas-k3s',
          ...labels,
        },
      },
    };

    await client.createNamespace({ body: namespace });
    this.logger.log(`Namespace created: ${name}`);
  }

  // Xóa Namespace theo tên
  async deleteNamespace(name: string): Promise<void> {
    const client = this.getClient();
    try {
      await client.deleteNamespace({ name });
    } catch (error) {
      this.throwK8sException(error, 'Namespace', 'delete', name);
    }
    this.logger.log(`Namespace deleted: ${name}`);
  }

  // Lấy thông tin Namespace, trả về body V1Namespace
  async getNamespace(name: string): Promise<k8s.V1Namespace> {
    const client = this.getClient();
    let response: unknown;
    try {
      response = await client.readNamespace({ name });
    } catch (error) {
      this.throwK8sException(error, 'Namespace', 'read', name);
    }
    if (!this.isNamespaceResponse(response)) {
      throw new Error('Invalid response from Kubernetes: namespace');
    }
    const { body } = response;
    return body;
  }

  // Kiểm tra Namespace có tồn tại không, true/false, xử lý 404 an toàn
  async namespaceExists(name: string): Promise<boolean> {
    const client = this.getClient();
    try {
      await client.readNamespace({ name });
      return true;
    } catch (error) {
      const httpError = this.toHttpError(error);
      if (httpError?.statusCode === 404) return false;
      this.throwK8sException(error, 'Namespace', 'read', name);
    }
  }

  // Tạo ResourceQuota cho namespace
  async createResourceQuota(
    namespace: string,
    spec: k8s.V1ResourceQuotaSpec,
  ): Promise<void> {
    const client = this.getClient();
    const quota: k8s.V1ResourceQuota = {
      metadata: {
        name: 'space-quota',
        namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'paas-k3s',
        },
      },
      spec,
    };

    try {
      await client.createNamespacedResourceQuota({
        namespace,
        body: quota,
      });
    } catch (error) {
      this.throwK8sException(error, 'ResourceQuota', 'create', namespace);
    }
    this.logger.log(`ResourceQuota created in namespace: ${namespace}`);
  }

  // Đọc usage ResourceQuota (CPU/Memory/Storage), null nếu không có
  async getResourceQuotaUsage(namespace: string): Promise<{
    cpu: { used: string; limit: string };
    memory: { used: string; limit: string };
    storage: { used: string; limit: string };
  } | null> {
    const client = this.getClient();
    try {
      const response = await client.readNamespacedResourceQuota({
        name: 'space-quota',
        namespace,
      });
      if (!this.isResourceQuotaResponse(response)) {
        throw new Error('Invalid response from Kubernetes: resource quota');
      }
      const { body } = response;
      const status = body.status as unknown;

      if (!this.isQuotaStatus(status)) {
        return null;
      }
      const hard = status.hard;
      const used = status.used;

      return {
        cpu: {
          used: used['limits.cpu'] || '0',
          limit: hard['limits.cpu'] || '0',
        },
        memory: {
          used: used['limits.memory'] || '0',
          limit: hard['limits.memory'] || '0',
        },
        storage: {
          used: used['requests.storage'] || '0',
          limit: hard['requests.storage'] || '0',
        },
      };
    } catch (error) {
      const httpError = this.toHttpError(error);
      if (httpError?.statusCode === 404) return null;
      this.throwK8sException(error, 'ResourceQuota', 'read', namespace);
    }
  }

  // Tạo LimitRange mặc định cho namespace
  async createLimitRange(
    namespace: string,
    limits: k8s.V1LimitRangeItem[],
  ): Promise<void> {
    const client = this.getClient();
    const limitRange: k8s.V1LimitRange = {
      metadata: {
        name: 'default-limits',
        namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'paas-k3s',
        },
      },
      spec: {
        limits,
      },
    };

    try {
      await client.createNamespacedLimitRange({
        namespace,
        body: limitRange,
      });
    } catch (error) {
      this.throwK8sException(error, 'LimitRange', 'create', namespace);
    }
    this.logger.log(`LimitRange created in namespace: ${namespace}`);
  }

  // Lấy CoreV1Api đã khởi tạo, ném lỗi nếu chưa init
  getClient(): k8s.CoreV1Api {
    if (!this.coreApi) {
      throw new Error('Kubernetes client is not initialized yet');
    }
    return this.coreApi;
  }

  //--------------------------PRIVATE METHODS--------------------------

  // Expand path: thay ~ thành home directory để Node.js có thể đọc được
  private expandPath(filePath: string): string {
    if (filePath.startsWith('~/') || filePath === '~') {
      return filePath.replace('~', os.homedir());
    }
    if (filePath.startsWith('$HOME/')) {
      return filePath.replace('$HOME', os.homedir());
    }
    // Nếu không có ~ hoặc $HOME, trả về path gốc (có thể là absolute path)
    return path.resolve(filePath);
  }

  // Trích xuất statusCode từ error (unknown) - dùng để detect 404 (not found)
  private toHttpError(error: unknown): { statusCode?: number } | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }
    const maybeStatus = (error as { statusCode?: unknown }).statusCode;
    if (typeof maybeStatus === 'number') {
      return { statusCode: maybeStatus };
    }
    return null;
  }

  // Chuẩn hóa bất kỳ error nào dạng unknown thành instance Error với fallback message
  private normalizeError(error: unknown, fallbackMessage: string): Error {
    return error instanceof Error ? error : new Error(fallbackMessage);
  }

  // Mapping lỗi từ K8s → domain-specific exception của ứng dụng
  private throwK8sException(
    error: unknown,
    resource: string,
    action: string,
    namespace?: string,
  ): never {
    const httpError = this.toHttpError(error);
    const cause = error instanceof Error ? error.message : undefined;

    if (httpError?.statusCode === 404) {
      throw new K8sResourceNotFoundException(
        resource,
        namespace,
        action,
        cause,
      );
    }
    if (httpError?.statusCode === 403) {
      throw new K8sResourceForbiddenException(
        resource,
        namespace,
        action,
        cause,
      );
    }
    if (httpError?.statusCode === 409) {
      throw new K8sResourceConflictException(
        resource,
        namespace,
        action,
        cause,
      );
    }

    const fallback = this.normalizeError(error, 'K8s unknown error');
    throw new K8sInternalException(
      resource,
      namespace,
      action,
      fallback.message,
    );
  }

  // Type guard: kiểm tra status của quota có đúng cấu trúc (hard/used maps)
  private isQuotaStatus(
    status: unknown,
  ): status is { hard: Record<string, string>; used: Record<string, string> } {
    if (typeof status !== 'object' || status === null) {
      return false;
    }
    const candidate = status as {
      hard?: unknown;
      used?: unknown;
    };
    return (
      typeof candidate.hard === 'object' &&
      candidate.hard !== null &&
      typeof candidate.used === 'object' &&
      candidate.used !== null
    );
  }

  // Type guard: response từ readNamespace có thuộc tính body là V1Namespace
  private isNamespaceResponse(res: unknown): res is { body: k8s.V1Namespace } {
    return (
      typeof res === 'object' &&
      res !== null &&
      'body' in res &&
      typeof (res as { body?: unknown }).body === 'object' &&
      (res as { body?: unknown }).body !== null
    );
  }

  // Type guard: response từ readNamespacedResourceQuota có thuộc tính body là V1ResourceQuota
  private isResourceQuotaResponse(
    res: unknown,
  ): res is { body: k8s.V1ResourceQuota } {
    return (
      typeof res === 'object' &&
      res !== null &&
      'body' in res &&
      typeof (res as { body?: unknown }).body === 'object' &&
      (res as { body?: unknown }).body !== null
    );
  }
}
