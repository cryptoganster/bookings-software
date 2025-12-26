import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationReadRepository } from '@conversation/domain/interfaces/repositories/conversation-read';
import { ConversationReadModel } from '@conversation/domain/read-models/conversation';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';

/**
 * ConversationReadRepository
 *
 * Implementación de IConversationReadRepository usando TypeORM.
 * Retorna ConversationReadModel (DTOs) para queries.
 *
 * @remarks
 * - Hace JOIN con customers table para denormalizar customerName y customerPhone
 * - Ordena por lastMessageAt DESC para mostrar conversaciones más recientes primero
 * - Solo operaciones de lectura (CQRS strict compliance)
 */
@Injectable()
export class ConversationReadRepository implements IConversationReadRepository {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
  ) {}

  async findById(id: string): Promise<ConversationReadModel | null> {
    const result = await this.repository
      .createQueryBuilder('conversation')
      .leftJoin('customers', 'customer', 'customer.id = conversation.customerId')
      .select([
        'conversation.id as id',
        'conversation.businessId as "businessId"',
        'conversation.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'conversation.status as status',
        'conversation.lastMessageAt as "lastMessageAt"',
        'conversation.createdAt as "createdAt"',
      ])
      .where('conversation.id = :id', { id })
      .getRawOne();

    if (!result) {
      return null;
    }

    return new ConversationReadModel(
      result.id,
      result.businessId,
      result.customerId,
      result.customerName,
      result.customerPhone,
      result.status,
      result.lastMessageAt,
      result.createdAt,
    );
  }

  async findPendingByBusinessId(businessId: string): Promise<ConversationReadModel[]> {
    const results = await this.repository
      .createQueryBuilder('conversation')
      .leftJoin('customers', 'customer', 'customer.id = conversation.customerId')
      .select([
        'conversation.id as id',
        'conversation.businessId as "businessId"',
        'conversation.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'conversation.status as status',
        'conversation.lastMessageAt as "lastMessageAt"',
        'conversation.createdAt as "createdAt"',
      ])
      .where('conversation.businessId = :businessId', { businessId })
      .andWhere('conversation.status = :status', { status: 'AWAITING_ADMIN' })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getRawMany();

    return results.map(
      (result) =>
        new ConversationReadModel(
          result.id,
          result.businessId,
          result.customerId,
          result.customerName,
          result.customerPhone,
          result.status,
          result.lastMessageAt,
          result.createdAt,
        ),
    );
  }

  async findByBusinessId(businessId: string): Promise<ConversationReadModel[]> {
    const results = await this.repository
      .createQueryBuilder('conversation')
      .leftJoin('customers', 'customer', 'customer.id = conversation.customerId')
      .select([
        'conversation.id as id',
        'conversation.businessId as "businessId"',
        'conversation.customerId as "customerId"',
        'customer.name as "customerName"',
        'customer.whatsapp_phone as "customerPhone"',
        'conversation.status as status',
        'conversation.lastMessageAt as "lastMessageAt"',
        'conversation.createdAt as "createdAt"',
      ])
      .where('conversation.businessId = :businessId', { businessId })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getRawMany();

    return results.map(
      (result) =>
        new ConversationReadModel(
          result.id,
          result.businessId,
          result.customerId,
          result.customerName,
          result.customerPhone,
          result.status,
          result.lastMessageAt,
          result.createdAt,
        ),
    );
  }
}
