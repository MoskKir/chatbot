import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AnonRateLimitService } from './anon-rate-limit.service';
import { IdentityService } from '../common/identity.service';

/**
 * Blocks anonymous users who have exhausted their message limit
 * from creating conversations and uploading documents.
 * Authenticated users always pass.
 * Does NOT increment the counter — only checks.
 */
@Injectable()
export class AnonRateLimitGuard implements CanActivate {
  constructor(
    private rateLimitService: AnonRateLimitService,
    private identityService: IdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const identity = this.identityService.fromRequest(req);

    // Authenticated users are never limited
    if (identity.userId) return true;

    if (identity.anonId) {
      const { allowed } = await this.rateLimitService.check(identity.anonId);
      if (!allowed) {
        throw new ForbiddenException(
          'Anonymous limit reached. Please sign in for unlimited access.',
        );
      }
    }

    return true;
  }
}
