import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Import AvailabilityModule to access ICapacityReadRepository
import { AvailabilityModule } from '@availability/availability.module';

// Command Handlers
import { ProcessIncomingMessageHandler } from './app/commands/process-incoming-message/handler';

// Query Handlers
import { GetAvailableDatesHandler } from './app/queries/get-available-dates/handler';
import { GetAvailableTimeSlotsHandler } from './app/queries/get-available-time-slots/handler';

// External clients
import { WhatsAppBusinessApiClient } from './infra/external/whatsapp-business-api-client';

// Controllers
import { WebhookController } from './presentation/controllers/webhook';

// Guards
import { WhatsAppSignatureGuard } from './presentation/guards/whatsapp-signature';

// Mock repositories for conversation (will be implemented later)
// Using a global Map so it can be cleared between tests
const conversationsStore = new Map();

class MockConversationWriteRepository {
  findByCustomerIdAndBusinessId(customerId: any, businessId: any): Promise<any> {
    const key = `${customerId.getValue()}-${businessId.getValue()}`;
    return Promise.resolve(conversationsStore.get(key) || null);
  }

  save(conversation: any): Promise<void> {
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
  exports: ['IConversationWriteRepository', 'IWhatsAppClient'],
})
export class ConversationModule {}
