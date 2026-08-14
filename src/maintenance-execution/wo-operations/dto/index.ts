import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWoOperationResourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode!: string;

  @IsInt()
  @Min(0)
  resourceSequenceNumber!: number;

  @IsNumber()
  @Min(0.01)
  actualHours!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  principalFlag?: string;

  @IsString()
  @IsNotEmpty()
  actualStartDate!: string;

  @IsString()
  @IsNotEmpty()
  actualCompletionDate!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyCost?: number;
}

export class CreateWoOperationDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  operationName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  operationDescription?: string;

  @IsOptional()
  operationSeqNumber?: number;

  // @IsNotEmpty()
  // workOrderCode: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  assetCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  assetShortDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  subunit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  maintainableItem?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  operationCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  operationStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  operationType?: string;

  @IsOptional()
  actualStartDate?: Date;

  @IsOptional()
  actualCompletionDate?: Date;

  @IsOptional()
  actualHours?: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'resources should not be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationResourceDto)
  resources!: CreateWoOperationResourceDto[];

  @IsString()
  @IsOptional()
  @MaxLength(255)
  workCenterCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  workCenterDescription?: string;

  @IsOptional()
  centerCostCode?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  workAreaCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  workAreaDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  sector?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  subsector?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  organizationCode!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationName?: string;
}

export class UpdateWoOperationDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  operationName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  operationDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  operationStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  operationType?: string;
}

export class FindAllWoOperationDto {
  @IsOptional()
  workOrderCode?: number;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  assetCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  operationStatus?: string;
}

export class WoOperationCodeDto {
  @IsNotEmpty()
  operationCode!: number;
}

export class CancelWoOperationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  canceledReason!: string;
}
