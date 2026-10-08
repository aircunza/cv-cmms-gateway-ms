import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FindAllUsersDto, FindOneUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAllUsers(@Query() findAllUsersDto: FindAllUsersDto) {
    return this.client.send('user.find.all', findAllUsersDto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOneUser(@Param() findOneUserDto: FindOneUserDto) {
    return this.client.send('user.find.one', findOneUserDto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }
}
