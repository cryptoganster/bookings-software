import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { WebSocketEventBroadcaster } from '../event-broadcaster';
import { EventsGateway } from '../events.gateway';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { AppointmentModified } from '@booking/domain/events/appointment-modified';
import * as fc from 'fast-check';

describe('WebSocketEventBroadcaster (Property-Based Tests)', () => {
  let broadcaster: WebSocketEventBroadcaster;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockEventsGateway: jest.Mocked<EventsGateway>;
  let eventBusSubject: Subject<any>;

  beforeEach(async () => {
    eventBusSubject = new Subject();

    mockEventBus = {
      pipe: jest.fn().mockReturnValue(eventBusSubject),
    } as any;

    mockEventsGateway = {
      broadcastToBusinessRoom: jest.fn(),
      broadcastToAllClients: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketEventBroadcaster,
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    broadcaster = module.get<WebSocketEventBroadcaster>(WebSocketEventBroadcaster);

    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();

    broadcaster.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    eventBusSubject.complete();
  });

  describe('AppointmentCreated properties', () => {
    it('should always broadcast to correct business room', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // appointmentId
          fc.string({ minLength: 1, maxLength: 100 }), // businessId
          fc.uuid(), // customerId
          fc.uuid(), // offeringId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (appointmentId, businessId, customerId, offeringId, dateTime) => {
            // Arrange
            mockEventsGateway.broadcastToBusinessRoom.mockClear();
            const event = new AppointmentCreated(
              appointmentId,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Act
            eventBusSubject.next(event);

            // Assert
            expect(mockEventsGateway.broadcastToBusinessRoom).toHaveBeenCalledWith(
              businessId,
              'appointment:created',
              expect.objectContaining({
                appointmentId,
                customerId,
                offeringId,
                dateTime,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always include timestamp in broadcast data', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1 }),
          fc.uuid(),
          fc.uuid(),
          fc.date(),
          (appointmentId, businessId, customerId, offeringId, dateTime) => {
            // Arrange
            mockEventsGateway.broadcastToBusinessRoom.mockClear();
            const event = new AppointmentCreated(
              appointmentId,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Act
            eventBusSubject.next(event);

            // Assert
            const callArgs = mockEventsGateway.broadcastToBusinessRoom.mock.calls[0];
            const data = callArgs[2] as any;
            expect(data.timestamp).toBeDefined();
            expect(typeof data.timestamp).toBe('string');
            expect(new Date(data.timestamp)).toBeInstanceOf(Date);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should preserve all event data in broadcast', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1 }),
          fc.uuid(),
          fc.uuid(),
          fc.date(),
          (appointmentId, businessId, customerId, offeringId, dateTime) => {
            // Arrange
            mockEventsGateway.broadcastToBusinessRoom.mockClear();
            const event = new AppointmentCreated(
              appointmentId,
              businessId,
              customerId,
              offeringId,
              dateTime,
            );

            // Act
            eventBusSubject.next(event);

            // Assert
            const callArgs = mockEventsGateway.broadcastToBusinessRoom.mock.calls[0];
            const data = callArgs[2] as any;
            expect(data.appointmentId).toBe(appointmentId);
            expect(data.customerId).toBe(customerId);
            expect(data.offeringId).toBe(offeringId);
            expect(data.dateTime).toBe(dateTime);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('AppointmentCancelled properties', () => {
    it('should always broadcast to all clients', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // appointmentId
          (appointmentId) => {
            // Arrange
            mockEventsGateway.broadcastToAllClients.mockClear();
            const event = new AppointmentCancelled(appointmentId);

            // Act
            eventBusSubject.next(event);

            // Assert
            expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledWith(
              'appointment:cancelled',
              expect.objectContaining({
                appointmentId,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always include timestamp', () => {
      fc.assert(
        fc.property(fc.uuid(), (appointmentId) => {
          // Arrange
          mockEventsGateway.broadcastToAllClients.mockClear();
          const event = new AppointmentCancelled(appointmentId);

          // Act
          eventBusSubject.next(event);

          // Assert
          const callArgs = mockEventsGateway.broadcastToAllClients.mock.calls[0];
          const data = callArgs[1] as any;
          expect(data.timestamp).toBeDefined();
          expect(typeof data.timestamp).toBe('string');
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('AppointmentModified properties', () => {
    it('should always broadcast to all clients with new dateTime', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // appointmentId
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
          (appointmentId, newDateTime) => {
            // Arrange
            mockEventsGateway.broadcastToAllClients.mockClear();
            const event = new AppointmentModified(appointmentId, newDateTime);

            // Act
            eventBusSubject.next(event);

            // Assert
            expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledWith(
              'appointment:modified',
              expect.objectContaining({
                appointmentId,
                newDateTime,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should preserve dateTime precision', () => {
      fc.assert(
        fc.property(fc.uuid(), fc.date(), (appointmentId, newDateTime) => {
          // Arrange
          mockEventsGateway.broadcastToAllClients.mockClear();
          const event = new AppointmentModified(appointmentId, newDateTime);

          // Act
          eventBusSubject.next(event);

          // Assert
          const callArgs = mockEventsGateway.broadcastToAllClients.mock.calls[0];
          const data = callArgs[1] as any;
          expect(data.newDateTime).toBe(newDateTime);
          expect(data.newDateTime.getTime()).toBe(newDateTime.getTime());
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Event handling properties', () => {
    it('should handle multiple events without losing data', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.record({
                type: fc.constant('created'),
                appointmentId: fc.uuid(),
                businessId: fc.string({ minLength: 1 }),
                customerId: fc.uuid(),
                offeringId: fc.uuid(),
                dateTime: fc.date(),
              }),
              fc.record({
                type: fc.constant('cancelled'),
                appointmentId: fc.uuid(),
              }),
              fc.record({
                type: fc.constant('modified'),
                appointmentId: fc.uuid(),
                newDateTime: fc.date(),
              }),
            ),
            { minLength: 1, maxLength: 10 },
          ),
          (events) => {
            // Arrange
            mockEventsGateway.broadcastToBusinessRoom.mockClear();
            mockEventsGateway.broadcastToAllClients.mockClear();

            // Act
            events.forEach((eventData) => {
              if (eventData.type === 'created') {
                const event = new AppointmentCreated(
                  eventData.appointmentId,
                  eventData.businessId,
                  eventData.customerId,
                  eventData.offeringId,
                  eventData.dateTime,
                );
                eventBusSubject.next(event);
              } else if (eventData.type === 'cancelled') {
                const event = new AppointmentCancelled(eventData.appointmentId);
                eventBusSubject.next(event);
              } else if (eventData.type === 'modified') {
                const event = new AppointmentModified(
                  eventData.appointmentId,
                  eventData.newDateTime,
                );
                eventBusSubject.next(event);
              }
            });

            // Assert
            const createdCount = events.filter((e) => e.type === 'created').length;
            const cancelledCount = events.filter((e) => e.type === 'cancelled').length;
            const modifiedCount = events.filter((e) => e.type === 'modified').length;

            expect(mockEventsGateway.broadcastToBusinessRoom).toHaveBeenCalledTimes(createdCount);
            expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledTimes(
              cancelledCount + modifiedCount,
            );
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should ignore non-appointment events', () => {
      fc.assert(
        fc.property(
          fc.record({
            type: fc.string({ minLength: 1 }),
            data: fc.anything(),
          }),
          (unknownEvent) => {
            // Arrange
            fc.pre(
              unknownEvent.type !== 'AppointmentCreated' &&
                unknownEvent.type !== 'AppointmentCancelled' &&
                unknownEvent.type !== 'AppointmentModified',
            );
            mockEventsGateway.broadcastToBusinessRoom.mockClear();
            mockEventsGateway.broadcastToAllClients.mockClear();

            // Act
            eventBusSubject.next(unknownEvent);

            // Assert
            expect(mockEventsGateway.broadcastToBusinessRoom).not.toHaveBeenCalled();
            expect(mockEventsGateway.broadcastToAllClients).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Lifecycle properties', () => {
    it('should handle destroy without errors', () => {
      // Act & Assert - No debe lanzar error
      expect(() => broadcaster.onModuleDestroy()).not.toThrow();
    });
  });
});
