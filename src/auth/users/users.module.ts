import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [UsersController],
  providers: [],
  imports: [NatsModule],
})
export class UsersModule {}
