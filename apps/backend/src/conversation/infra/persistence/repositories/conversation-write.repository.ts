import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '@conversation/domain/aggregates/conversation';
import { IConversationWriteRepository } from '@conversation/domain/interfaces/repositories/conversation-write';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { ConversationWriteMapper } from '@conversation/infra/persistence/mappers/conversation-write.mapper';
import { IUnitOfWork } from '@shared/kernel/uow';
import { ConcurrencyException } from '@shared/kernel/exceptions/concurrency';

/**
 * ConversationWriteRepository
 *
 * Repository real con TypeORM para persistir conversations.
 * Implementa optimistic locking con campo version.
 *
 * @remarks
 * - Usa IUnitOfWork para transacciones
 * - Detecta INSERT vs UPDATE automáticamente
 * - Lanza ConcurrencyException si version no coincide
 * - Incrementa version en cada UPDATE
 */
@Injectable()
export class ConversationWriteRepository implements IConversationWriteRepository {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  /**
   * Persiste una conversation (INSERT o UPDATE)
   *
   * @param conversation - Aggregate a persistir
   * @throws ConcurrencyException si version no coincide (UPDATE)
   */
  async save(conversation: Conversation): Promise<void> {
    await this.uow.transaction(async () => {
      const model = ConversationWriteMapper.toModel(conversation);
      const currentVersion = conversation.getVersion().getValue();

      // Check if conversation exists
      const existing = await this.repository.findOne({
        where: { id: model.id },
        select: ['id', 'version'],
      });

      if (!existing) {
        // INSERT: New conversation
        await this.repository.save(model);
      } else {
        // UPDATE: Existing conversation with optimistic locking
        const result = await this.repository
          .createQueryBuilder()
          .update(ConversationModel)
          .set({
            businessId: model.businessId,
            customerId: model.customerId,
            customerPhone: model.customerPhone,
            status: model.status,
            state: model.state,
            selectedOfferingId: model.selectedOfferingId,
            selectedDate: model.selectedDate,
            selectedTime: model.selectedTime,
            createdAppointmentId: model.createdAppointmentId,
            version: currentVersion + 1,
          })
          .where('id = :id', { id: model.id })
          .andWhere('version = :version', { version: currentVersion })
          .execute();

        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Conversation ${model.id} was modified by another transaction`,
          );
        }
      }
    });
  }
}
