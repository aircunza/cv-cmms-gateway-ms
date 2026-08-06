import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';

export const Organizations = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { organizations?: unknown }>();

    if (!('organizations' in request) || !request.organizations) {
      throw new InternalServerErrorException(
        'Organizations not found in request (AuthGuard called?)',
      );
    }

    return request.organizations;
  },
);
