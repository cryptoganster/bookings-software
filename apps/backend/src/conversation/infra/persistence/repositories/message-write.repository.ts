import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageWriteRepository } from '@conversation/domain/interfaces/repositories/message-write.repository.interface';
import { Message } from '@conversation/domain/aggregates/message';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { MessageWriteMapper } from '@conversation/infra/persistence/mappers/message-write.mapper';
import { IUnitOfWork } from '@shared/kernel/uow';

/**
 * MessageWriteRepository
 *
 * Implementación del repositorio de escritura para mensajes.
 *
 * @remarks
 * - Usa TypeORM para persistencia
 * - Usa UnitOfWork para transacciones
 * - Usa MessageWriteMapper para conversión
 * - Solo operaciones de escritura (CQRS)
 */
@Injectable()
export class MessageWriteRepository implements IMessageWriteRepository {
  constructor(
    @InjectRepository(MessageModel)
    private readonly repository: Repository<MessageModel>,
    @Inject('IUnitOfWork')
    private readonly uow: IUnitOfWork,
  ) {}

  /**
   * Persiste un mensaje en la base de datos
   *
   * @param message - Aggregate Message a persistir
   * @returns Promise que se resuelve cuando el mensaje es persistido
   */
  async save(message: Message): Promise<void> {
    await this.uow.transaction(async () => {
      const model = MessageWriteMapper.toModel(message);
      await this.repository.save(model);
    });
  }
}
