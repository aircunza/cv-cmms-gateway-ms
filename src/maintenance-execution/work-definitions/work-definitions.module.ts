import { Module } from '@nestjs/common';
import { WorkDefinitionsController } from './work-definitions.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [WorkDefinitionsController],
  imports: [NatsModule],
})
export class WorkDefinitionsModule {}
