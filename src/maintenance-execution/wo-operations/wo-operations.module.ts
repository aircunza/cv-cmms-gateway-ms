import { Module } from '@nestjs/common';
import { WoOperationsController } from './wo-operations.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [WoOperationsController],
  imports: [NatsModule],
})
export class WoOperationsModule {}
