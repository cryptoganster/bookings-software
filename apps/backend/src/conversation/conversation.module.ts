import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Import AvailabilityModule to access ICapacityReadRepository
import { AvailabilityModule } from '@availability/availability.module';

// Command Handlers
import { ProcessIncomingMessageHandler } from '@conversation/app/commands/process-incoming-message/handler';

// Query Handlers
import { GetAvailableDatesHandler } from '@conversation/app/queries/get-available-dates/handler';
import { GetAvailableTimeSlotsHandler } from '@conversation/app/queries/get-available-time-slots/handler';

// External clients
import { WhatsAppBusinessApiClient } from '@conversation/infra/external/whatsapp-business-api-client';

// Factories
import { ConversationFactory } from '@conversation/infra/persistence/factories/conversation-factory';

// Controllers
import { WebhookController } from '@conversation/presentation/controllers/webhook';

// Guards
import { WhatsAppSignatureGuard } from '@conversation/presentation/guards/whatsapp-signature';

// Mock repositories for conversation (will be implemented later)
// Using a global Map so it can be cleared between tests
const conversationsStore = new Map();

/**
 * TEMPORARY Mock Write Repository
 *
 * NOTE: This mock still includes read methods (findByCustomerIdAndBusinessId)
 * which violates CQRS strict compliance. This is acceptable temporarily because:
 * 1. No real persistence layer exists yet (no TypeORM models)
 * 2. ConversationFactory is implemented but returns null (waiting for persistence)
 * 3. ProcessIncomingMessageHandler still uses the mock directly
 *
 * TODO: When real persistence is implemented:
 * 1. Remove findByCustomerIdAndBusinessId from this mock
 * 2. Update ConversationFactory to use real TypeORM repository
 * 3. Update ProcessIncomingMessageHandler to use IConversationFactory
 * 4. This mock should only have save() method
 */
class MockConversationWriteRepository {
  // TEMPORARY: This method should be in IConversationFactory instead
  findByCustomerIdAndBusinessId(
    customerId: { getValue: () => string },
    businessId: { getValue: () => string },
  ): Promise<unknown> {
    const key = `${customerId.getValue()}-${businessId.getValue()}`;
    return Promise.resolve(conversationsStore.get(key) || null);
  }

  save(conversation: {
    getCustomerId: () => { getValue: () => string };
    getBusinessId: () => { getValue: () => string };
  }): Promise<void> {
    const key = `${conversation.getCustomerId().getValue()}-${conversation.getBusinessId().getValue()}`;
    conversationsStore.set(key, conversation);
    return Promise.resolve();
  }

  // Method to clear all conversations (for testing)
  clear(): void {
    conversationsStore.clear();
  }
}

// Export the store for testing purposes
export { conversationsStore };

const CommandHandlers = [ProcessIncomingMessageHandler];

const QueryHandlers = [GetAvailableDatesHandler, GetAvailableTimeSlotsHandler];

@Module({
  imports: [
    CqrsModule,
    AvailabilityModule, // Import AvailabilityModule to access ICapacityReadRepository
  ],
  controllers: [WebhookController],
  providers: [
    // Command Handlers
    ...CommandHandlers,

    // Query Handlers
    ...QueryHandlers,

    // Guards
    WhatsAppSignatureGuard,

    // Factories
    {
      provide: 'IConversationFactory',
      useClass: ConversationFactory,
    },

    // Repositories
    {
      provide: 'IConversationWriteRepository',
      useClass: MockConversationWriteRepository,
    },
    // ICapacityReadRepository is provided by AvailabilityModule

    // External clients
    {
      provide: 'IWhatsAppClient',
      useClass: WhatsAppBusinessApiClient,
    },
  ],
  exports: ['IConversationFactory', 'IConversationWriteRepository', 'IWhatsAppClient'],
})
export class ConversationModule {}
