import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { AddUserRoleCommand } from './command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(AddUserRoleCommand)
export class AddUserRoleHandler implements ICommandHandler<AddUserRoleCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AddUserRoleHandler.name);
  }

  async execute(command: AddUserRoleCommand): Promise<void> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'AddUserRoleCommand',
        userId: command.userId,
        role: command.role,
        timestamp: new Date().toISOString(),
      },
      'Executing AddUserRoleCommand',
    );

    try {
      // Load User via Factory
      const user = await this.userFactory.loadById(command.userId);

      if (!user) {
        this.logger.warn(
          {
            commandName: 'AddUserRoleCommand',
            userId: command.userId,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // Execute business logic
      user.addRole(command.role);

      // Save via WriteRepository
      await this.userWriteRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'AddUserRoleCommand',
          userId: command.userId,
          role: command.role,
          duration,
          timestamp: new Date().toISOString(),
        },
        'AddUserRoleCommand executed successfully',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'AddUserRoleCommand',
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
        'AddUserRoleCommand failed',
      );
      throw error;
    }
  }
}
