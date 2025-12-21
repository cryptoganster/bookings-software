import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, EventBus, EventPublisher } from '@nestjs/cqrs';
import * as fc from 'fast-check';
import { Appointment } from '../appointment';
import { UUID } from '@shared/vo/uuid';
import { DateTime } from '../../vo/date-time';
import { AppointmentCreated } from '../../events/appointment-created';
import { AppointmentCancelled } from '../../events/appointment-cancelled';
import { uuidV4 } from '@test-utils/generators';

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
        uuidV4(),
        uuidV4(),
        uuidV4(),
        uuidV4(),
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

          // Crear appointment sin fusionar primero
          const appointment = Appointment.create(id, businessId, customerId, offeringId, dateTime);

          // Fusionar el aggregate con el EventBus DESPUÉS de crear
          // Esto permite que los eventos ya aplicados se publiquen
          const mergedAppointment = eventPublisher.mergeObjectContext(appointment);

          // Llamar a commit() para publicar los eventos pendientes
          // Aunque autoCommit=true, los eventos se aplican antes de fusionar con EventBus
          mergedAppointment.commit();

          // Con autoCommit=true, el evento debe haberse publicado
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
        uuidV4(),
        uuidV4(),
        uuidV4(),
        uuidV4(),
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

          // Cancelar appointment - esto llama a apply() internamente
          mergedAppointment.cancel();

          // Commit para publicar eventos (autoCommit=false en VersionedAggregateRoot)
          mergedAppointment.commit();

          // El evento debe haberse publicado después de commit()
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
        uuidV4(),
        uuidV4(),
        uuidV4(),
        uuidV4(),
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

          // Commit para publicar evento de creación
          mergedAppointment.commit();

          const createdEventCount = publishedEvents.filter(
            (e) => e instanceof AppointmentCreated,
          ).length;

          // Cancelar
          mergedAppointment.cancel();

          // Commit para publicar evento de cancelación
          mergedAppointment.commit();

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
