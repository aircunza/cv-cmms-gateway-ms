import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateWorkRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  assetCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  assetShortDescription?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  issueDescription!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  enableOracleWorkOrder!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operatorCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  operatorName!: string;

  @IsOptional()
  @IsString()
  attendedByTechnician?: string;

  @IsOptional()
  @IsString()
  attendedByTechnicianName?: string;

  @IsOptional()
  @IsString()
  attendedBySupervisor?: string;

  @IsOptional()
  @IsString()
  attendedBySupervisorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialtyType?: string;
}

export class UpdateWorkRequestDto {
  @IsString()
  @IsOptional()
  @MaxLength(240)
  issueDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  attendedByTechnician?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  attendedByTechnicianName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  attendedBySupervisor?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  attendedBySupervisorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialtyType?: string;
}

export class FindAllWorkRequestDto {
  @IsOptional()
  filters?: unknown;

  @IsOptional()
  order?: unknown;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}

export class WorkRequestIdDto {
  @IsNotEmpty()
  requestId!: number;
}
