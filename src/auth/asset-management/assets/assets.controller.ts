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
  AssetIdDto,
  CreateAssetDto,
  FindAllAssetsDto,
  UpdateAssetDto,
} from './dto';

@Controller('assets')
export class AssetsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  private getActorCode(user: CurrentUser) {
    if (!user.code) {
      throw new BadRequestException(
        'Authenticated user code not found in token',
      );
    }

    return user.code;
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateAssetDto, @User() user: CurrentUser) {
    return this.client
      .send('asset.create', {
        ...dto,
        actorCode: this.getActorCode(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Get(':assetCode')
  findOne(@Param() dto: AssetIdDto) {
    return this.client.send('asset.find.one', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllAssetsDto) {
    return this.client.send('asset.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':assetCode')
  update(
    @Param() params: AssetIdDto,
    @Body() dto: UpdateAssetDto,
    @User() user: CurrentUser,
  ) {
    return this.client
      .send('asset.update', {
        assetCode: params.assetCode,
        ...dto,
        actorCode: this.getActorCode(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':assetCode/deactivate')
  deactivate(@Param() params: AssetIdDto, @User() user: CurrentUser) {
    return this.client
      .send('asset.deactivate', {
        assetCode: params.assetCode,
        actorCode: this.getActorCode(user),
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }
}
