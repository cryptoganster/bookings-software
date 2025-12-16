import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { RegisterCommand } from './command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RegisterHandler.name);
  }

  async execute(command: RegisterCommand): Promise<{ userId: string; accessToken: string }> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'RegisterCommand',
        email: command.email,
        name: command.name,
        timestamp: new Date().toISOString(),
      },
      'Executing RegisterCommand',
    );

    try {
      // Verificar si el usuario ya existe (usando READ repository)
      const existingUser = await this.userReadRepository.findByEmail(command.email);
      if (existingUser) {
        this.logger.warn(
          {
            commandName: 'RegisterCommand',
            email: command.email,
            timestamp: new Date().toISOString(),
          },
          'User with this email already exists',
        );
        throw new ConflictException('User with this email already exists');
      }

      // Crear nuevo usuario
      const userId = UUID.generate();
      const email = Email.fromString(command.email);
      const user = await User.create(userId, email, command.password, command.name);

      // Guardar usuario (usando WRITE repository)
      await this.userWriteRepository.save(user);

      // Generar JWT token
      const payload = {
        sub: userId.getValue(),
        email: email.getValue(),
      };
      const accessToken = this.jwtService.sign(payload);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'RegisterCommand',
          userId: userId.getValue(),
          email: email.getValue(),
          duration,
          timestamp: new Date().toISOString(),
        },
        'RegisterCommand executed successfully',
      );

      return {
        userId: userId.getValue(),
        accessToken,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'RegisterCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          email: command.email,
          duration,
          timestamp: new Date().toISOString(),
        },
        'RegisterCommand failed',
      );
      throw error;
    }
  }
}
