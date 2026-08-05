import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { CurrentUser } from 'src/auth/interfaces /current-user.interface';
import { NATS_SERVICE } from 'src/config';
import {
  CreateWorkRequestDto,
  UpdateWorkRequestDto,
  FindAllWorkRequestDto,
  WorkRequestIdDto,
} from './dto';

@Controller('work-requests')
export class WorkRequestsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }
    return String(error);
  }

  private getActorCode(user: CurrentUser) {
    if (!user.code) {
      throw new BadRequestException(
        'Authenticated user code not found in token',
      );
    }
    return user.code;
  }

  private getActorName(user: CurrentUser) {
    return user.userShortName ?? '';
  }

  private getActorId(user: CurrentUser) {
    return user.id;
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateWorkRequestDto, @User() user: CurrentUser) {
    return this.client
      .send('work.request.create', {
        ...dto,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':requestId')
  findOne(@Param() dto: WorkRequestIdDto) {
    return this.client.send('work.request.find.one', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllWorkRequestDto) {
    return this.client.send('work.request.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':requestId')
  update(
    @Param() params: WorkRequestIdDto,
    @Body() dto: UpdateWorkRequestDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('work.request.update', {
        requestId: params.requestId,
        ...dto,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':requestId/cancel')
  cancel(@Param() params: WorkRequestIdDto, @User() user: CurrentUser) {
    return this.client
      .send('work.request.cancel', {
        requestId: params.requestId,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
