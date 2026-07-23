import { IsUUID } from 'class-validator';

export class FindOneUserOrgPermissionDto {
  @IsUUID()
  id!: string;
}
