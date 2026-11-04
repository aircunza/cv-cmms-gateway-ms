import { IsNotEmpty, IsString } from 'class-validator';

export class OracleIntegrationWorkOrdersQueryDto {
  @IsString()
  @IsNotEmpty()
  workOrderCodes!: string;
}

export class OracleWorkOrderCodeDto {
  @IsNotEmpty()
  workOrderCode!: number | string;
}

export class OracleOperationCodeDto {
  @IsNotEmpty()
  workOrderCode!: number | string;

  @IsNotEmpty()
  operationCode!: number | string;
}
