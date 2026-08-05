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
  CreateWoOperationDto,
  UpdateWoOperationDto,
  FindAllWoOperationDto,
  WoOperationCodeDto,
} from './dto';

@Controller('work-orders/:workOrderCode/operations')
export class WoOperationsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
  }

  private getActorCode(user: CurrentUser) {
    if (!user.code)
      throw new BadRequestException(
        'Authenticated user code not found in token',
      );
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
  create(
    @Param() params: { workOrderCode: string },
    @Body() dto: CreateWoOperationDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('wo.operation.create', {
        ...dto,
        workOrderCode: Number(params.workOrderCode),
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
  @Get(':operationCode')
  findOne(@Param() params: { operationCode: string }) {
    return this.client
      .send('wo.operation.find.one', {
        operationCode: Number(params.operationCode),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Param() params: { workOrderCode: string },
    @Query() dto: FindAllWoOperationDto,
  ) {
    return this.client
      .send('wo.operation.find.all', {
        ...dto,
        workOrderCode: Number(params.workOrderCode),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':operationCode')
  update(
    @Param() params: { workOrderCode: string; operationCode: string },
    @Body() dto: UpdateWoOperationDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('wo.operation.update', {
        operationCode: Number(params.operationCode),
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
  @Patch(':operationCode/review')
  review(
    @Param() params: { operationCode: string },
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('wo.operation.review', {
        operationCode: Number(params.operationCode),
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
