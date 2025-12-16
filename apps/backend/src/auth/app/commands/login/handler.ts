import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import type { LoginResponseDto } from '@packages/shared-types';
import { LoginCommand } from './command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LoginHandler.name);
  }

  async execute(command: LoginCommand): Promise<LoginResponseDto> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'LoginCommand',
        email: command.email,
        timestamp: new Date().toISOString(),
      },
      'Executing LoginCommand',
    );

    try {
      // Buscar usuario por email (usando FACTORY para cargar aggregate con lógica de negocio)
      const user = await this.userFactory.loadByEmail(command.email);
      if (!user) {
        this.logger.warn(
          {
            commandName: 'LoginCommand',
            email: command.email,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Validar password (requiere el aggregate completo con el método validatePassword)
      const isPasswordValid = await user.validatePassword(command.password);
      if (!isPasswordValid) {
        this.logger.warn(
          {
            commandName: 'LoginCommand',
            email: command.email,
            userId: user.getId().getValue(),
            timestamp: new Date().toISOString(),
          },
          'Invalid password',
        );
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generar JWT token
      const payload = {
        sub: user.getId().getValue(),
        email: user.getEmail().getValue(),
        businessId: user.getBusinessId()?.getValue(),
      };
      const token = this.jwtService.sign(payload);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'LoginCommand',
          userId: user.getId().getValue(),
          email: user.getEmail().getValue(),
          duration,
          timestamp: new Date().toISOString(),
        },
        'LoginCommand executed successfully',
      );

      // Retornar respuesta según el contrato de shared-types
      return {
        user: {
          id: user.getId().getValue(),
          email: user.getEmail().getValue(),
          name: user.getName(),
          businessId: user.getBusinessId()?.getValue() ?? null,
          createdAt: user.getCreatedAt().toISOString(),
        },
        token,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'LoginCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          email: command.email,
          duration,
          timestamp: new Date().toISOString(),
        },
        'LoginCommand failed',
      );
      throw error;
    }
  }
}
