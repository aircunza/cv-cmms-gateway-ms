import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
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
import {
  OracleInventoryMaterialCodeDto,
  OracleInventorySearchDto,
} from './dto';

@Controller('oracle/inventory')
export class InventoryController {
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
  @Get(':materialCode')
  findOneByMaterialCode(
    @Param() dto: OracleInventoryMaterialCodeDto,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.inventory.find-one', {
        materialCode: dto.materialCode,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  searchByDescription(
    @Query() dto: OracleInventorySearchDto,
    @Req() req: Request,
  ) {
    const organizationCode = this.getOrganizationCode(req);
    const organizations = req['organizations'] as OrganizationRole[];

    this.validateOrgAccess(organizations, organizationCode);

    return this.client
      .send('oracle.sync.inventory.search', {
        description: dto.description,
        organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
