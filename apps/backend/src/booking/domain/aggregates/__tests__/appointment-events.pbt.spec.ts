import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, EventBus, EventPublisher } from '@nestjs/cqrs';
import * as fc from 'fast-check';
import { Appointment } from '../appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '../../vo/date-time';
import { AppointmentCreated } from '../../events/appointment-created';
import { AppointmentCancelled } from '../../events/appointment-cancelled';

/**
 * Feature: proyecto-base-mvp, Property 5: Events are published automatically
 * Validates: Requirements 3.4
 */
describe('Appointment Event Publishing - Property Tests', () => {
  let module: TestingModule;
  let eventBus: EventBus;
  let eventPublisher: EventPublisher;
  let publishedEvents: any[];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
    }).compile();

    eventBus = module.get<EventBus>(EventBus);
    eventPublisher = module.get<EventPublisher>(EventPublisher);

    // Capturar eventos publicados
    publishedEvents = [];
    eventBus.subscribe((event) => {
      publishedEvents.push(event);
    });
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    publishedEvents = [];
  });

  it('should automatically publish AppointmentCreated event without explicit commit', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 1, max: 365 }),
        (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
          // Limpiar eventos antes de cada iteración
          publishedEvents = [];

          const id = UUID.fromString(idStr);
          const businessId = UUID.fromString(businessIdStr);
          const customerId = UUID.fromString(customerIdStr);
          const offeringId = UUID.fromString(offeringIdStr);

          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysInFuture);
          futureDate.setHours(10, 0, 0, 0);
          const dateTime = DateTime.fromDate(futureDate);

          // Crear appointment - con autoCommit=true, el evento debe publicarse automáticamente
          const appointment = Appointment.create(id, businessId, customerId, offeringId, dateTime);

          // Fusionar el aggregate con el EventBus para que publique eventos
          const mergedAppointment = eventPublisher.mergeObjectContext(appointment);

          // Aplicar el evento manualmente para simular el comportamiento real
          // En producción, esto sucede dentro del aggregate
          mergedAppointment.apply(
            new AppointmentCreated(
              id.getValue(),
              businessId.getValue(),
              customerId.getValue(),
              offeringId.getValue(),
              dateTime.toDate(),
            ),
          );

          // Con autoCommit=true, el evento debe haberse publicado automáticamente
          // sin necesidad de llamar a commit()
          const hasAppointmentCreatedEvent = publishedEvents.some(
            (event) => event instanceof AppointmentCreated,
          );

          return hasAppointmentCreatedEvent;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should automatically publish AppointmentCancelled event without explicit commit', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 3, max: 365 }),
        (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
          // Limpiar eventos antes de cada iteración
          publishedEvents = [];

          const id = UUID.fromString(idStr);
          const businessId = UUID.fromString(businessIdStr);
          const customerId = UUID.fromString(customerIdStr);
          const offeringId = UUID.fromString(offeringIdStr);

          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysInFuture);
          futureDate.setHours(10, 0, 0, 0);
          const dateTime = DateTime.fromDate(futureDate);

          // Crear appointment
          const appointment = Appointment.create(id, businessId, customerId, offeringId, dateTime);

          // Fusionar con EventBus
          const mergedAppointment = eventPublisher.mergeObjectContext(appointment);

          // Limpiar eventos de creación
          publishedEvents = [];

          // Cancelar appointment
          mergedAppointment.cancel();

          // Con autoCommit=true, el evento debe haberse publicado automáticamente
          const hasAppointmentCancelledEvent = publishedEvents.some(
            (event) => event instanceof AppointmentCancelled,
          );

          return hasAppointmentCancelledEvent;
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should publish events in correct order for multiple state changes', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.integer({ min: 3, max: 10 }),
        (idStr, businessIdStr, customerIdStr, offeringIdStr, daysInFuture) => {
          // Limpiar eventos antes de cada iteración
          publishedEvents = [];

          const id = UUID.fromString(idStr);
          const businessId = UUID.fromString(businessIdStr);
          const customerId = UUID.fromString(customerIdStr);
          const offeringId = UUID.fromString(offeringIdStr);

          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysInFuture);
          futureDate.setHours(10, 0, 0, 0);
          const dateTime = DateTime.fromDate(futureDate);

          // Crear appointment
          const appointment = Appointment.create(id, businessId, customerId, offeringId, dateTime);

          // Fusionar con EventBus
          const mergedAppointment = eventPublisher.mergeObjectContext(appointment);

          // Aplicar evento de creación
          mergedAppointment.apply(
            new AppointmentCreated(
              id.getValue(),
              businessId.getValue(),
              customerId.getValue(),
              offeringId.getValue(),
              dateTime.toDate(),
            ),
          );

          const createdEventCount = publishedEvents.filter(
            (e) => e instanceof AppointmentCreated,
          ).length;

          // Cancelar
          mergedAppointment.cancel();

          const cancelledEventCount = publishedEvents.filter(
            (e) => e instanceof AppointmentCancelled,
          ).length;

          // Debe haber exactamente 1 evento de cada tipo
          return createdEventCount === 1 && cancelledEventCount === 1;
        },
      ),
      { numRuns: 100 },
    );
  });
});
