import { Module } from '@nestjs/common';
import { HumanResourcesController } from './human-resources.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [HumanResourcesController],
  imports: [NatsModule],
})
export class HumanResourcesModule {}
