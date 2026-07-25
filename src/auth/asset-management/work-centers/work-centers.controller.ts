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
  CreateWorkCenterDto,
  FindAllWorkCentersDto,
  UpdateWorkCenterDto,
  WorkCenterIdDto,
} from './dto';

@Controller('work-centers')
export class WorkCentersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  private toRpcError(error: unknown): string | object {
    if (typeof error === 'object' && error !== null) {
      return error;
    }

    return String(error);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateWorkCenterDto) {
    return this.client.send('work.center.create', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param() dto: WorkCenterIdDto) {
    return this.client.send('work.center.find.one', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() dto: FindAllWorkCentersDto) {
    return this.client.send('work.center.find.all', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param() params: WorkCenterIdDto, @Body() dto: UpdateWorkCenterDto) {
    return this.client
      .send('work.center.update', {
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
  deactivate(@Param() dto: WorkCenterIdDto) {
    return this.client.send('work.center.deactivate', dto).pipe(
      catchError((error: unknown) => {
        throw new RpcException(this.toRpcError(error));
      }),
    );
  }
}
