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
import type { CurrentUser } from 'src/auth/interfaces/current-user.interface';
import { NATS_SERVICE } from 'src/config';
import {
  CreateAssetsTreeDto,
  UpdateAssetsTreeDto,
  FindAllAssetsTreeDto,
} from './dto';

@Controller('assets-tree')
export class AssetsTreeController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) return error;
    return String(error);
  }

  private getActorId(user: CurrentUser) {
    return user.id;
  }

  private getActorName(user: CurrentUser) {
    return user.userShortName ?? '';
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateAssetsTreeDto, @User() user: CurrentUser) {
    return this.client
      .send('assets.tree.create', {
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
  @Get(':id')
  findOne(@Param() params: { id: string }) {
    return this.client
      .send('assets.tree.find.one', { id: +params.id })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllAssetsTreeDto) {
    return this.client.send('assets.tree.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param() params: { id: string },
    @Body() dto: UpdateAssetsTreeDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('assets.tree.update', {
        id: +params.id,
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
  @Patch(':id/deactivate')
  deactivate(@Param() params: { id: string }, @User() user: CurrentUser) {
    return this.client
      .send('assets.tree.deactivate', {
        id: +params.id,
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
