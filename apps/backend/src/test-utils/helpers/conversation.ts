import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationModel } from '../../conversation/infra/persistence/models/conversation.model';
import { CreateConversationDto } from './types';

/**
 * TestConversationHelper - Helper for Conversation BC in E2E tests
 *
 * Provides methods to create and manage conversations for testing purposes.
 * Automatically tracks created entities for cleanup.
 *
 * @example
 * ```typescript
 * const conversationHelper = new TestConversationHelper(dataSource);
 * const conversation = await conversationHelper.createConversation({
 *   businessId: business.id,
 *   customerId: customer.id,
 *   customerPhone: '+18095551234',
 * });
 * await conversationHelper.cleanup(); // Removes all created conversations
 * ```
 */
export class TestConversationHelper {
  private createdConversations: string[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates a conversation for testing
   *
   * @param dto - Conversation creation data
   * @returns Created conversation model
   *
   * @example
   * ```typescript
   * const conversation = await conversationHelper.createConversation({
   *   businessId: business.id,
   *   customerId: customer.id,
   *   customerPhone: '+18095551234',
   *   status: 'ACTIVE',
   *   state: 'GREETING',
   * });
   * ```
   */
  async createConversation(dto: CreateConversationDto): Promise<ConversationModel> {
    const repo = this.dataSource.getRepository(ConversationModel);

    const conversation = repo.create({
      id: dto.id || uuidv4(),
      businessId: dto.businessId,
      customerId: dto.customerId,
      customerPhone: dto.customerPhone,
      status: dto.status || 'ACTIVE',
      state: dto.state || 'GREETING',
      selectedOfferingId: dto.selectedOfferingId || undefined,
      selectedDate: dto.selectedDate || undefined,
      selectedTime: dto.selectedTime || undefined,
      createdAppointmentId: dto.createdAppointmentId || undefined,
      lastMessageAt: dto.lastMessageAt || new Date(),
      version: dto.version || 0,
    });

    const saved = await repo.save(conversation);
    this.createdConversations.push(saved.id);

    return saved;
  }

  /**
   * Cleans up all conversations created by this helper
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await conversationHelper.cleanup();
   * });
   * ```
   */
  async cleanup(): Promise<void> {
    if (this.createdConversations.length === 0) {
      return;
    }

    try {
      const repo = this.dataSource.getRepository(ConversationModel);
      await repo.delete(this.createdConversations);
      this.createdConversations = [];
    } catch (error) {
      console.error('Failed to cleanup conversations:', error);
      // Don't throw - cleanup should be best-effort
    }
  }
}

/**
 * Creates a conversation directly in the database (for integration tests)
 *
 * This is a standalone function that doesn't track entities for cleanup.
 * Use TestConversationHelper for E2E tests that need automatic cleanup.
 *
 * @param dataSource - TypeORM DataSource
 * @param dto - Conversation creation data
 * @returns Created conversation model
 *
 * @example
 * ```typescript
 * const conversation = await createConversationInDb(dataSource, {
 *   businessId: 'business-uuid',
 *   customerId: 'customer-uuid',
 *   customerPhone: '+18095551234',
 * });
 * ```
 */
export async function createConversationInDb(
  dataSource: DataSource,
  dto: CreateConversationDto,
): Promise<ConversationModel> {
  const repo = dataSource.getRepository(ConversationModel);

  const conversation = repo.create({
    id: dto.id || uuidv4(),
    businessId: dto.businessId,
    customerId: dto.customerId,
    customerPhone: dto.customerPhone,
    status: dto.status || 'ACTIVE',
    state: dto.state || 'GREETING',
    selectedOfferingId: dto.selectedOfferingId || undefined,
    selectedDate: dto.selectedDate || undefined,
    selectedTime: dto.selectedTime || undefined,
    createdAppointmentId: dto.createdAppointmentId || undefined,
    lastMessageAt: dto.lastMessageAt || new Date(),
    version: dto.version || 0,
  });

  return repo.save(conversation);
}
