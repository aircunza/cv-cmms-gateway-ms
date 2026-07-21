import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OrganizationsController],
  providers: [],
  imports: [NatsModule],
})
export class OrganizationsModule {}
