import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [InventoryController],
  imports: [NatsModule],
})
export class InventoryModule {}
