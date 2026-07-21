import {
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
import { NATS_SERVICE } from 'src/config';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import {
  CreateOrganizationDto,
  FindAllOrganizationsDto,
  FindOneOrganizationDto,
  UpdateOrganizationDto,
} from './dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  @UseGuards(AuthGuard)
  @Post()
  createOrganization(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.client.send('organization.create', createOrganizationDto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOneOrganization(@Param() findOneOrganizationDto: FindOneOrganizationDto) {
    return this.client
      .send('organization.find.one', findOneOrganizationDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAllOrganizations(
    @Query() findAllOrganizationsDto: FindAllOrganizationsDto,
  ) {
    return this.client
      .send('organization.find.all', findAllOrganizationsDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  updateOrganization(
    @Param() findOneOrganizationDto: FindOneOrganizationDto,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.client
      .send('organization.update', {
        id: findOneOrganizationDto.id,
        ...updateOrganizationDto,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':id/deactivate')
  deactivateOrganization(
    @Param() findOneOrganizationDto: FindOneOrganizationDto,
  ) {
    return this.client
      .send('organization.deactivate', findOneOrganizationDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
