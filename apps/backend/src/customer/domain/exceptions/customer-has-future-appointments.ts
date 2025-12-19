/**
 * Exception thrown when attempting to delete a customer with future appointments
 */
export class CustomerHasFutureAppointmentsException extends Error {
  constructor(customerId: string, futureAppointmentsCount: number) {
    super(
      `Cannot delete customer ${customerId}: has ${futureAppointmentsCount} future appointment(s). Cancel or complete them first.`,
    );
    this.name = 'CustomerHasFutureAppointmentsException';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomerHasFutureAppointmentsException);
    }
  }
}
