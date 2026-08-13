import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Request } from 'express';

export const AuthToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { auth_token?: string }>();

    if (!request.auth_token) {
      throw new InternalServerErrorException(
        'Auth token not found in request (AuthGuard called?)',
      );
    }

    return request.auth_token;
  },
);
