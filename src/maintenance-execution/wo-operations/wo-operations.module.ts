import { Module } from '@nestjs/common';
import { WoOperationsController } from './wo-operations.controller';
import { WoOperationsListController } from './wo-operations-list.controller';
import { WoOperationsHumanResourcesPlainController } from './wo-operations-human-resources-plain.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [
    WoOperationsController,
    WoOperationsListController,
    WoOperationsHumanResourcesPlainController,
  ],
  imports: [NatsModule],
})
export class WoOperationsModule {}
