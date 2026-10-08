import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FindAllUsersDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  userShortName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  isActive?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
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

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}
