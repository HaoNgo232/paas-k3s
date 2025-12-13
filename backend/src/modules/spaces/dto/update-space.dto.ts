import { IsString, IsOptional, Matches, Length } from 'class-validator';

/**
 * Update Space DTO
 * Validation cho PATCH /spaces/:id
 * Tất cả fields đều optional
 */
export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @Length(3, 50, { message: 'Tên Space phải từ 3-50 ký tự' })
  @Matches(/^[a-z][a-z0-9-]*[a-z0-9]$/, {
    message:
      'Tên Space chỉ chứa lowercase letters, numbers, hyphens và phải bắt đầu bằng chữ cái',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}
