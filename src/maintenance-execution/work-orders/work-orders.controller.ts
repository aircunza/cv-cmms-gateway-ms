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
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  FindAllWorkOrderDto,
  WorkOrderCodeDto,
  CancelWorkOrderDto,
} from './dto';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
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

  private getUserPermissions(
    organizations: OrganizationRole[],
    organizationCode: string,
  ): string[] {
    const org = organizations.find(
      (o) => o.organizationCode === organizationCode,
    );
    if (!org) return [];

    const allPermissions = org.roles.flatMap((role) => role.permissions ?? []);
    const allDenied = org.roles.flatMap((role) => role.deniedPermissions ?? []);

    return allPermissions.filter((p) => !allDenied.includes(p));
  }

  private getUserRoles(
    organizations: OrganizationRole[],
    organizationCode: string,
  ): string[] {
    const org = organizations.find(
      (o) => o.organizationCode === organizationCode,
    );
    if (!org) return [];
    return org.roles.map((role) => role.roleCode);
  }

  private validateOrgAccess(
    organizations: OrganizationRole[],
    organizationCode: string,
  ) {
    const org = organizations.find(
      (o) => o.organizationCode === organizationCode,
    );
    if (!org) {
      throw new BadRequestException(
        `User does not have access to organization ${organizationCode}`,
      );
    }
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() dto: CreateWorkOrderDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userPermissions = this.getUserPermissions(
      organizations,
      organizationCode,
    );
    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.create', {
        ...dto,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
        organizationCode,
        userPermissions,
        userRoles,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':workOrderCode')
  findOne(
    @Param() dto: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userPermissions = this.getUserPermissions(
      organizations,
      organizationCode,
    );
    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.find.one', {
        workOrderCode: dto.workOrderCode,
        organizationCode,
        userRoles,
        userPermissions,
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
    @Query() dto: FindAllWorkOrderDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userPermissions = this.getUserPermissions(
      organizations,
      organizationCode,
    );
    const userRoles = this.getUserRoles(organizations, organizationCode);

    const parsedFilters =
      typeof dto.filters === 'string'
        ? this.parseJsonParam(dto.filters)
        : dto.filters;

    const parsedOrder =
      typeof dto.order === 'string'
        ? this.parseJsonParam(dto.order)
        : dto.order;

    const parsedLimit = this.parseNonNegativeInt(dto.limit);

    const parsedOffset = this.parseNonNegativeInt(dto.offset);

    return this.client
      .send('work.order.find.all', {
        organizationCode,
        userRoles,
        userPermissions,
        filters: parsedFilters,
        order: parsedOrder,
        limit: parsedLimit,
        offset: parsedOffset,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  private parseJsonParam(value: string): unknown {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      throw new BadRequestException('Invalid filter data');
    }
  }

  private parseNonNegativeInt(
    value: number | string | undefined,
  ): number | undefined {
    if (value === undefined || value === '') return undefined;
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException('Invalid filter data');
    }
    return parsed;
  }

  @UseGuards(AuthGuard)
  @Patch(':workOrderCode')
  update(
    @Param() params: WorkOrderCodeDto,
    @Body() dto: UpdateWorkOrderDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userPermissions = this.getUserPermissions(
      organizations,
      organizationCode,
    );
    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.update', {
        workOrderCode: params.workOrderCode,
        ...dto,
        organizationCode,
        userPermissions,
        userRoles,
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
  @Patch(':workOrderCode/release')
  release(
    @Param() params: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.release', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userRoles,
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
  @Patch(':workOrderCode/complete')
  complete(
    @Param() params: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.complete', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userRoles,
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
  @Patch(':workOrderCode/close')
  close(
    @Param() params: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.close', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userRoles,
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
  @Patch(':workOrderCode/cancel')
  cancel(
    @Param() params: WorkOrderCodeDto,
    @Body() dto: CancelWorkOrderDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userPermissions = this.getUserPermissions(
      organizations,
      organizationCode,
    );
    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.cancel', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userPermissions,
        userRoles,
        canceledReason: dto.canceledReason,
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
  @Patch(':workOrderCode/hold')
  holdOn(
    @Param() params: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.hold', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userRoles,
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
  @Patch(':workOrderCode/pending-approval')
  pendingApproval(
    @Param() params: WorkOrderCodeDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.order.pending-approval', {
        workOrderCode: params.workOrderCode,
        organizationCode,
        userRoles,
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
