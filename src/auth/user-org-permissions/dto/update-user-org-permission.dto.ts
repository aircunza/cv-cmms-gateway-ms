import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserOrgPermissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  roleCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  roleName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  roleDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedPermissions?: string[];
}
