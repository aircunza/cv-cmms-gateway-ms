import { Module } from '@nestjs/common';
import { OperationHumanResourcesController } from './operation-human-resources.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OperationHumanResourcesController],
  imports: [NatsModule],
})
export class OperationHumanResourcesModule {}
