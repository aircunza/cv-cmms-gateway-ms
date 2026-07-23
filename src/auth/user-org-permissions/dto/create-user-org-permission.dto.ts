import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateUserOrgPermissionDto {
  @IsString()
  @IsUUID()
  userId!: string;

  @IsString()
  @IsUUID()
  organizationId!: string;

  @IsString()
  @MaxLength(100)
  roleCode!: string;

  @IsString()
  @MaxLength(150)
  roleName!: string;

  @IsString()
  @MaxLength(255)
  roleDescription!: string;

  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deniedPermissions?: string[];

  @IsOptional()
  @IsDateString()
  assignedAt?: string;
}
