import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@shared/shared.module';
import { BusinessModule } from '@business/business.module';
import { JwtStrategy } from '@auth/infra/strategies/jwt';
import { UserModel } from '@auth/infra/persistence/models/user';
import { UserWriteRepository } from '@auth/infra/persistence/repositories/user-write';
import { UserReadRepository } from '@auth/infra/persistence/repositories/user-read';
import { UserFactory } from '@auth/infra/persistence/factories/user-factory';
import { UserUniquenessChecker } from '@auth/domain/services/user-uniqueness-checker.service';
import { RegisterHandler } from '@auth/app/commands/register';
import { LoginHandler } from '@auth/app/commands/login';
import { AddUserRoleHandler } from '@auth/app/commands/add-user-role';
import { RemoveUserRoleHandler } from '@auth/app/commands/remove-user-role';
import { VerifyEmailHandler } from '@auth/app/commands/verify-email';
import { DeactivateUserHandler } from '@auth/app/commands/deactivate-user';
import { ActivateUserHandler } from '@auth/app/commands/activate-user';
import { OnCustomerLinkedToUserHandler } from '@auth/app/event-handlers/on-customer-linked-to-user';
import { AuthController } from '@auth/presentation/controllers/auth';

@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    SharedModule,
    forwardRef(() => BusinessModule),
    TypeOrmModule.forFeature([UserModel]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1d',
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

    // Domain Services
    {
      provide: 'IUserUniquenessChecker',
      useClass: UserUniquenessChecker,
    },

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
