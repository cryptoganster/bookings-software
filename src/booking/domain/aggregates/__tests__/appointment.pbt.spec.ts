import * as fc from 'fast-check';
import { Appointment } from '../appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '../../vo/date-time';

/**
 * Feature: proyecto-base-mvp, Property 1: Aggregate version increments on state changes
 * Validates: Requirements 2.2
 */
describe('Appointment Property-Based Tests', () => {
  describe('Property 1: Aggregate version increments on state changes', () => {
    it('should increment version on create', () => {
      fc.assert(
        fc.property(
          // Generadores de datos aleatorios
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }), // días en el futuro
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
            // Crear UUIDs
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            // Crear fecha futura
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            futureDate.setHours(10, 0, 0, 0);
            const dateTime = DateTime.fromDate(futureDate);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Verificar que la versión se incrementó a 1
            expect(appointment.getVersion().getValue()).toBe(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version on cancel', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 3, max: 365 }), // días en el futuro (más de 2 horas)
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            futureDate.setHours(10, 0, 0, 0);
            const dateTime = DateTime.fromDate(futureDate);

            // Crear y cancelar appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            const versionBeforeCancel = appointment.getVersion().getValue();
            appointment.cancel();
            const versionAfterCancel = appointment.getVersion().getValue();

            // Verificar que la versión se incrementó
            expect(versionAfterCancel).toBe(versionBeforeCancel + 1);
            expect(appointment.getStatus().isCancelled()).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version on modify', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture1, daysInFuture2) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            // Primera fecha futura
            const futureDate1 = new Date();
            futureDate1.setDate(futureDate1.getDate() + daysInFuture1);
            futureDate1.setHours(10, 0, 0, 0);
            const dateTime1 = DateTime.fromDate(futureDate1);

            // Segunda fecha futura (diferente)
            const futureDate2 = new Date();
            futureDate2.setDate(futureDate2.getDate() + daysInFuture2);
            futureDate2.setHours(14, 0, 0, 0);
            const dateTime2 = DateTime.fromDate(futureDate2);

            // Crear y modificar appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime1,
            );

            const versionBeforeModify = appointment.getVersion().getValue();
            appointment.modify(dateTime2);
            const versionAfterModify = appointment.getVersion().getValue();

            // Verificar que la versión se incrementó
            expect(versionAfterModify).toBe(versionBeforeModify + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should increment version multiple times with multiple state changes', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.array(fc.integer({ min: 1, max: 365 }), { minLength: 2, maxLength: 5 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysArray) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            // Crear fecha inicial
            const initialDate = new Date();
            initialDate.setDate(initialDate.getDate() + daysArray[0]);
            initialDate.setHours(10, 0, 0, 0);
            const initialDateTime = DateTime.fromDate(initialDate);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              initialDateTime,
            );

            let expectedVersion = 1;
            expect(appointment.getVersion().getValue()).toBe(expectedVersion);

            // Aplicar múltiples modificaciones
            for (let i = 1; i < daysArray.length; i++) {
              const newDate = new Date();
              newDate.setDate(newDate.getDate() + daysArray[i]);
              newDate.setHours(10 + i, 0, 0, 0);
              const newDateTime = DateTime.fromDate(newDate);

              appointment.modify(newDateTime);
              expectedVersion++;

              expect(appointment.getVersion().getValue()).toBe(expectedVersion);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: proyecto-base-mvp, Property 4: Commands produce expected events
   * Validates: Requirements 3.4
   *
   * Note: With autoCommit=true, events are automatically published and cleared.
   * These tests verify that the aggregate correctly applies events by checking
   * the aggregate's state changes rather than the event stream directly.
   */
  describe('Property 4: Commands produce expected events', () => {
    it('should create appointment with correct initial state (verifies AppointmentCreated event was applied)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            futureDate.setHours(10, 0, 0, 0);
            const dateTime = DateTime.fromDate(futureDate);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Verificar que el estado fue aplicado correctamente (evento fue procesado)
            expect(appointment.getId().getValue()).toBe(id.getValue());
            expect(appointment.getBusinessId().getValue()).toBe(businessId.getValue());
            expect(appointment.getCustomerId().getValue()).toBe(customerId.getValue());
            expect(appointment.getOfferingId().getValue()).toBe(offeringId.getValue());
            expect(appointment.getStatus().getValue()).toBe('CONFIRMED');
            expect(appointment.getVersion().getValue()).toBe(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should cancel appointment with correct state (verifies AppointmentCancelled event was applied)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 3, max: 365 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysInFuture);
            futureDate.setHours(10, 0, 0, 0);
            const dateTime = DateTime.fromDate(futureDate);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            const versionBeforeCancel = appointment.getVersion().getValue();

            // Cancelar appointment
            appointment.cancel();

            // Verificar que el estado fue aplicado correctamente (evento fue procesado)
            expect(appointment.getStatus().isCancelled()).toBe(true);
            expect(appointment.getStatus().getValue()).toBe('CANCELLED');
            expect(appointment.getVersion().getValue()).toBe(versionBeforeCancel + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should modify appointment with correct state (verifies AppointmentModified event was applied)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 365 }),
          fc.integer({ min: 1, max: 365 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture1, daysInFuture2) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            const futureDate1 = new Date();
            futureDate1.setDate(futureDate1.getDate() + daysInFuture1);
            futureDate1.setHours(10, 0, 0, 0);
            const dateTime1 = DateTime.fromDate(futureDate1);

            const futureDate2 = new Date();
            futureDate2.setDate(futureDate2.getDate() + daysInFuture2);
            futureDate2.setHours(14, 0, 0, 0);
            const dateTime2 = DateTime.fromDate(futureDate2);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime1,
            );

            const versionBeforeModify = appointment.getVersion().getValue();

            // Modificar appointment
            appointment.modify(dateTime2);

            // Verificar que el estado fue aplicado correctamente (evento fue procesado)
            expect(appointment.getDateTime().toDate()).toEqual(dateTime2.toDate());
            expect(appointment.getVersion().getValue()).toBe(versionBeforeModify + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain correct state through multiple modifications (verifies multiple events were applied)', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          (idStr, businessIdStr, customerIdStr, offeringIdStr, numModifications) => {
            const id = UUID.fromString(idStr);
            const businessId = UUID.fromString(businessIdStr);
            const customerId = UUID.fromString(customerIdStr);
            const offeringId = UUID.fromString(offeringIdStr);

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 10);
            futureDate.setHours(10, 0, 0, 0);
            const dateTime = DateTime.fromDate(futureDate);

            // Crear appointment
            const appointment = Appointment.create(
              id,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            let expectedVersion = 1;
            expect(appointment.getVersion().getValue()).toBe(expectedVersion);

            // Aplicar múltiples modificaciones
            let lastDateTime = dateTime;
            for (let i = 0; i < numModifications; i++) {
              const newDate = new Date();
              newDate.setDate(newDate.getDate() + 10 + i + 1);
              newDate.setHours(10 + i, 0, 0, 0);
              const newDateTime = DateTime.fromDate(newDate);

              appointment.modify(newDateTime);
              expectedVersion++;
              lastDateTime = newDateTime;

              // Verificar que el estado se actualizó correctamente
              expect(appointment.getVersion().getValue()).toBe(expectedVersion);
            }

            // Verificar estado final
            expect(appointment.getDateTime().toDate()).toEqual(lastDateTime.toDate());
            expect(appointment.getVersion().getValue()).toBe(1 + numModifications);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
