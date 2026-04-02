import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { Socket } from 'socket.io';
import { AuthProviderService } from '../auth/auth-provider.service';
import type { Identity } from './types';

@Injectable()
export class IdentityService {
  constructor(private authProvider: AuthProviderService) {}

  private normalizeIp(raw: string): string {
    return raw.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
  }

  /**
   * Build a stable anonymous ID by combining fingerprint + IP.
   * This prevents fingerprint spoofing alone from assuming another user's identity.
   */
  private buildAnonId(ip: string, fingerprint?: string): string {
    const normalizedIp = this.normalizeIp(ip);
    const raw = fingerprint
      ? `${normalizedIp}:${fingerprint}`
      : normalizedIp;
    const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
    return `anon_${hash}`;
  }

  fromRequest(req: any): Identity {
    const userId = req.user?.id ?? null;
    if (userId) return { userId, anonId: null };

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const fingerprint = req.headers?.['x-anon-fingerprint'] as
      | string
      | undefined;
    return { userId: null, anonId: this.buildAnonId(ip, fingerprint) };
  }

  async fromSocket(client: Socket): Promise<Identity> {
    const token = client.handshake.auth?.token as string | undefined;
    if (token) {
      const user = await this.authProvider.verifyToken(token);
      if (user) return { userId: user.id, anonId: null };
    }

    const rawIp =
      client.handshake.headers['x-forwarded-for'] ||
      client.handshake.address ||
      'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : rawIp;
    const fingerprint = client.handshake.auth?.fingerprint as
      | string
      | undefined;
    return { userId: null, anonId: this.buildAnonId(ip, fingerprint) };
  }
}
