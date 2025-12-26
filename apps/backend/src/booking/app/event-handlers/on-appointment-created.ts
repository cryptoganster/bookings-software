import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { Injectable, Logger } from '@nestjs/common';

// Placeholder commands - these will be implemented in future bounded contexts
class ScheduleReminderCommand {
  constructor(
    public readonly appointmentId: string,
    public readonly dateTime: Date,
  ) {}
}

class SendWhatsAppMessageCommand {
  constructor(
    public readonly customerId: string,
    public readonly message: string,
  ) {}
}

@Injectable()
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  private readonly logger = new Logger(OnAppointmentCreatedHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentCreated): Promise<void> {
    try {
      // Programar recordatorio
      await this.commandBus.execute(
        new ScheduleReminderCommand(event.appointmentId, event.dateTime),
      );

      // Enviar confirmación por WhatsApp
      await this.commandBus.execute(
        new SendWhatsAppMessageCommand(
          event.customerId,
          `Tu cita ha sido confirmada para ${event.dateTime.toISOString()}`,
        ),
      );
    } catch (error) {
      // Log error but don't propagate - event handlers should not throw
      this.logger.error(
        'Error handling AppointmentCreated',
        error instanceof Error ? error.stack : String(error),
        {
          appointmentId: event.appointmentId,
          businessId: event.businessId,
          customerId: event.customerId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
}
