import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { NATS_SERVICE } from 'src/config';

import { catchError, map } from 'rxjs';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { User } from './decorators/user.decorator';
import { Token } from './decorators/token.decorator';
import { type CurrentUser } from './interfaces /current-user.interface';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private validateLoginIdentifier(loginUserDto: LoginUserDto) {
    const hasEmail = Boolean(loginUserDto.email);
    const hasCode = Boolean(loginUserDto.code);

    if ((hasEmail && hasCode) || (!hasEmail && !hasCode)) {
      throw new BadRequestException(
        'Provide exactly one identifier: email or code',
      );
    }
  }

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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  loginUser(@Body() loginUserDto: LoginUserDto) {
    this.validateLoginIdentifier(loginUserDto);

    return this.client.send('auth.login.user', loginUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logoutUser(
    @Token() token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.client.send('auth.logout.user', token).pipe(
      map(() => {
        res.clearCookie('token');
        res.clearCookie('access_token');
        res.clearCookie('jwt');

        return { success: true };
      }),
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get('verify')
  verifyToken(@User() user: CurrentUser, @Token() token: string) {
    // const user = req['user'];
    // const token = req['token'];

    // return this.client.send('auth.verify.user', {});
    return { user, token };
  }
}
