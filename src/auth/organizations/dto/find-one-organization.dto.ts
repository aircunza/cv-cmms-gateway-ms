import { IsUUID } from 'class-validator';

export class FindOneOrganizationDto {
  @IsUUID()
  id!: string;
}
