import { Appointment } from '../appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '../../vo/date-time';
import { AppointmentStatus } from '../../vo/appointment-status';
import { AppointmentCreated } from '../../events/appointment-created';

describe('Appointment Aggregate', () => {
  let appointmentId: UUID;
  let businessId: UUID;
  let customerId: UUID;
  let offeringId: UUID;
  let futureDateTime: DateTime;

  beforeEach(() => {
    appointmentId = UUID.generate();
    businessId = UUID.generate();
    customerId = UUID.generate();
    offeringId = UUID.generate();
    
    // Crear fecha futura (mañana a las 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    futureDateTime = DateTime.fromDate(tomorrow);
  });

  describe('create', () => {
    it('should create appointment with version 1', () => {
      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
      );

      expect(appointment.getVersion().getValue()).toBe(1);
      expect(appointment.getId().getValue()).toBe(appointmentId.getValue());
      expect(appointment.getStatus().isConfirmed()).toBe(true);
    });

    it('should create appointment with confirmed status', () => {
      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
      );

      // Verificar que el appointment fue creado correctamente
      expect(appointment.getId().getValue()).toBe(appointmentId.getValue());
      expect(appointment.getBusinessId().getValue()).toBe(businessId.getValue());
      expect(appointment.getCustomerId().getValue()).toBe(customerId.getValue());
      expect(appointment.getOfferingId().getValue()).toBe(offeringId.getValue());
      expect(appointment.getStatus().isConfirmed()).toBe(true);
    });

    it('should throw error when creating appointment in the past', () => {
      const pastDateTime = DateTime.fromDate(new Date('2020-01-01'));

      expect(() => {
        Appointment.create(
          appointmentId,
          businessId,
          customerId,
          offeringId,
          pastDateTime,
        );
      }).toThrow('Cannot create appointment in the past');
    });
  });

  describe('cancel', () => {
    it('should increment version when cancelled', () => {
      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
      );

      const initialVersion = appointment.getVersion().getValue();
      appointment.cancel();

      expect(appointment.getVersion().getValue()).toBe(initialVersion + 1);
      expect(appointment.getStatus().isCancelled()).toBe(true);
    });

    it('should throw exception if status does not allow cancellation', () => {
      const appointment = Appointment.fromPersistence(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
        AppointmentStatus.cancelled(),
        1,
      );

      expect(() => {
        appointment.cancel();
      }).toThrow('Appointment cannot be cancelled');
    });

    it('should throw exception if appointment is within 2 hours', () => {
      // Crear cita en 1 hora
      const soonDateTime = new Date();
      soonDateTime.setHours(soonDateTime.getHours() + 1);
      const soon = DateTime.fromDate(soonDateTime);

      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        soon,
      );

      expect(() => {
        appointment.cancel();
      }).toThrow('Cannot cancel appointment within 2 hours');
    });
  });

  describe('modify', () => {
    it('should increment version when modified', () => {
      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
      );

      const initialVersion = appointment.getVersion().getValue();
      
      // Nueva fecha futura
      const newDateTime = new Date();
      newDateTime.setDate(newDateTime.getDate() + 2);
      const newFutureDateTime = DateTime.fromDate(newDateTime);

      appointment.modify(newFutureDateTime);

      expect(appointment.getVersion().getValue()).toBe(initialVersion + 1);
      expect(appointment.getDateTime().toDate().getTime()).toBe(newFutureDateTime.toDate().getTime());
    });

    it('should throw exception if appointment is cancelled', () => {
      const appointment = Appointment.fromPersistence(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
        AppointmentStatus.cancelled(),
        1,
      );

      const newDateTime = new Date();
      newDateTime.setDate(newDateTime.getDate() + 2);
      const newFutureDateTime = DateTime.fromDate(newDateTime);

      expect(() => {
        appointment.modify(newFutureDateTime);
      }).toThrow('Cannot modify cancelled appointment');
    });

    it('should throw exception if new date is in the past', () => {
      const appointment = Appointment.create(
        appointmentId,
        businessId,
        customerId,
        offeringId,
        futureDateTime,
      );

      const pastDateTime = DateTime.fromDate(new Date('2020-01-01'));

      expect(() => {
        appointment.modify(pastDateTime);
      }).toThrow('Cannot modify appointment to past date');
    });
  });
});
