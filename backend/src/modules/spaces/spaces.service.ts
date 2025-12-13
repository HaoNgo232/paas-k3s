import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { KubernetesService } from '@kubernetes/kubernetes.service';
import { CreateSpaceDto, UpdateSpaceDto } from '@modules/spaces/dto';
import type { Space } from '../../generated/prisma/client';
import { SpaceQuotaUsage } from '@/modules/spaces/interfaces/space-quota.interface';

/**
 * Spaces Service Interface
 * Định nghĩa contract cho SpacesService
 */
export interface ISpacesService {
  create(userId: string, dto: CreateSpaceDto): Promise<Space>;
  findAll(userId: string): Promise<(Space & { projectCount: number })[]>;
  findOne(id: string, userId: string): Promise<Space>;
  update(id: string, userId: string, dto: UpdateSpaceDto): Promise<Space>;
  remove(id: string, userId: string): Promise<void>;
  getQuotaUsage(id: string, userId: string): Promise<SpaceQuotaUsage | null>;
}

/**
 * Spaces Service
 * Business logic cho quản lý Spaces
 */
@Injectable()
export class SpacesService implements ISpacesService {
  private readonly logger = new Logger(SpacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly k8s: KubernetesService,
  ) {}

  // Tạo Space mới: validate quota, tạo DB record, tạo K3s resources (namespace, quota, limitrange)
  create(_userId: string, _dto: CreateSpaceDto): Promise<Space> {
    // TODO: Implement create logic
    // Will query User from DB to get tier, then create Space
    return Promise.reject(new Error('Not implemented'));
  }

  // Lấy danh sách Spaces của user, kèm projectCount cho mỗi Space
  findAll(_userId: string): Promise<(Space & { projectCount: number })[]> {
    // TODO: Implement findAll logic
    return Promise.reject(new Error('Not implemented'));
  }

  // Lấy chi tiết Space theo ID, kiểm tra ownership (userId), bao gồm projects list
  findOne(_id: string, _userId: string): Promise<Space> {
    // TODO: Implement findOne logic
    return Promise.reject(new Error('Not implemented'));
  }

  // Cập nhật Space (name, description), kiểm tra ownership trước khi update
  update(_id: string, _userId: string, _dto: UpdateSpaceDto): Promise<Space> {
    // TODO: Implement update logic
    return Promise.reject(new Error('Not implemented'));
  }

  // Xóa Space: kiểm tra không có projects, xóa K3s namespace, xóa DB record
  remove(_id: string, _userId: string): Promise<void> {
    // TODO: Implement remove logic
    return Promise.reject(new Error('Not implemented'));
  }

  // Lấy quota usage từ K3s ResourceQuota API, trả về CPU/Memory/Storage đã dùng/giới hạn
  getQuotaUsage(_id: string, _userId: string): Promise<SpaceQuotaUsage | null> {
    // TODO: Implement getQuotaUsage logic
    return Promise.reject(new Error('Not implemented'));
  }
}
