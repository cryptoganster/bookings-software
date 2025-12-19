import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ActivateUserCommand } from '@auth/app/commands/activate-user/command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ActivateUserHandler.name);
  }

  async execute(command: ActivateUserCommand): Promise<void> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'ActivateUserCommand',
        userId: command.userId,
        timestamp: new Date().toISOString(),
      },
      'Executing ActivateUserCommand',
    );

    try {
      // Load User via Factory
      const user = await this.userFactory.loadById(command.userId);

      if (!user) {
        this.logger.warn(
          {
            commandName: 'ActivateUserCommand',
            userId: command.userId,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // Execute business logic
      user.activate();

      // Save via WriteRepository
      await this.userWriteRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'ActivateUserCommand',
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'ActivateUserCommand executed successfully',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'ActivateUserCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'ActivateUserCommand failed',
      );
      throw error;
    }
  }
}
