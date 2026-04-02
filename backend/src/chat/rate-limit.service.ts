import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateBucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter for authenticated users.
 * Prevents abuse of LLM API by limiting messages per window.
 */
@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateBucket>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(private config: ConfigService) {
    this.limit = this.config.get<number>('AUTH_RATE_LIMIT', 60);
    this.windowMs = this.config.get<number>(
      'AUTH_RATE_LIMIT_WINDOW_MS',
      60 * 1000, // 1 minute
    );
  }

  check(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const bucket = this.buckets.get(userId);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(userId, { count: 0, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.limit };
    }

    const remaining = Math.max(0, this.limit - bucket.count);
    return { allowed: bucket.count < this.limit, remaining };
  }

  increment(userId: string) {
    const now = Date.now();
    const bucket = this.buckets.get(userId);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(userId, { count: 1, resetAt: now + this.windowMs });
    } else {
      bucket.count++;
    }
  }
}
