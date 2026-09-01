import { Module } from '@nestjs/common';
import { WorkOrdersController } from './work-orders.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [WorkOrdersController],
  imports: [NatsModule],
})
export class WorkOrdersModule {}
