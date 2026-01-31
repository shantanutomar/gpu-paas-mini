import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'API key is required',
        error: 'Unauthorized',
      });
    }

    const apiKeyId = await this.apiKeysService.validateKey(apiKey);

    if (!apiKeyId) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid or revoked API key',
        error: 'Unauthorized',
      });
    }

    // Attach apiKeyId to request for future use
    request.apiKeyId = apiKeyId;

    return true;
  }
}
