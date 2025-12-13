/**
 * Space Quota Interface
 * Định nghĩa cấu trúc quota usage từ K3s ResourceQuota
 */
export interface SpaceQuotaUsage {
  cpu: {
    used: string;
    limit: string;
    percentage?: number;
  };
  memory: {
    used: string;
    limit: string;
    percentage?: number;
  };
  storage: {
    used: string;
    limit: string;
    percentage?: number;
  };
}
