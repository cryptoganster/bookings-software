import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { WebSocketEventBroadcaster } from '../event-broadcaster';
import { EventsGateway } from '../events.gateway';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { AppointmentModified } from '@booking/domain/events/appointment-modified';

describe('WebSocketEventBroadcaster', () => {
  let broadcaster: WebSocketEventBroadcaster;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockEventsGateway: jest.Mocked<EventsGateway>;
  let eventBusSubject: Subject<any>;

  beforeEach(async () => {
    // Subject para simular el EventBus
    eventBusSubject = new Subject();

    // Mock del EventBus
    mockEventBus = {
      pipe: jest.fn().mockReturnValue(eventBusSubject),
    } as any;

    // Mock del EventsGateway
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

    // Silenciar logs en tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    eventBusSubject.complete();
  });

  describe('onModuleInit', () => {
    it('should subscribe to EventBus on initialization', () => {
      // Act
      broadcaster.onModuleInit();

      // Assert
      expect(mockEventBus.pipe).toHaveBeenCalled();
    });

    it('should log initialization message', () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      broadcaster.onModuleInit();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('WebSocket Event Broadcaster initialized');
    });
  });

  describe('onModuleDestroy', () => {
    it('should complete destroy$ subject', () => {
      // Arrange
      broadcaster.onModuleInit();
      const destroySpy = jest.spyOn(broadcaster['destroy$'], 'next');

      // Act
      broadcaster.onModuleDestroy();

      // Assert
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should log destruction message', () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      broadcaster.onModuleDestroy();

      // Assert
      expect(logSpy).toHaveBeenCalledWith('WebSocket Event Broadcaster destroyed');
    });
  });

  describe('AppointmentCreated event', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('should broadcast appointment:created to business room', () => {
      // Arrange
      const event = new AppointmentCreated(
        'appt-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-20T10:00:00Z'),
      );

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(mockEventsGateway.broadcastToBusinessRoom).toHaveBeenCalledWith(
        'business-456',
        'appointment:created',
        expect.objectContaining({
          appointmentId: 'appt-123',
          customerId: 'customer-789',
          offeringId: 'offering-101',
          dateTime: event.dateTime,
          timestamp: expect.any(String),
        }),
      );
    });

    it('should include timestamp in broadcast data', () => {
      // Arrange
      const event = new AppointmentCreated(
        'appt-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-20T10:00:00Z'),
      );

      // Act
      eventBusSubject.next(event);

      // Assert
      const callArgs = mockEventsGateway.broadcastToBusinessRoom.mock.calls[0];
      const data = callArgs[2] as any;
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should log debug message after broadcasting', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const event = new AppointmentCreated(
        'appt-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date('2024-12-20T10:00:00Z'),
      );

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        'Broadcasted appointment:created to business business-456',
      );
    });
  });

  describe('AppointmentCancelled event', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('should broadcast appointment:cancelled to all clients', () => {
      // Arrange
      const event = new AppointmentCancelled('appt-123');

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledWith(
        'appointment:cancelled',
        expect.objectContaining({
          appointmentId: 'appt-123',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log warning about missing businessId', () => {
      // Arrange
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const event = new AppointmentCancelled('appt-123');

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        'AppointmentCancelled event does not include businessId. Broadcasting to all connected clients.',
      );
    });

    it('should log debug message after broadcasting', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const event = new AppointmentCancelled('appt-123');

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        'Broadcasted appointment:cancelled for appointment appt-123',
      );
    });
  });

  describe('AppointmentModified event', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('should broadcast appointment:modified to all clients', () => {
      // Arrange
      const newDateTime = new Date('2024-12-21T14:00:00Z');
      const event = new AppointmentModified('appt-123', newDateTime);

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledWith(
        'appointment:modified',
        expect.objectContaining({
          appointmentId: 'appt-123',
          newDateTime: newDateTime,
          timestamp: expect.any(String),
        }),
      );
    });

    it('should log warning about missing businessId', () => {
      // Arrange
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const event = new AppointmentModified('appt-123', new Date());

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(
        'AppointmentModified event does not include businessId. Broadcasting to all connected clients.',
      );
    });

    it('should log debug message after broadcasting', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const event = new AppointmentModified('appt-123', new Date());

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(
        'Broadcasted appointment:modified for appointment appt-123',
      );
    });
  });

  describe('Unknown events', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('should ignore unknown events', () => {
      // Arrange
      class UnknownEvent {
        constructor(public readonly data: string) {}
      }
      const event = new UnknownEvent('test');

      // Act
      eventBusSubject.next(event);

      // Assert
      expect(mockEventsGateway.broadcastToBusinessRoom).not.toHaveBeenCalled();
      expect(mockEventsGateway.broadcastToAllClients).not.toHaveBeenCalled();
    });

    it('should not throw error on unknown events', () => {
      // Arrange
      const event = { type: 'unknown', data: 'test' };

      // Act & Assert
      expect(() => eventBusSubject.next(event)).not.toThrow();
    });
  });

  describe('Multiple events', () => {
    beforeEach(() => {
      broadcaster.onModuleInit();
    });

    it('should handle multiple events in sequence', () => {
      // Arrange
      const event1 = new AppointmentCreated(
        'appt-1',
        'business-1',
        'customer-1',
        'offering-1',
        new Date(),
      );
      const event2 = new AppointmentCancelled('appt-2');
      const event3 = new AppointmentModified('appt-3', new Date());

      // Act
      eventBusSubject.next(event1);
      eventBusSubject.next(event2);
      eventBusSubject.next(event3);

      // Assert
      expect(mockEventsGateway.broadcastToBusinessRoom).toHaveBeenCalledTimes(1);
      expect(mockEventsGateway.broadcastToAllClients).toHaveBeenCalledTimes(2);
    });
  });

  describe('Subscription lifecycle', () => {
    it('should stop receiving events after onModuleDestroy', () => {
      // Arrange
      broadcaster.onModuleInit();
      const event = new AppointmentCreated(
        'appt-123',
        'business-456',
        'customer-789',
        'offering-101',
        new Date(),
      );

      // Act
      broadcaster.onModuleDestroy();
      eventBusSubject.next(event);

      // Assert
      expect(mockEventsGateway.broadcastToBusinessRoom).not.toHaveBeenCalled();
    });
  });
});
