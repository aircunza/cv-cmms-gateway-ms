import { Module } from '@nestjs/common';
import { AssetsTreeController } from './assets-tree.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [AssetsTreeController],
  imports: [NatsModule],
})
export class AssetsTreeModule {}
