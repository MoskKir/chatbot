import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnonRateLimitService {
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.limit = this.config.get<number>('ANON_MESSAGE_LIMIT', 3);
    this.windowMs = this.config.get<number>(
      'ANON_RATE_LIMIT_WINDOW_MS',
      24 * 60 * 60 * 1000, // 24 hours
    );
  }

  async check(
    anonId: string,
  ): Promise<{ allowed: boolean; remaining: number; resetsAt: Date | null }> {
    const usage = await this.prisma.anonUsage.findUnique({
      where: { id: anonId },
    });

    if (!usage) {
      return { allowed: true, remaining: this.limit, resetsAt: null };
    }

    // Window expired — treat as fresh
    if (usage.resetAt <= new Date()) {
      return { allowed: true, remaining: this.limit, resetsAt: null };
    }

    const remaining = Math.max(0, this.limit - usage.count);
    return {
      allowed: usage.count < this.limit,
      remaining,
      resetsAt: usage.resetAt,
    };
  }

  async increment(anonId: string) {
    const now = new Date();
    const usage = await this.prisma.anonUsage.findUnique({
      where: { id: anonId },
    });

    if (!usage || usage.resetAt <= now) {
      // New window
      const resetAt = new Date(now.getTime() + this.windowMs);
      await this.prisma.anonUsage.upsert({
        where: { id: anonId },
        create: { id: anonId, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
    } else {
      // Same window — increment
      await this.prisma.anonUsage.update({
        where: { id: anonId },
        data: { count: { increment: 1 } },
      });
    }
  }

  getLimit() {
    return this.limit;
  }
}
