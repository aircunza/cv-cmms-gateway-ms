import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { AssetsController } from './assets.controller';

@Module({
  controllers: [AssetsController],
  imports: [NatsModule],
})
export class AssetsModule {}
