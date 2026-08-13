import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateOperationHrDto {
  @IsNotEmpty()
  operationCode: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  organizationCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode: string;

  @IsNumber()
  @Min(0.0001)
  actualHours: number;

  @IsOptional()
  @IsNumber()
  hourlyCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  principalFlag?: string;

  @IsNumber()
  @Min(0)
  resourceSequenceNumber: number;

  @IsDateString()
  actualStartDate: string;

  @IsDateString()
  actualCompletionDate: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedCompletionDate?: string;
}

export class UpdateOperationHrDto {
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  actualHours?: number;

  @IsOptional()
  @IsNumber()
  hourlyCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  principalFlag?: string;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsDateString()
  actualCompletionDate?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedCompletionDate?: string;
}

export class FindAllOperationHrDto {
  @IsOptional()
  operationCode?: number;

  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  includeCanceled?: string;
}

export class CancelOperationHrDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  canceledReason: string;
}
