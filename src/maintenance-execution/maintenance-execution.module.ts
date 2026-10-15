import { Module } from '@nestjs/common';
import { WorkRequestsModule } from './work-requests/work-requests.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { WoOperationsModule } from './wo-operations/wo-operations.module';
import { OperationMaterialsModule } from './operation-materials/operation-materials.module';
import { OperationHumanResourcesModule } from './operation-human-resources/operation-human-resources.module';
import { HumanResourcesModule } from './human-resources/human-resources.module';
import { AssetsTreeModule } from './assets-tree/assets-tree.module';
import { WorkDefinitionsModule } from './work-definitions/work-definitions.module';

@Module({
  imports: [
    WorkRequestsModule,
    WorkOrdersModule,
    WoOperationsModule,
    OperationMaterialsModule,
    OperationHumanResourcesModule,
    HumanResourcesModule,
    AssetsTreeModule,
    WorkDefinitionsModule,
  ],
})
export class MaintenanceExecutionModule {}
