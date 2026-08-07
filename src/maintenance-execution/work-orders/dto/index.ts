import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ValidateNested,
  IsArray,
  IsIn,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_TYPE_SUBTYPE_COMBOS = [
  { workOrderType: 'Planned', workOrderSubType: 'Preventive' },
  { workOrderType: 'Planned', workOrderSubType: 'Corrective' },
  { workOrderType: 'Planned', workOrderSubType: 'Inspection' },
  { workOrderType: 'Planned', workOrderSubType: 'TPM' },
  { workOrderType: 'Not Planned', workOrderSubType: 'Emergency' },
];

export class CreateWoOperationResourceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  resourceCode: string;

  @IsNumber()
  @Min(0)
  resourceSequenceNumber: number;

  @IsNumber()
  @Min(0.0001)
  plannedHours: number;

  @IsNumber()
  @Min(0.0001)
  actualHours: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  principalFlag: string;

  @IsOptional()
  @IsNumber()
  hourlyCost?: number;

  @IsOptional()
  plannedStartDate?: Date;

  @IsOptional()
  plannedCompletionDate?: Date;
}

export class CreateWoOperationMaterialDto {
  @IsNumber()
  @Min(1)
  materialSequenceNumber: number;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  supplyType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialCode: string;
}

export class CreateWoOperationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  operationName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  operationDescription: string;

  @IsNumber()
  @Min(1)
  operationSeqNumber: number;

  @IsString()
  @IsNotEmpty()
  createdBy: string;

  @IsString()
  @IsNotEmpty()
  operationStatus: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Internal', 'Supplier'])
  operationType: string;

  @IsString()
  @IsNotEmpty()
  actualStartDate: string;

  @IsString()
  @IsNotEmpty()
  actualCompletionDate: string;

  @IsString()
  @IsNotEmpty()
  operationSubType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationResourceDto)
  workOrderOperationResource: CreateWoOperationResourceDto[];

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
  workOrderDescription: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  woStatusCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  assetCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  workOrderType: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  workOrderSubType: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['1', '2', '3', '4'])
  workOrderPriority: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  enableOracleWorkOrder: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWoOperationDto)
  operations?: CreateWoOperationDto[];

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

  @IsOptional()
  plannedStartDate?: Date;

  @IsOptional()
  plannedCompletionDate?: Date;

  validateTypeSubtype(): boolean {
    return VALID_TYPE_SUBTYPE_COMBOS.some(
      (combo) => combo.workOrderType === this.workOrderType && combo.workOrderSubType === this.workOrderSubType,
    );
  }
}

export class UpdateWorkOrderDto {
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
  @MaxLength(30)
  workOrderPriority?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  woStatusCode?: string;

  @IsOptional()
  plannedStartDate?: Date;

  @IsOptional()
  plannedCompletionDate?: Date;

  @IsOptional()
  plannedHours?: number;

  @IsOptional()
  actualStartDate?: Date;

  @IsOptional()
  actualCompletionDate?: Date;

  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  canceledReason?: string;

  @IsOptional()
  needByDate?: Date;
}

export class FindAllWorkOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  assetCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  organizationCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  woStatusCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  workOrderType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  workOrderSubType?: string;
}

export class WorkOrderCodeDto {
  @IsNotEmpty()
  workOrderCode: number;
}
