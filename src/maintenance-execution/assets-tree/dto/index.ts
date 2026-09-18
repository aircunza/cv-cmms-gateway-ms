import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAssetsTreeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  assetCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(370)
  unit: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(370)
  subunit: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(370)
  maintainableItem: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sparePartCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sparePartName: string;
}

export class UpdateAssetsTreeDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  assetCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(370)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(370)
  subunit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(370)
  maintainableItem?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sparePartCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sparePartName?: string;
}

export class FindAllAssetsTreeDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  assetCode?: string;
}
