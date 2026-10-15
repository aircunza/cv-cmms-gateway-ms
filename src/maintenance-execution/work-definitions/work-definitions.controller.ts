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
  CreateWorkDefinitionDto,
  UpdateWorkDefinitionDto,
  FindAllWorkDefinitionDto,
  WorkDefinitionCodeDto,
} from './dto';

@Controller('work-definitions')
export class WorkDefinitionsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }
    return String(error);
  }

  private getActorId(user: CurrentUser) {
    return user.id;
  }

  private getActorName(user: CurrentUser) {
    return user.userShortName ?? '';
  }

  private getOrganizationCode(request: Request): string {
    const orgCode = request.headers['x-organization-code'];
    if (!orgCode) {
      throw new BadRequestException('X-Organization-Code header is required');
    }
    return orgCode as string;
  }

  private getOptionalOrganizationCode(request: Request): string | undefined {
    const orgCode = request.headers['x-organization-code'];
    return orgCode ? (orgCode as string) : undefined;
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

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() dto: CreateWorkDefinitionDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.definition.create', {
        ...dto,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
        organizationCode,
        userRoles,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':workDefinitionCode')
  findOne(@Param() dto: WorkDefinitionCodeDto, @Req() req: Request) {
    const organizationCode = this.getOptionalOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    let userRoles: string[] = [];
    if (organizationCode) {
      this.validateOrgAccess(organizations, organizationCode);
      userRoles = this.getUserRoles(organizations, organizationCode);
    }

    return this.client
      .send('work.definition.find.one', {
        workDefinitionCode: dto.workDefinitionCode,
        ...(organizationCode ? { organizationCode } : {}),
        userRoles,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllWorkDefinitionDto, @Req() req: Request) {
    const organizationCode = this.getOptionalOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    let userRoles: string[] = [];
    if (organizationCode) {
      this.validateOrgAccess(organizations, organizationCode);
      userRoles = this.getUserRoles(organizations, organizationCode);
    }

    const parsedFilters =
      typeof dto.filters === 'string'
        ? this.safeJsonParse(dto.filters)
        : dto.filters;

    const parsedOrder =
      typeof dto.order === 'string' ? this.safeJsonParse(dto.order) : dto.order;

    const parsedLimit =
      typeof dto.limit === 'string' ? parseInt(dto.limit, 10) : dto.limit;

    const parsedOffset =
      typeof dto.offset === 'string' ? parseInt(dto.offset, 10) : dto.offset;

    return this.client
      .send('work.definition.find.all', {
        ...(organizationCode ? { organizationCode } : {}),
        userRoles,
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

  @UseGuards(AuthGuard)
  @Patch(':workDefinitionCode')
  update(
    @Param() params: WorkDefinitionCodeDto,
    @Body() dto: UpdateWorkDefinitionDto,
    @User() user: CurrentUser,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    const userRoles = this.getUserRoles(organizations, organizationCode);

    return this.client
      .send('work.definition.update', {
        workDefinitionCode: params.workDefinitionCode,
        ...dto,
        actorId: this.getActorId(user),
        actorName: this.getActorName(user),
        userRoles,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
