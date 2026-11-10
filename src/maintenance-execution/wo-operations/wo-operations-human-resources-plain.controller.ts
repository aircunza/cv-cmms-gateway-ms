import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import type { Request } from 'express';
import { catchError } from 'rxjs';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { OrganizationRole } from 'src/auth/interfaces/organization-role.interface';
import { NATS_SERVICE } from 'src/config';
import { FindHumanResourcesPlainWoOperationDto } from './dto';

const VIEW_PERMISSION = 'mnt.work.orders.view';

@Controller('hours/wo-operations')
export class WoOperationsHumanResourcesPlainController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
  }

  private getPermissions(org: OrganizationRole): string[] {
    const allPermissions = org.roles.flatMap((role) => role.permissions ?? []);
    const allDenied = org.roles.flatMap((role) => role.deniedPermissions ?? []);
    return allPermissions.filter((p) => !allDenied.includes(p));
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
  @Get('human-resources/plain')
  findAllHumanResourcesPlain(
    @Query() dto: FindHumanResourcesPlainWoOperationDto,
    @Req() req: Request,
  ) {
    const organizations = (req['organizations'] ?? []) as OrganizationRole[];

    // Organizaciones donde el usuario tiene mnt.work.orders.view.
    const organizationCodes = organizations
      .filter((org) => this.getPermissions(org).includes(VIEW_PERMISSION))
      .map((org) => org.organizationCode);

    if (organizationCodes.length === 0) {
      throw new ForbiddenException('MISSING_PERMISSION');
    }

    const parsedFilters =
      typeof dto.filters === 'string'
        ? this.parseJsonParam(dto.filters)
        : dto.filters;

    const parsedOrder =
      typeof dto.order === 'string'
        ? this.parseJsonParam(dto.order)
        : dto.order;

    return this.client
      .send('wo.operation.find.human-resources.plain', {
        organizationCodes,
        userPermissions: [VIEW_PERMISSION],
        filters: parsedFilters,
        order: parsedOrder,
        limit: this.parseNonNegativeInt(dto.limit),
        offset: this.parseNonNegativeInt(dto.offset),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
