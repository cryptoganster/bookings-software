import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MessageModel } from '../../conversation/infra/persistence/models/message.model';
import { CreateMessageDto } from './types';

/**
 * TestMessageHelper - Helper for Message entity in E2E tests
 *
 * Provides methods to create and manage messages for testing purposes.
 * Automatically tracks created entities for cleanup.
 *
 * @example
 * ```typescript
 * const messageHelper = new TestMessageHelper(dataSource);
 * const message = await messageHelper.createMessage({
 *   conversationId: conversation.id,
 *   direction: 'INBOUND',
 *   content: 'Hello',
 * });
 * await messageHelper.cleanup(); // Removes all created messages
 * ```
 */
export class TestMessageHelper {
  private createdMessages: string[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates a message for testing
   *
   * @param dto - Message creation data
   * @returns Created message model
   *
   * @example
   * ```typescript
   * const message = await messageHelper.createMessage({
   *   conversationId: conversation.id,
   *   direction: 'INBOUND',
   *   content: 'I want to book an appointment',
   *   messageType: 'TEXT',
   * });
   * ```
   */
  async createMessage(dto: CreateMessageDto): Promise<MessageModel> {
    const repo = this.dataSource.getRepository(MessageModel);

    const message = repo.create({
      id: dto.id || uuidv4(),
      conversationId: dto.conversationId,
      direction: dto.direction,
      content: dto.content,
      messageType: dto.messageType || 'TEXT',
      sentAt: dto.sentAt || new Date(),
      isFromAdmin: dto.isFromAdmin || false,
    });

    const saved = await repo.save(message);
    this.createdMessages.push(saved.id);

    return saved;
  }

  /**
   * Cleans up all messages created by this helper
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await messageHelper.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.createdMessages.length === 0) {
      return;
    }

    try {
      const repo = this.dataSource.getRepository(MessageModel);
      await repo.delete(this.createdMessages);
      this.createdMessages = [];
    } catch (error) {
      console.error('Failed to cleanup messages:', error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

/**
 * Creates a message directly in the database (for integration tests)
 *
 * This is a standalone function that doesn't track entities for cleanup.
 * Use TestMessageHelper for E2E tests that need automatic cleanup.
 *
 * @param dataSource - TypeORM DataSource
 * @param dto - Message creation data
 * @returns Created message model
 *
 * @example
 * ```typescript
 * const message = await createMessageInDb(dataSource, {
 *   conversationId: 'conversation-uuid',
 *   direction: 'OUTBOUND',
 *   content: 'Your appointment is confirmed',
 * });
 * ```
 */
export async function createMessageInDb(
  dataSource: DataSource,
  dto: CreateMessageDto,
): Promise<MessageModel> {
  const repo = dataSource.getRepository(MessageModel);

  const message = repo.create({
    id: dto.id || uuidv4(),
    conversationId: dto.conversationId,
    direction: dto.direction,
    content: dto.content,
    messageType: dto.messageType || 'TEXT',
    sentAt: dto.sentAt || new Date(),
    isFromAdmin: dto.isFromAdmin || false,
  });

  return repo.save(message);
}
