import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { Injectable } from '@nestjs/common';

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
      // Log error pero no propagar - los event handlers no deben propagar errores
      console.error('Error handling AppointmentCancelled:', error);
    }
  }
}
