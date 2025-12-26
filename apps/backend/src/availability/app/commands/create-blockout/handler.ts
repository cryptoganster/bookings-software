import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateBlockoutCommand } from '@availability/app/commands/create-blockout/command';
import { IBlockoutWriteRepository } from '@availability/domain/interfaces/repositories/blockout-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';
import { Blockout } from '@availability/domain/aggregates/blockout';
import { DateRange } from '@availability/domain/vo/date-range.vo';

/**
 * Handler for CreateBlockoutCommand
 *
 * Creates a new blockout period for a business.
 *
 * Requirements: 2.1, 2.2, 2.3
 */
@CommandHandler(CreateBlockoutCommand)
export class CreateBlockoutHandler implements ICommandHandler<CreateBlockoutCommand> {
  constructor(
    @Inject('IBlockoutWriteRepository')
    private readonly blockoutWriteRepository: IBlockoutWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: CreateBlockoutCommand): Promise<{ blockoutId: string }> {
    return await this.uow.transaction(async () => {
      // Crear value objects
      const dateRange = DateRange.create(command.startDate, command.endDate);

      // Crear aggregate
      const blockoutId = UUID.generate();
      const blockout = Blockout.create(
        blockoutId,
        UUID.fromString(command.businessId),
        dateRange,
        command.reason,
      );

      // Persistir
      await this.blockoutWriteRepository.save(blockout);

      return { blockoutId: blockoutId.getValue() };
    });
  }
}
