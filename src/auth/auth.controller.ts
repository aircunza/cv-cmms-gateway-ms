import { Body, Controller, Get, Post } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { NATS_SERVICE } from 'src/config';

import { catchError } from 'rxjs';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @Get('health')
  status() {
    return this.client.send('health', 'testing verify').pipe(
      catchError((err) => {
        throw new RpcException(err);
      }),
    );
  }

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.client.send('auth.register.user', registerUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }
}
