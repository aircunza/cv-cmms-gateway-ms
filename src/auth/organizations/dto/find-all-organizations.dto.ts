import { IsOptional, IsString, MaxLength } from 'class-validator';

export class FindAllOrganizationsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  countryCode?: string;
}
