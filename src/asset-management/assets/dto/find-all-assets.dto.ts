import { IsOptional } from 'class-validator';

export class FindAllAssetsDto {
  @IsOptional()
  filters?: unknown;

  @IsOptional()
  order?: unknown;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  offset?: number | string;
}
