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
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { NATS_SERVICE } from 'src/config';
import {
  CreateUserOrgPermissionDto,
  FindAllUserOrgPermissionsDto,
  FindOneUserOrgPermissionDto,
  UpdateUserOrgPermissionDto,
} from './dto';

@Controller('user-org-permissions')
export class UserOrgPermissionsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  @UseGuards(AuthGuard)
  @Post()
  createUserOrgPermission(
    @Body() createUserOrgPermissionDto: CreateUserOrgPermissionDto,
  ) {
    return this.client
      .send('user.org.permissions.create', createUserOrgPermissionDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':userId/:organizationId')
  findOneUserOrgPermission(
    @Param() findOneUserOrgPermissionDto: FindOneUserOrgPermissionDto,
  ) {
    return this.client
      .send('user.org.permissions.find.one', findOneUserOrgPermissionDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAllUserOrgPermissions(
    @Query() findAllUserOrgPermissionsDto: FindAllUserOrgPermissionsDto,
  ) {
    return this.client
      .send('user.org.permissions.find.all', findAllUserOrgPermissionsDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':userId/:organizationId')
  updateUserOrgPermission(
    @Param() findOneUserOrgPermissionDto: FindOneUserOrgPermissionDto,
    @Body() updateUserOrgPermissionDto: UpdateUserOrgPermissionDto,
  ) {
    return this.client
      .send('user.org.permissions.update', {
        userId: findOneUserOrgPermissionDto.userId,
        organizationId: findOneUserOrgPermissionDto.organizationId,
        updates: updateUserOrgPermissionDto,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':userId/:organizationId/deactivate')
  deactivateUserOrgPermission(
    @Param() findOneUserOrgPermissionDto: FindOneUserOrgPermissionDto,
  ) {
    return this.client
      .send('user.org.permissions.deactivate', findOneUserOrgPermissionDto)
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
