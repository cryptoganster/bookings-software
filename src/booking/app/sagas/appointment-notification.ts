import { Injectable } from '@nestjs/common';
import { Saga, ofType, ICommand } from '@nestjs/cqrs';
import { Observable, map, mergeMap } from 'rxjs';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';

// Placeholder commands - these will be implemented in future bounded contexts
class ScheduleReminderCommand implements ICommand {
  constructor(
    public readonly appointmentId: string,
    public readonly dateTime: Date,
  ) {}
}

class CancelReminderCommand implements ICommand {
  constructor(public readonly appointmentId: string) {}
}

class SendWhatsAppMessageCommand implements ICommand {
  constructor(
    public readonly customerId: string,
    public readonly message: string,
  ) {}
}

@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map(
        (event: AppointmentCreated) =>
          new ScheduleReminderCommand(event.appointmentId, event.dateTime),
      ),
    );
  };

  @Saga()
  appointmentCancelled = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCancelled),
      mergeMap((event: AppointmentCancelled) => [
        new CancelReminderCommand(event.appointmentId),
        new SendWhatsAppMessageCommand('customer-id-placeholder', 'Tu cita ha sido cancelada'),
      ]),
    );
  };
}
