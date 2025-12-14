import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { Injectable } from '@nestjs/common';

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
export class OnAppointmentCreatedHandler
  implements IEventHandler<AppointmentCreated>
{
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
          `Tu cita ha sido confirmada para ${event.dateTime}`,
        ),
      );
    } catch (error) {
      // Log error pero no propagar - los event handlers no deben propagar errores
      console.error('Error handling AppointmentCreated:', error);
    }
  }
}
