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
  CreateOperationHrDto,
  UpdateOperationHrDto,
  FindAllOperationHrDto,
} from './dto';

@Controller(
  'work-orders/:workOrderCode/operations/:operationCode/human-resources',
)
export class OperationHumanResourcesController {
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
    @Param() params: { workOrderCode: string; operationCode: string },
    @Body() dto: CreateOperationHrDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('operation.hr.create', {
        ...dto,
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

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Param() params: { operationCode: string },
    @Query() dto: FindAllOperationHrDto,
  ) {
    return this.client
      .send('operation.hr.find.all', {
        ...dto,
        operationCode: Number(params.operationCode),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param() params: { id: string },
    @Body() dto: UpdateOperationHrDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('operation.hr.update', {
        id: Number(params.id),
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
}
