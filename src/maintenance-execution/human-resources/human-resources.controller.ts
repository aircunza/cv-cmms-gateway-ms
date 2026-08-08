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
  CreateHumanResourceDto,
  UpdateHumanResourceDto,
  FindAllHumanResourceDto,
  HumanResourceIdDto,
} from './dto';

@Controller('human-resources')
export class HumanResourcesController {
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
  create(@Body() dto: CreateHumanResourceDto, @User() user: CurrentUser) {
    return this.client
      .send('human.resource.create', {
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
  @Get(':resourceCode')
  findOne(
    @Param() params: { resourceCode: string },
    @Query() dto: { organizationCode: string },
  ) {
    return this.client
      .send('human.resource.find.one', {
        resourceCode: params.resourceCode,
        organizationCode: dto.organizationCode,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllHumanResourceDto) {
    return this.client.send('human.resource.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':resourceCode')
  update(
    @Param() params: { resourceCode: string },
    @Query() query: { organizationCode: string },
    @Body() dto: UpdateHumanResourceDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('human.resource.update', {
        resourceCode: params.resourceCode,
        organizationCode: query.organizationCode,
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
  @Patch(':resourceCode/deactivate')
  deactivate(
    @Param() params: { resourceCode: string },
    @Query() query: { organizationCode: string },
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('human.resource.deactivate', {
        resourceCode: params.resourceCode,
        organizationCode: query.organizationCode,
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
