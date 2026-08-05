import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { WorkCentersController } from './work-centers.controller';

@Module({
  controllers: [WorkCentersController],
  imports: [NatsModule],
})
export class WorkCentersModule {}
