import { IsNotEmpty } from 'class-validator';

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
