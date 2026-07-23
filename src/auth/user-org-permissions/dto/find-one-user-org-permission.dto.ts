import { IsUUID } from 'class-validator';

export class FindOneUserOrgPermissionDto {
  @IsUUID()
  userId!: string;

  @IsUUID()
  organizationId!: string;
}
