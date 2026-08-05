import { Module } from '@nestjs/common';
import { WorkRequestsController } from './work-requests.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [WorkRequestsController],
  imports: [NatsModule],
})
export class WorkRequestsModule {}
