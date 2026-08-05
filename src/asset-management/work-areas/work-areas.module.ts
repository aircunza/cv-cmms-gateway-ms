import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { WorkAreasController } from './work-areas.controller';

@Module({
  controllers: [WorkAreasController],
  imports: [NatsModule],
})
export class WorkAreasModule {}
