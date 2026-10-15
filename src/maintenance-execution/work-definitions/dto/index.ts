import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from 'class-validator';

export class CreateWorkDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  workDefinitionCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  workDefinitionDescription!: string;
}

export class UpdateWorkDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Y', 'N'])
  isActive!: string;
}

export class FindAllWorkDefinitionDto {
  @IsOptional()
  filters?: unknown;

  @IsOptional()
  order?: unknown;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}

export class WorkDefinitionCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  workDefinitionCode!: string;
}
