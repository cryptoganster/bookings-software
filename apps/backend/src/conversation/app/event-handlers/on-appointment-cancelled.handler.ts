import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { Logger } from '@nestjs/common';

/**
 * OnAppointmentCancelledHandler
 *
 * Event handler que registra cuando se cancela una cita.
 *
 * @remarks
 * - Escucha AppointmentCancelled del Booking BC
 * - Logs el evento para tracking
 * - No propaga errores (fire-and-forget)
 * - TODO: Implement WhatsApp notification when Customer phone lookup is available
 */
@EventsHandler(AppointmentCancelled)
export class OnAppointmentCancelledHandler implements IEventHandler<AppointmentCancelled> {
  private readonly logger = new Logger(OnAppointmentCancelledHandler.name);

  async handle(event: AppointmentCancelled): Promise<void> {
    try {
      this.logger.log(
        `Appointment cancelled: ${event.appointmentId}. WhatsApp notification will be handled by Notification BC.`,
      );

      // TODO: Implement when Customer BC provides phone number lookup
      // TODO: Implement when Conversation BC can create/find conversations
      // For now, this is a placeholder that logs the event
      // The actual WhatsApp notification should be sent by Notification BC

      this.logger.debug({
        appointmentId: event.appointmentId,
        cancelledAt: event.cancelledAt,
        message: 'Appointment cancellation notification pending',
      });
    } catch (error) {
      // No propagar error - fire-and-forget
      this.logger.error(
        `Error processing appointment cancelled event ${event.appointmentId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
