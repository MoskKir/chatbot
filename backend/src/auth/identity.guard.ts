import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthProviderService } from './auth-provider.service';

/**
 * Extracts user identity from Bearer token if present.
 * Always allows the request — sets `req.user` or leaves it null.
 * Authorization decisions are made downstream by the services.
 */
@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private authProvider: AuthProviderService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization;

    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      const user = await this.authProvider.verifyToken(token);
      req.user = user ?? null;
    } else {
      req.user = null;
    }

    return true;
  }
}
