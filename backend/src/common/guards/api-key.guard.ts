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

    // Extract API key from x-api-key header (primary) or Authorization: Bearer (secondary)
    let apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7); // Extract token after "Bearer "
      }
    }

    if (!apiKey) {
      throw new UnauthorizedException({
        message: 'API key is required',
        code: 'API_KEY_MISSING',
      });
    }

    const apiKeyId = await this.apiKeysService.validateKey(apiKey);

    if (!apiKeyId) {
      throw new UnauthorizedException({
        message: 'Invalid or revoked API key',
        code: 'API_KEY_INVALID',
      });
    }

    // Attach apiKeyId to request for future use
    request.apiKeyId = apiKeyId;

    return true;
  }
}
