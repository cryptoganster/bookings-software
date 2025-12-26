import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { Injectable, Logger } from '@nestjs/common';

// Placeholder commands - these will be implemented in future bounded contexts
class CancelReminderCommand {
  constructor(public readonly appointmentId: string) {}
}

class SendWhatsAppMessageCommand {
  constructor(
    public readonly customerId: string,
    public readonly message: string,
  ) {}
}

@Injectable()
@EventsHandler(AppointmentCancelled)
export class OnAppointmentCancelledHandler implements IEventHandler<AppointmentCancelled> {
  private readonly logger = new Logger(OnAppointmentCancelledHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentCancelled): Promise<void> {
    try {
      // Cancelar recordatorio
      await this.commandBus.execute(new CancelReminderCommand(event.appointmentId));

      // Enviar notificación de cancelación por WhatsApp
      // Nota: En un escenario real, necesitaríamos obtener el customerId del appointment
      // Por ahora, esto es un placeholder
      await this.commandBus.execute(
        new SendWhatsAppMessageCommand('customer-id-placeholder', 'Tu cita ha sido cancelada'),
      );
    } catch (error) {
      // Log error but don't propagate - event handlers should not throw
      this.logger.error(
        'Error handling AppointmentCancelled',
        error instanceof Error ? error.stack : String(error),
        {
          appointmentId: event.appointmentId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }
}
