import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { SharedModule } from '@shared/shared.module';
import { JwtStrategy } from './infra/strategies/jwt';
import { UserModel } from './infra/persistence/models/user';
import { UserWriteRepository } from './infra/persistence/repositories/user-write';
import { UserReadRepository } from './infra/persistence/repositories/user-read';
import { UserFactory } from './infra/persistence/factories/user-factory';
import { RegisterHandler } from './app/commands/register';
import { LoginHandler } from './app/commands/login';
import { AddUserRoleHandler } from './app/commands/add-user-role';
import { RemoveUserRoleHandler } from './app/commands/remove-user-role';
import { VerifyEmailHandler } from './app/commands/verify-email';
import { DeactivateUserHandler } from './app/commands/deactivate-user';
import { ActivateUserHandler } from './app/commands/activate-user';
import { OnCustomerLinkedToUserHandler } from './app/event-handlers/on-customer-linked-to-user';
import { AuthController } from './presentation/controllers/auth';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    SharedModule,
    TypeOrmModule.forFeature([UserModel]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '1d') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Strategies
    JwtStrategy,

    // Command Handlers
    RegisterHandler,
    LoginHandler,
    AddUserRoleHandler,
    RemoveUserRoleHandler,
    VerifyEmailHandler,
    DeactivateUserHandler,
    ActivateUserHandler,

    // Event Handlers
    OnCustomerLinkedToUserHandler,

    // Repositories
    {
      provide: 'IUserWriteRepository',
      useClass: UserWriteRepository,
    },
    {
      provide: 'IUserReadRepository',
      useClass: UserReadRepository,
    },
    {
      provide: 'IUserFactory',
      useClass: UserFactory,
    },
  ],
  exports: [JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
