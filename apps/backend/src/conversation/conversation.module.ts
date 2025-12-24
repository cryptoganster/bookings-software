import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import AvailabilityModule to access ICapacityReadRepository
import { AvailabilityModule } from '@availability/availability.module';
// Import OfferingModule to access GetActiveOfferingsQuery
import { OfferingModule } from '@offering/offering.module';
// Import CustomerModule to access IdentifyCustomerCommand
import { CustomerModule } from '@customer/customer.module';
// Import BookingModule to access CreateAppointmentCommand
import { BookingModule } from '@booking/booking.module';

// Command Handlers
import { ProcessIncomingMessageHandler } from '@conversation/app/commands/process-incoming-message/handler';
import { SendWhatsAppMessageHandler } from '@conversation/app/commands/send-whatsapp-message/handler';
import { SendAdminResponseHandler } from '@conversation/app/commands/send-admin-response/handler';

// Query Handlers
import { GetAvailableDatesHandler } from '@conversation/app/queries/get-available-dates/handler';
import { GetAvailableTimeSlotsHandler } from '@conversation/app/queries/get-available-time-slots/handler';
import { GetConversationHistoryHandler } from '@conversation/app/queries/get-conversation-history/handler';
import { GetPendingAdminQueriesHandler } from '@conversation/app/queries/get-pending-admin-queries/handler';
import { GetConversationHandler } from '@conversation/app/queries/get-conversation/handler';

// Event Handlers
import { OnAppointmentCreatedHandler } from '@conversation/app/event-handlers/on-appointment-created.handler';
import { OnAppointmentCancelledHandler } from '@conversation/app/event-handlers/on-appointment-cancelled.handler';

// External clients
import { WhatsAppBusinessApiClient } from '@conversation/infra/external/whatsapp-business-api-client';

// Factories
import { ConversationFactory } from '@conversation/infra/persistence/factories/conversation-factory';

// Models
import { MessageModel } from '@conversation/infra/persistence/models/message.model';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';

// Repositories
import { MessageWriteRepository } from '@conversation/infra/persistence/repositories/message-write.repository';
import { MessageReadRepository } from '@conversation/infra/persistence/repositories/message-read.repository';
import { ConversationReadRepository } from '@conversation/infra/persistence/repositories/conversation-read.repository';
import { ConversationWriteRepository } from '@conversation/infra/persistence/repositories/conversation-write.repository';

// Controllers
import { WebhookController } from '@conversation/presentation/controllers/webhook';
import { AdminQueryController } from '@conversation/presentation/controllers/admin-query.controller';

// Guards
import { WhatsAppSignatureGuard } from '@conversation/presentation/guards/whatsapp-signature';

const CommandHandlers = [
  ProcessIncomingMessageHandler,
  SendWhatsAppMessageHandler,
  SendAdminResponseHandler,
];

const QueryHandlers = [
  GetAvailableDatesHandler,
  GetAvailableTimeSlotsHandler,
  GetConversationHistoryHandler,
  GetPendingAdminQueriesHandler,
  GetConversationHandler,
];

const EventHandlers = [OnAppointmentCreatedHandler, OnAppointmentCancelledHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([MessageModel, ConversationModel]),
    AvailabilityModule, // Import AvailabilityModule to access ICapacityReadRepository
    OfferingModule, // Import OfferingModule to access GetActiveOfferingsQuery
    CustomerModule, // Import CustomerModule to access IdentifyCustomerCommand
    BookingModule, // Import BookingModule to access CreateAppointmentCommand
  ],
  controllers: [WebhookController, AdminQueryController],
  providers: [
    // Command Handlers
    ...CommandHandlers,

    // Query Handlers
    ...QueryHandlers,

    // Event Handlers
    ...EventHandlers,

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
      useClass: ConversationWriteRepository,
    },
    {
      provide: 'IConversationReadRepository',
      useClass: ConversationReadRepository,
    },
    {
      provide: 'IMessageWriteRepository',
      useClass: MessageWriteRepository,
    },
    {
      provide: 'IMessageReadRepository',
      useClass: MessageReadRepository,
    },
    // ICapacityReadRepository is provided by AvailabilityModule

    // External clients
    {
      provide: 'IWhatsAppClient',
      useClass: WhatsAppBusinessApiClient,
    },
  ],
  exports: [
    'IConversationFactory',
    'IConversationWriteRepository',
    'IConversationReadRepository',
    'IMessageWriteRepository',
    'IMessageReadRepository',
    'IWhatsAppClient',
  ],
})
export class ConversationModule {}
