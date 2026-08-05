import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkAreaDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  workAreaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationCode?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  isActive?: string;
}
