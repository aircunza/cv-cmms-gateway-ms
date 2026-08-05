import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateOperationMaterialDto {
  @IsNotEmpty()
  operationCode: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  organizationCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  materialName?: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  unitCost?: number;

  @IsOptional()
  totalCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  supplyType?: string;

  @IsOptional()
  materialSequenceNumber?: number;
}

export class UpdateOperationMaterialDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  materialName?: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  unitCost?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1)
  supplyType?: string;
}

export class FindAllOperationMaterialDto {
  @IsOptional()
  operationCode?: number;
}
