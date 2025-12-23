import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageReadRepository } from '@conversation/domain/interfaces/repositories/message-read.repository.interface';
import { MessageReadModel } from '@conversation/domain/read-models/message';
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { MessageReadMapper } from '@conversation/infra/persistence/mappers/message-read.mapper';

/**
 * MessageReadRepository
 *
 * Implementación del repositorio de lectura para mensajes.
 *
 * @remarks
 * - Usa TypeORM para queries
 * - Usa MessageReadMapper para conversión
 * - Solo operaciones de lectura (CQRS)
 * - Retorna MessageReadModel (DTOs)
 */
@Injectable()
export class MessageReadRepository implements IMessageReadRepository {
  constructor(
    @InjectRepository(MessageModel)
    private readonly repository: Repository<MessageModel>,
  ) {}

  /**
   * Obtiene todos los mensajes de una conversación
   *
   * @param conversationId - UUID de la conversación
   * @returns Array de MessageReadModel ordenados por sentAt ASC
   */
  async findByConversationId(conversationId: string): Promise<MessageReadModel[]> {
    const messages = await this.repository
      .createQueryBuilder('message')
      .where('message.conversation_id = :conversationId', { conversationId })
      .orderBy('message.sent_at', 'ASC')
      .getRawMany();

    return messages.map((raw) => MessageReadMapper.toReadModel(raw));
  }
}
