import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { RemoveUserRoleCommand } from './command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(RemoveUserRoleCommand)
export class RemoveUserRoleHandler implements ICommandHandler<RemoveUserRoleCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RemoveUserRoleHandler.name);
  }

  async execute(command: RemoveUserRoleCommand): Promise<void> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'RemoveUserRoleCommand',
        userId: command.userId,
        role: command.role,
        timestamp: new Date().toISOString(),
      },
      'Executing RemoveUserRoleCommand',
    );

    try {
      // Load User via Factory
      const user = await this.userFactory.loadById(command.userId);

      if (!user) {
        this.logger.warn(
          {
            commandName: 'RemoveUserRoleCommand',
            userId: command.userId,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // Execute business logic
      user.removeRole(command.role);

      // Save via WriteRepository
      await this.userWriteRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'RemoveUserRoleCommand',
          userId: command.userId,
          role: command.role,
          duration,
          timestamp: new Date().toISOString(),
        },
        'RemoveUserRoleCommand executed successfully',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'RemoveUserRoleCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          userId: command.userId,
          role: command.role,
          duration,
          timestamp: new Date().toISOString(),
        },
        'RemoveUserRoleCommand failed',
      );
      throw error;
    }
  }
}
