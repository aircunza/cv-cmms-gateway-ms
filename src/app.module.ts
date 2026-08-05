import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { MaintenanceExecutionModule } from './maintenance-execution/maintenance-execution.module';

@Module({
  imports: [AuthModule, AssetManagementModule, MaintenanceExecutionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
