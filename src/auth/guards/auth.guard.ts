import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    try {
      const response = await firstValueFrom(
        this.client.send<{
          user: unknown;
          organizations: unknown;
          token: string;
        }>('auth.verify.user', token),
      );

      if (
        !response ||
        typeof response !== 'object' ||
        !('user' in response) ||
        !('organizations' in response) ||
        !('token' in response)
      ) {
        throw new UnauthorizedException('Invalid auth response');
      }

      const { user, organizations, token: newToken } = response;
      request['user'] = user;
      request['organizations'] = organizations;
      request['token'] = newToken;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
