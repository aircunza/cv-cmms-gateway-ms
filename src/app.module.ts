import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AssetManagementModule } from './asset-management/asset-management.module';
import { MaintenanceExecutionModule } from './maintenance-execution/maintenance-execution.module';
import { UserOrgPermissionsModule } from './auth/user-org-permissions/user-org-permissions.module';

@Module({
  imports: [
    AuthModule,
    UserOrgPermissionsModule,
    AssetManagementModule,
    MaintenanceExecutionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
