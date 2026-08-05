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
  CreateOperationMaterialDto,
  UpdateOperationMaterialDto,
  FindAllOperationMaterialDto,
} from './dto';

@Controller('work-orders/:workOrderCode/operations/:operationCode/materials')
export class OperationMaterialsController {
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
  create(
    @Param() params: { workOrderCode: string; operationCode: string },
    @Body() dto: CreateOperationMaterialDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('operation.material.create', { ...dto, operationCode: Number(params.operationCode), actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Param() params: { operationCode: string }, @Query() dto: FindAllOperationMaterialDto) {
    return this.client.send('operation.material.find.all', { ...dto, operationCode: Number(params.operationCode) }).pipe(
      catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param() params: { id: string },
    @Body() dto: UpdateOperationMaterialDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('operation.material.update', { id: Number(params.id), ...dto, actorId: this.getActorId(user), actorName: this.getActorName(user) })
      .pipe(catchError((error: unknown) => { throw new RpcException(this.toRpcError(error)); }));
  }
}
