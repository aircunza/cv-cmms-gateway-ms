import { Module } from '@nestjs/common';
import { AssetsModule } from './assets/assets.module';
import { WorkAreasModule } from './work-areas/work-areas.module';
import { WorkCentersModule } from './work-centers/work-centers.module';

@Module({
  imports: [WorkAreasModule, WorkCentersModule, AssetsModule],
})
export class AssetManagementModule {}
