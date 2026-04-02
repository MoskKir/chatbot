import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthProviderService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.get<string>('SUPABASE_URL', ''),
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY', ''),
    );
  }

  async verifyToken(token: string) {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser(token);
    if (error || !user) return null;
    return user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return { error: error.message };
    }

    // Auto sign-in after registration
    const signInResult = await this.signIn(email, password);
    if (signInResult.error) {
      return signInResult;
    }

    return {
      user: { id: data.user.id, email: data.user.email },
      session: signInResult.session,
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      user: { id: data.user.id, email: data.user.email },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    };
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      },
    };
  }
}
