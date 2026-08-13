import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import type { Request } from 'express';
import { catchError } from 'rxjs';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { CurrentUser } from 'src/auth/interfaces/current-user.interface';
import type { OrganizationRole } from 'src/auth/interfaces/organization-role.interface';
import { NATS_SERVICE } from 'src/config';
import {
  CreateWoOperationDto,
  UpdateWoOperationDto,
  CancelWoOperationDto,
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

  private getOrganizationCode(request: Request): string {
    const orgCode = request.headers['x-organization-code'];
    if (!orgCode) {
      throw new BadRequestException('X-Organization-Code header is required');
    }
    return orgCode as string;
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

  @UseGuards(AuthGuard)
  @Patch(':operationCode/cancel')
  cancel(
    @Param() params: { workOrderCode: string; operationCode: string },
    @Body() dto: CancelWoOperationDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    const userPermissions =
      organizations
        .find((o) => o.organizationCode === organizationCode)
        ?.roles.flatMap((role) => role.permissions ?? [])
        .filter(
          (p) =>
            !organizations
              .find((o) => o.organizationCode === organizationCode)
              ?.roles.flatMap((r) => r.deniedPermissions ?? [])
              .includes(p),
        ) ?? [];

    return this.client
      .send('wo.operation.cancel', {
        operationCode: Number(params.operationCode),
        workOrderCode: Number(params.workOrderCode),
        organizationCode,
        userPermissions,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
        ...dto,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
