import { Module } from '@nestjs/common';
import { OperationMaterialsController } from './operation-materials.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OperationMaterialsController],
  imports: [NatsModule],
})
export class OperationMaterialsModule {}
