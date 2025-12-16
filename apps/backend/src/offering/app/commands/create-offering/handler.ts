import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CreateOfferingCommand } from './command';
import { IOfferingWriteRepository } from '@offering/domain/interfaces/repositories/offering-write';
import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '@offering/domain/vo/offering-duration';
import { DuplicateOfferingNameException } from '@offering/domain/exceptions/duplicate-offering-name';

@CommandHandler(CreateOfferingCommand)
export class CreateOfferingHandler implements ICommandHandler<CreateOfferingCommand> {
  constructor(
    @Inject('IOfferingWriteRepository')
    private readonly offeringRepository: IOfferingWriteRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateOfferingHandler.name);
  }

  async execute(command: CreateOfferingCommand): Promise<{ offeringId: string }> {
    const startTime = Date.now();
    const offeringId = UUID.generate();

    this.logger.info(
      {
        commandName: 'CreateOfferingCommand',
        businessId: command.businessId,
        name: command.name,
        durationMinutes: command.durationMinutes,
        maxCapacityPerSlot: command.maxCapacityPerSlot,
        maxDailyCapacity: command.maxDailyCapacity,
        timestamp: new Date().toISOString(),
      },
      'Executing CreateOfferingCommand',
    );

    try {
      const businessIdUuid = UUID.fromString(command.businessId);

      // Validate name uniqueness
      const existingOffering = await this.offeringRepository.findByBusinessIdAndName(
        businessIdUuid,
        command.name,
      );

      if (existingOffering) {
        throw new DuplicateOfferingNameException(command.name, command.businessId);
      }

      // Create offering aggregate
      const offering = Offering.create(
        offeringId,
        businessIdUuid,
        command.name,
        OfferingDuration.fromMinutes(command.durationMinutes),
        command.maxCapacityPerSlot,
        command.maxDailyCapacity,
      );

      // Save offering (repository handles transaction internally)
      await this.offeringRepository.save(offering);

      const duration = Date.now() - startTime;
      this.logger.info(
        {
          commandName: 'CreateOfferingCommand',
          offeringId: offeringId.getValue(),
          duration,
          timestamp: new Date().toISOString(),
        },
        'CreateOfferingCommand executed successfully',
      );

      return { offeringId: offeringId.getValue() };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        {
          commandName: 'CreateOfferingCommand',
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
          },
          businessId: command.businessId,
          name: command.name,
          duration,
          timestamp: new Date().toISOString(),
        },
        'CreateOfferingCommand failed',
      );
      throw error;
    }
  }
}
