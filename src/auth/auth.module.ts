import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { NatsModule } from 'src/transports/nats.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UserOrgPermissionsModule } from './user-org-permissions/user-org-permissions.module';

@Module({
  controllers: [AuthController],
  providers: [],
  imports: [NatsModule, OrganizationsModule, UserOrgPermissionsModule],
})
export class AuthModule {}
