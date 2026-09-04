import { Module } from '@nestjs/common';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [WorkOrdersModule, InventoryModule],
})
export class OracleFusionModule {}
