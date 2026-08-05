import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateHumanResourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  resourceType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  organizationCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  availabilityStatus: string;

  @IsOptional()
  supervisorId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(70)
  supervisorName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  isActive?: string;
}

export class UpdateHumanResourceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  resourceName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  resourceType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  availabilityStatus?: string;

  @IsOptional()
  supervisorId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(70)
  supervisorName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  isActive?: string;
}

export class FindAllHumanResourceDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  resourceType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  availabilityStatus?: string;
}

export class HumanResourceIdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  organizationCode: string;
}
