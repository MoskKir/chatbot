import { Global, Module } from '@nestjs/common';
import { AuthProviderService } from './auth-provider.service';
import { StorageService } from './storage.service';
import { IdentityGuard } from './identity.guard';
import { IdentityService } from '../common/identity.service';
import { AuthController } from './auth.controller';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthProviderService, StorageService, IdentityGuard, IdentityService],
  exports: [AuthProviderService, StorageService, IdentityGuard, IdentityService],
})
export class AuthModule {}
