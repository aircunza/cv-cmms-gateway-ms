import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(255)
  code!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsString()
  @MaxLength(10)
  countryCode!: string;

  @IsString()
  @MaxLength(100)
  countryName!: string;

  @IsString()
  @MaxLength(100)
  timezone!: string;

  @IsOptional()
  @IsInt()
  @Min(-840)
  @Max(840)
  offsetMinutes?: number;
}
