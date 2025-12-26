import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PinoLogger } from 'nestjs-pino';
import { RegisterCommand } from '@auth/app/commands/register/command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserUniquenessChecker } from '@auth/domain/interfaces/services/user-uniqueness-checker.interface';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject('IUserUniquenessChecker')
    private readonly uniquenessChecker: IUserUniquenessChecker,
    private readonly jwtService: JwtService,
    private readonly eventPublisher: EventPublisher,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RegisterHandler.name);
  }

  async execute(command: RegisterCommand): Promise<{ userId: string; token: string }> {
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
      // Verificar si el email es único (usando domain service)
      const isUnique = await this.uniquenessChecker.isEmailUnique(command.email);
      if (!isUnique) {
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

      // Crear nuevo usuario con rol inicial del comando
      const userId = UUID.generate();
      const email = Email.fromString(command.email);
      const user = await User.register(
        userId,
        email,
        command.password,
        command.name,
        command.initialRole,
      );

      // Fusionar el aggregate con EventPublisher para habilitar publicación de eventos
      const userWithContext = this.eventPublisher.mergeObjectContext(user);

      // Guardar usuario (usando WRITE repository)
      await this.userWriteRepository.save(userWithContext);

      // Publicar eventos pendientes (UserRegistered)
      userWithContext.commit();

      // Generar JWT token con roles
      const payload = {
        sub: userId.getValue(),
        email: email.getValue(),
        roles: user.getRoles(),
      };
      const token = this.jwtService.sign(payload);

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
        token,
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
