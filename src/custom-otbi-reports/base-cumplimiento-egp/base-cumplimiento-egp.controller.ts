import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { NATS_SERVICE } from 'src/config';
import { FindAllBaseCumplimientoEgpDto } from './dto';

@Controller('custom-otbi-reports/base-cumplimiento-egp')
export class BaseCumplimientoEgpController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }
    return String(error);
  }

  private safeJsonParse(value: string): unknown {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllBaseCumplimientoEgpDto) {
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
      .send('base.cumplimiento.egp.find.all', {
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
}
