import { Module } from '@nestjs/common';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [WorkOrdersModule],
})
export class OracleFusionModule {}
