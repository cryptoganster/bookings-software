import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { Logger } from '@nestjs/common';

/**
 * OnAppointmentCreatedHandler
 *
 * Event handler que registra cuando se crea una cita.
 *
 * @remarks
 * - Escucha AppointmentCreated del Booking BC
 * - Logs el evento para tracking
 * - No propaga errores (fire-and-forget)
 * - TODO: Implement WhatsApp notification when Customer phone lookup is available
 */
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  private readonly logger = new Logger(OnAppointmentCreatedHandler.name);

  async handle(event: AppointmentCreated): Promise<void> {
    try {
      this.logger.log(
        `Appointment created: ${event.appointmentId}. WhatsApp notification will be handled by Notification BC.`,
      );

      // TODO: Implement when Customer BC provides phone number lookup
      // TODO: Implement when Conversation BC can create/find conversations
      // For now, this is a placeholder that logs the event
      // The actual WhatsApp notification should be sent by Notification BC

      this.logger.debug({
        appointmentId: event.appointmentId,
        customerId: event.customerId,
        dateTime: event.dateTime,
        message: 'Appointment confirmation notification pending',
      });
    } catch (error) {
      // No propagar error - fire-and-forget
      this.logger.error(
        `Error processing appointment created event ${event.appointmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
