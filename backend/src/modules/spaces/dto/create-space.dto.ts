import {
  IsString,
  IsOptional,
  Matches,
  Length,
  IsDefined,
} from 'class-validator';

/**
 * Create Space DTO
 * Validation cho POST /spaces
 * Note: Dùng `!` vì giá trị được gán bởi class-transformer từ request body
 * ValidationPipe đảm bảo field này luôn có giá trị hợp lệ trước khi vào service
 */
export class CreateSpaceDto {
  @IsDefined({ message: 'Tên Space là bắt buộc' })
  @IsString()
  @Length(3, 50, { message: 'Tên Space phải từ 3-50 ký tự' })
  @Matches(/^[a-z][a-z0-9-]*[a-z0-9]$/, {
    message:
      'Tên Space chỉ chứa lowercase letters, numbers, hyphens và phải bắt đầu bằng chữ cái',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
