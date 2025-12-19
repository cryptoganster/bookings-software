import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DeactivateUserCommand } from '@auth/app/commands/deactivate-user/command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DeactivateUserHandler.name);
  }

  async execute(command: DeactivateUserCommand): Promise<void> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'DeactivateUserCommand',
        userId: command.userId,
        timestamp: new Date().toISOString(),
      },
      'Executing DeactivateUserCommand',
    );

    try {
      // Load User via Factory
      const user = await this.userFactory.loadById(command.userId);

      if (!user) {
        this.logger.warn(
          {
            commandName: 'DeactivateUserCommand',
            userId: command.userId,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // Execute business logic
      user.deactivate();

      // Save via WriteRepository
      await this.userWriteRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'DeactivateUserCommand',
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'DeactivateUserCommand executed successfully',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'DeactivateUserCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'DeactivateUserCommand failed',
      );
      throw error;
    }
  }
}
