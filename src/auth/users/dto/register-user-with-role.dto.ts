import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserWithRoleDto {
  // Datos del usuario
  @IsString()
  @MaxLength(255)
  code!: string;

  @IsString()
  userName!: string;

  @IsString()
  userShortName!: string;

  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(['Y', 'N'])
  isActive?: string;

  @IsOptional()
  @IsIn(['Y', 'N'])
  isVerified?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addAttribute1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addAttribute2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addAttribute3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addAttribute4?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addAttribute5?: string;

  // Rol y permisos del usuario en la organizacion
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
  @IsIn(['Y', 'N'])
  permissionIsActive?: string;

  @IsOptional()
  @IsDateString()
  assignedAt?: string;
}
