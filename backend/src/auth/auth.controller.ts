import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { AuthProviderService } from './auth-provider.service';
import { IdentityGuard } from './identity.guard';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly isProduction: boolean;

  constructor(
    private authProvider: AuthProviderService,
    private config: ConfigService,
  ) {
    this.isProduction = this.config.get('NODE_ENV') === 'production';
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/api/auth',
    });
  }

  @Post('sign-up')
  async signUp(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authProvider.signUp(body.email, body.password);
    if (result.error) {
      this.logger.warn(`Sign-up failed for ${body.email}: ${result.error}`);
      return { error: result.error };
    }

    this.logger.log(`Sign-up success: ${body.email}`);

    if (result.session?.refresh_token) {
      this.setRefreshCookie(res, result.session.refresh_token);
    }

    return {
      user: result.user,
      session: result.session
        ? {
            access_token: result.session.access_token,
            expires_at: result.session.expires_at,
          }
        : undefined,
    };
  }

  @Post('sign-in')
  async signIn(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authProvider.signIn(body.email, body.password);
    if (result.error) {
      this.logger.warn(`Sign-in failed for ${body.email}: ${result.error}`);
      return { error: result.error };
    }

    this.logger.log(`Sign-in success: ${body.email}`);

    if (result.session?.refresh_token) {
      this.setRefreshCookie(res, result.session.refresh_token);
    }

    return {
      user: result.user,
      session: result.session
        ? {
            access_token: result.session.access_token,
            expires_at: result.session.expires_at,
          }
        : undefined,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    const result = await this.authProvider.refreshSession(refreshToken);
    if (result.error) {
      this.clearRefreshCookie(res);
      return { error: result.error };
    }

    // Supabase rotates refresh tokens — update the cookie
    if (result.session?.refresh_token) {
      this.setRefreshCookie(res, result.session.refresh_token);
    }

    return {
      session: result.session
        ? {
            access_token: result.session.access_token,
            expires_at: result.session.expires_at,
          }
        : undefined,
    };
  }

  @Post('sign-out')
  async signOutEndpoint(@Res({ passthrough: true }) res: Response) {
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  @UseGuards(IdentityGuard)
  @Get('me')
  async me(@Req() req: any) {
    if (!req.user) {
      return { user: null };
    }
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
      },
    };
  }
}
