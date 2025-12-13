import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { SpacesService } from '@/modules/spaces/spaces.service';
import { CreateSpaceDto, UpdateSpaceDto } from '@/modules/spaces/dto';
import { type JwtPayload } from '@modules/auth/interfaces/jwt-payload.interface';

/**
 * Spaces Controller
 * HTTP endpoints cho quản lý Spaces
 */
@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  // POST /spaces - Tạo Space mới, tự động tạo K3s Namespace
  @Post()
  async create(@User() payload: JwtPayload, @Body() dto: CreateSpaceDto) {
    const space = await this.spacesService.create(payload.sub, dto);
    return { data: space };
  }

  // GET /spaces - Lấy danh sách Spaces của user hiện tại
  @Get()
  async findAll(@User() payload: JwtPayload) {
    const spaces = await this.spacesService.findAll(payload.sub);
    return {
      data: spaces,
      meta: {
        total: spaces.length,
        page: 1,
        limit: 100,
      },
    };
  }

  // GET /spaces/:id - Lấy chi tiết Space, kiểm tra ownership
  @Get(':id')
  async findOne(@Param('id') id: string, @User() payload: JwtPayload) {
    const space = await this.spacesService.findOne(id, payload.sub);
    return { data: space };
  }

  // PATCH /spaces/:id - Cập nhật Space (name, description)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @User() payload: JwtPayload,
    @Body() dto: UpdateSpaceDto,
  ) {
    const space = await this.spacesService.update(id, payload.sub, dto);
    return { data: space };
  }

  // DELETE /spaces/:id - Xóa Space (chỉ khi trống, không có projects)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @User() payload: JwtPayload) {
    await this.spacesService.remove(id, payload.sub);
  }

  // GET /spaces/:id/quota - Lấy quota usage từ K3s ResourceQuota
  @Get(':id/quota')
  async getQuota(@Param('id') id: string, @User() payload: JwtPayload) {
    const usage = await this.spacesService.getQuotaUsage(id, payload.sub);
    return { data: usage };
  }
}
