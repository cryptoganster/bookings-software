import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '@shared/shared.module';
import { JwtStrategy } from './infra/strategies/jwt';
import { UserModel } from './infra/persistence/models/user';
import { UserWriteRepository } from './infra/persistence/repositories/user-write';
import { UserReadRepository } from './infra/persistence/repositories/user-read';
import { RegisterHandler } from './app/commands/register';
import { LoginHandler } from './app/commands/login';
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
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '1d',
        } as any,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    RegisterHandler,
    LoginHandler,
    {
      provide: 'IUserWriteRepository',
      useClass: UserWriteRepository,
    },
    {
      provide: 'IUserReadRepository',
      useClass: UserReadRepository,
    },
  ],
  exports: [JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
