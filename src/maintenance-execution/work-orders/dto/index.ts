import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWoOperationResourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode!: string;

  @IsNumber()
  @Min(0)
  resourceSequenceNumber!: number;

  @IsNumber()
  @Min(0.0001)
  actualHours!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  principalFlag!: string;

  @IsString()
  @IsNotEmpty()
  actualStartDate!: string;

  @IsString()
  @IsNotEmpty()
  actualCompletionDate!: string;

  @IsOptional()
  @IsNumber()
  hourlyCost?: number;
}

export class CreateWoOperationMaterialDto {
  @IsNumber()
  @Min(1)
  materialSequenceNumber!: number;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  supplyType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialCode!: string;
}

export class CreateWoOperationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  operationName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  operationDescription!: string;

  @IsNumber()
  @Min(1)
  operationSeqNumber!: number;

  @IsString()
  @IsNotEmpty()
  createdBy!: string;

  @IsString()
  @IsNotEmpty()
  operationStatus!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Internal', 'Supplier'])
  operationType!: string;

  @IsString()
  @IsNotEmpty()
  actualStartDate!: string;

  @IsString()
  @IsNotEmpty()
  actualCompletionDate!: string;

  @IsString()
  @IsNotEmpty()
  operationSubType!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'workOrderOperationResource should not be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationResourceDto)
  workOrderOperationResource!: CreateWoOperationResourceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationMaterialDto)
  workOrderOperationMaterial?: CreateWoOperationMaterialDto[];

  @IsOptional()
  @IsString()
  @MaxLength(240)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  subunit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  maintainableItem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  operationCategory?: string;
}

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  workOrderDescription!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  woStatusCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  assetCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  workOrderType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  workOrderSubType!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['1', '2', '3', '4'])
  workOrderPriority!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  enableOracleWorkOrder!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'operations should not be empty' })
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationDto)
  operations!: CreateWoOperationDto[];

  @IsOptional()
  workRequestId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(140)
  workDefinitionCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  schedulingMethod?: string;

  @IsOptional()
  needByDate?: Date;
}

export class UpdateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  enableOracleWorkOrder!: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  workOrderDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  workOrderType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  workOrderSubType?: string;

  @IsString()
  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  workOrderPriority?: string;
}

export class FindAllWorkOrderDto {
  @IsNotEmpty()
  filters?: unknown;

  @IsOptional()
  order?: unknown;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}

export class CancelWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  canceledReason!: string;
}

export class WorkOrderCodeDto {
  @IsNotEmpty()
  workOrderCode!: number | string;
}

export class ReprogramWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  newActualStartDate!: string;
}
