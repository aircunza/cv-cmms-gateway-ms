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
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  FindAllWorkOrderDto,
  WorkOrderCodeDto,
} from './dto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
  }

  private getActorCode(user: CurrentUser) {
    if (!user.code) throw new BadRequestException('Authenticated user code not found in token');
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
  create(@Body() dto: CreateWorkOrderDto, @User() user: CurrentUser) {
    return this.client
      .send('work.order.create', { ...dto, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Get(':workOrderCode')
  findOne(@Param() dto: WorkOrderCodeDto) {
    return this.client.send('work.order.find.one', dto).pipe(
      catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllWorkOrderDto) {
    return this.client.send('work.order.find.all', dto).pipe(
      catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode')
  update(@Param() params: WorkOrderCodeDto, @Body() dto: UpdateWorkOrderDto, @User() user: CurrentUser) {
    return this.client
      .send('work.order.update', { workOrderCode: params.workOrderCode, ...dto, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode/release')
  release(@Param() params: WorkOrderCodeDto, @User() user: CurrentUser) {
    return this.client
      .send('work.order.release', { workOrderCode: params.workOrderCode, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode/complete')
  complete(@Param() params: WorkOrderCodeDto, @User() user: CurrentUser) {
    return this.client
      .send('work.order.complete', { workOrderCode: params.workOrderCode, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode/close')
  close(@Param() params: WorkOrderCodeDto, @User() user: CurrentUser) {
    return this.client
      .send('work.order.close', { workOrderCode: params.workOrderCode, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode/cancel')
  cancel(@Param() params: WorkOrderCodeDto, @Body() dto: { canceledReason?: string }, @User() user: CurrentUser) {
    return this.client
      .send('work.order.cancel', { workOrderCode: params.workOrderCode, actorId: this.getActorId(user), actorName: this.getActorName(user), canceledReason: dto.canceledReason })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }
}
