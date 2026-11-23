import { Module } from '@nestjs/common';
import { BaseCumplimientoEgpController } from './base-cumplimiento-egp/base-cumplimiento-egp.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [BaseCumplimientoEgpController],
  imports: [NatsModule],
})
export class CustomOtbiReportsModule {}
