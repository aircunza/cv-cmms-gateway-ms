import { IsNotEmpty, IsString } from 'class-validator';

export class OracleInventoryMaterialCodeDto {
  @IsNotEmpty()
  @IsString()
  materialCode!: string;
}

export class OracleInventorySearchDto {
  @IsNotEmpty()
  @IsString()
  description!: string;
}
