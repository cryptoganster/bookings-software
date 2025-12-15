import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Import BookingModule to access ICapacityReadRepository
import { BookingModule } from '@booking/booking.module';

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
class MockConversationWriteRepository {
  private conversations = new Map();

  async findByCustomerIdAndBusinessId(customerId: any, businessId: any): Promise<any> {
    const key = `${customerId.getValue()}-${businessId.getValue()}`;
    return this.conversations.get(key) || null;
  }

  async save(conversation: any): Promise<void> {
    const key = `${conversation.getCustomerId().getValue()}-${conversation.getBusinessId().getValue()}`;
    this.conversations.set(key, conversation);
  }
}

const CommandHandlers = [ProcessIncomingMessageHandler];

const QueryHandlers = [GetAvailableDatesHandler, GetAvailableTimeSlotsHandler];

@Module({
  imports: [
    CqrsModule,
    BookingModule, // Import BookingModule to access ICapacityReadRepository
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
    // ICapacityReadRepository is provided by BookingModule

    // External clients
    {
      provide: 'IWhatsAppClient',
      useClass: WhatsAppBusinessApiClient,
    },
  ],
  exports: ['IConversationWriteRepository', 'IWhatsAppClient'],
})
export class ConversationModule {}
