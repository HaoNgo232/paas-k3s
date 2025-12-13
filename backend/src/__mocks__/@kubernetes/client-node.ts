// Mock for @kubernetes/client-node
export class KubeConfig {
  loadFromFile = jest.fn();
  loadFromCluster = jest.fn();
  makeApiClient = jest.fn();
}

export class CoreV1Api {
  createNamespace = jest.fn();
  deleteNamespace = jest.fn();
  readNamespace = jest.fn();
  createNamespacedResourceQuota = jest.fn();
  readNamespacedResourceQuota = jest.fn();
  createNamespacedLimitRange = jest.fn();
}

export type V1Namespace = {
  metadata?: {
    name?: string;
    labels?: Record<string, string>;
  };
};

export type V1ResourceQuota = {
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    hard?: Record<string, string>;
  };
  status?: {
    hard?: Record<string, string>;
    used?: Record<string, string>;
  };
};

export type V1ResourceQuotaSpec = {
  hard?: Record<string, string>;
};

export type V1LimitRange = {
  metadata?: {
    name?: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    limits?: V1LimitRangeItem[];
  };
};

export type V1LimitRangeItem = {
  type?: string;
  default?: { cpu?: string; memory?: string };
  defaultRequest?: { cpu?: string; memory?: string };
};
