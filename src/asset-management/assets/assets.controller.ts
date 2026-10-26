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
      .send('asset.find.all', {
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
