import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RemoveBlockoutCommand } from '@availability/app/commands/remove-blockout/command';
import { IBlockoutFactory } from '@availability/domain/interfaces/factories/blockout-factory';
import { IBlockoutWriteRepository } from '@availability/domain/interfaces/repositories/blockout-write';
import { IUnitOfWork } from '@shared/kernel/uow';
import { BlockoutNotFoundException } from '@availability/domain/exceptions/blockout-not-found.exception';

/**
 * Handler for RemoveBlockoutCommand
 *
 * Removes a blockout period.
 *
 * Requirements: 2.4
 */
@CommandHandler(RemoveBlockoutCommand)
export class RemoveBlockoutHandler implements ICommandHandler<RemoveBlockoutCommand> {
  constructor(
    @Inject('IBlockoutFactory')
    private readonly blockoutFactory: IBlockoutFactory,
    @Inject('IBlockoutWriteRepository')
    private readonly blockoutWriteRepository: IBlockoutWriteRepository,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: RemoveBlockoutCommand): Promise<void> {
    return await this.uow.transaction(async () => {
      // Cargar aggregate
      const blockout = await this.blockoutFactory.loadById(command.blockoutId);

      if (!blockout) {
        throw new BlockoutNotFoundException(command.blockoutId);
      }

      // Llamar método de negocio para publicar evento
      blockout.remove();

      // Eliminar de la base de datos
      await this.blockoutWriteRepository.delete(command.blockoutId);
    });
  }
}
