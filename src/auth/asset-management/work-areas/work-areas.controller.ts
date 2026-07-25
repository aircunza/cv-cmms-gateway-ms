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
  CreateWorkAreaDto,
  FindAllWorkAreasDto,
  UpdateWorkAreaDto,
  WorkAreaIdDto,
} from './dto';

@Controller('work-areas')
export class WorkAreasController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateWorkAreaDto) {
    return this.client.send('work.area.create', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param() dto: WorkAreaIdDto) {
    return this.client.send('work.area.find.one', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllWorkAreasDto) {
    return this.client.send('work.area.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param() params: WorkAreaIdDto, @Body() dto: UpdateWorkAreaDto) {
    return this.client
      .send('work.area.update', {
        id: params.id,
        ...dto,
      })
      .pipe(
        catchError((error: unknown) => {
          throw new RpcException(this.toRpcError(error));
        }),
      );
  }

  @UseGuards(AuthGuard)
  @Patch(':id/deactivate')
  deactivate(@Param() dto: WorkAreaIdDto) {
    return this.client.send('work.area.deactivate', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }
}
