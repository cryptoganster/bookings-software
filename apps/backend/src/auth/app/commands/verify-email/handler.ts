import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { VerifyEmailCommand } from './command';
import { IUserFactory } from '@auth/domain/interfaces/factories/user-factory';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject('IUserFactory')
    private readonly userFactory: IUserFactory,
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VerifyEmailHandler.name);
  }

  async execute(command: VerifyEmailCommand): Promise<void> {
    const startTime = Date.now();

    this.logger.info(
      {
        commandName: 'VerifyEmailCommand',
        userId: command.userId,
        timestamp: new Date().toISOString(),
      },
      'Executing VerifyEmailCommand',
    );

    try {
      // Load User via Factory
      const user = await this.userFactory.loadById(command.userId);

      if (!user) {
        this.logger.warn(
          {
            commandName: 'VerifyEmailCommand',
            userId: command.userId,
            timestamp: new Date().toISOString(),
          },
          'User not found',
        );
        throw new NotFoundException(`User with id ${command.userId} not found`);
      }

      // Execute business logic
      user.verifyEmail();

      // Save via WriteRepository
      await this.userWriteRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'VerifyEmailCommand',
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'VerifyEmailCommand executed successfully',
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'VerifyEmailCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          userId: command.userId,
          duration,
          timestamp: new Date().toISOString(),
        },
        'VerifyEmailCommand failed',
      );
      throw error;
    }
  }
}
