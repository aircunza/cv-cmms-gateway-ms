import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { UserOrgPermissionsController } from './user-org-permissions.controller';

@Module({
  controllers: [UserOrgPermissionsController],
  providers: [],
  imports: [NatsModule],
})
export class UserOrgPermissionsModule {}
