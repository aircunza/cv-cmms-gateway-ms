import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import type { Request } from 'express';
import { catchError } from 'rxjs';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import type { OrganizationRole } from 'src/auth/interfaces/organization-role.interface';
import { NATS_SERVICE } from 'src/config';
import { OracleWorkOrderCodeDto, OracleOperationCodeDto } from './dto';

@Controller('oracle/work-orders')
export class WorkOrdersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
  }

  private getOrganizationCode(request: Request): string {
    const orgCode = request.headers['x-organization-code'];
    if (!orgCode) {
      throw new BadRequestException('X-Organization-Code header is required');
    }
    return orgCode as string;
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
  @Get(':workOrderCode')
  findOne(@Param() dto: OracleWorkOrderCodeDto, @Req() req: Request) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.work-order.find-one', {
        workOrderCode: dto.workOrderCode,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':workOrderCode/operations')
  findOperations(@Param() dto: OracleWorkOrderCodeDto, @Req() req: Request) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.work-order.operations', {
        workOrderCode: dto.workOrderCode,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':workOrderCode/operations/:operationCode/materials')
  findMaterials(@Param() dto: OracleOperationCodeDto, @Req() req: Request) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.work-order.operation-materials', {
        workOrderCode: dto.workOrderCode,
        operationCode: dto.operationCode,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':workOrderCode/operations/:operationCode/resources')
  findResources(@Param() dto: OracleOperationCodeDto, @Req() req: Request) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.work-order.operation-resources', {
        workOrderCode: dto.workOrderCode,
        operationCode: dto.operationCode,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
