import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { WebSocketModule } from '../websocket.module';
import { EventsGateway } from '../events.gateway';
import { WebSocketEventBroadcaster } from '../event-broadcaster';
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { AppointmentModified } from '@booking/domain/events/appointment-modified';

describe('WebSocket Integration Tests', () => {
  let app: INestApplication;
  let eventBus: EventBus;
  let client1: ClientSocket;
  let client2: ClientSocket;
  let client3: ClientSocket;
  const PORT = 3001; // Puerto diferente para tests

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WebSocketModule],
      providers: [
        {
          provide: EventBus,
          useValue: {
            pipe: jest.fn().mockReturnValue({
              subscribe: jest.fn(),
            }),
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(PORT);

    eventBus = moduleFixture.get<EventBus>(EventBus);

    // Obtener el broadcaster y simular su inicialización
    const broadcaster = moduleFixture.get<WebSocketEventBroadcaster>(WebSocketEventBroadcaster);
    const gateway = moduleFixture.get<EventsGateway>(EventsGateway);

    // Reemplazar el método handleDomainEvent para poder disparar eventos manualmente
    (broadcaster as any).handleDomainEvent = (event: any) => {
      if (event instanceof AppointmentCreated) {
        gateway.broadcastToBusinessRoom(event.businessId, 'appointment:created', {
          appointmentId: event.appointmentId,
          customerId: event.customerId,
          offeringId: event.offeringId,
          dateTime: event.dateTime,
          timestamp: new Date().toISOString(),
        });
      } else if (event instanceof AppointmentCancelled) {
        gateway.broadcastToAllClients('appointment:cancelled', {
          appointmentId: event.appointmentId,
          timestamp: new Date().toISOString(),
        });
      } else if (event instanceof AppointmentModified) {
        gateway.broadcastToAllClients('appointment:modified', {
          appointmentId: event.appointmentId,
          newDateTime: event.newDateTime,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Exponer el broadcaster para poder disparar eventos
    (app as any).broadcaster = broadcaster;
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    if (client1?.connected) client1.disconnect();
    if (client2?.connected) client2.disconnect();
    if (client3?.connected) client3.disconnect();
  });

  describe('Client Connection', () => {
    it('should accept connection with valid businessId', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: {
          businessId: 'business-123',
        },
      });

      client1.on('connect', () => {
        expect(client1.connected).toBe(true);
        done();
      });

      client1.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should reject connection without businessId', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: {},
      });

      client1.on('connect', () => {
        done(new Error('Should not connect without businessId'));
      });

      client1.on('disconnect', () => {
        expect(client1.connected).toBe(false);
        done();
      });
    });

    it('should allow multiple clients from same business', (done) => {
      let connectedCount = 0;

      const checkBothConnected = () => {
        connectedCount++;
        if (connectedCount === 2) {
          expect(client1.connected).toBe(true);
          expect(client2.connected).toBe(true);
          done();
        }
      };

      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client2 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', checkBothConnected);
      client2.on('connect', checkBothConnected);
    });
  });

  describe('Multi-tenancy', () => {
    it('should isolate events by businessId', (done) => {
      let business1Received = false;
      let business2Received = false;

      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-1' },
      });

      client2 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-2' },
      });

      client1.on('connect', () => {
        client1.on('appointment:created', (data) => {
          business1Received = true;
          expect(data.appointmentId).toBe('appt-123');
        });
      });

      client2.on('connect', () => {
        client2.on('appointment:created', (data) => {
          business2Received = true;
          done(new Error('Business 2 should not receive events for Business 1'));
        });

        // Esperar un momento y luego disparar evento
        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-123',
            'business-1',
            'customer-456',
            'offering-789',
            new Date(),
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);

          // Verificar después de un tiempo
          setTimeout(() => {
            expect(business1Received).toBe(true);
            expect(business2Received).toBe(false);
            done();
          }, 100);
        }, 100);
      });
    });

    it('should broadcast to all clients in same business room', (done) => {
      let client1Received = false;
      let client2Received = false;

      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client2 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      const checkBothReceived = () => {
        if (client1Received && client2Received) {
          done();
        }
      };

      client1.on('connect', () => {
        client1.on('appointment:created', (data) => {
          client1Received = true;
          expect(data.appointmentId).toBe('appt-456');
          checkBothReceived();
        });
      });

      client2.on('connect', () => {
        client2.on('appointment:created', (data) => {
          client2Received = true;
          expect(data.appointmentId).toBe('appt-456');
          checkBothReceived();
        });

        // Disparar evento después de que ambos estén conectados
        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-456',
            'business-123',
            'customer-789',
            'offering-101',
            new Date(),
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 100);
      });
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast AppointmentCreated event', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', () => {
        client1.on('appointment:created', (data) => {
          expect(data).toMatchObject({
            appointmentId: 'appt-123',
            customerId: 'customer-456',
            offeringId: 'offering-789',
          });
          expect(data.dateTime).toBeDefined();
          expect(data.timestamp).toBeDefined();
          done();
        });

        // Disparar evento
        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-123',
            'business-123',
            'customer-456',
            'offering-789',
            new Date('2024-12-20T10:00:00Z'),
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 50);
      });
    });

    it('should broadcast AppointmentCancelled event to all clients', (done) => {
      let receivedCount = 0;

      const checkAllReceived = () => {
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-1' },
      });

      client2 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-2' },
      });

      client1.on('connect', () => {
        client1.on('appointment:cancelled', (data) => {
          expect(data.appointmentId).toBe('appt-999');
          checkAllReceived();
        });
      });

      client2.on('connect', () => {
        client2.on('appointment:cancelled', (data) => {
          expect(data.appointmentId).toBe('appt-999');
          checkAllReceived();
        });

        // Disparar evento después de que ambos estén conectados
        setTimeout(() => {
          const event = new AppointmentCancelled('appt-999');

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 100);
      });
    });

    it('should broadcast AppointmentModified event', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', () => {
        client1.on('appointment:modified', (data) => {
          expect(data.appointmentId).toBe('appt-555');
          expect(data.newDateTime).toBeDefined();
          expect(data.timestamp).toBeDefined();
          done();
        });

        // Disparar evento
        setTimeout(() => {
          const newDateTime = new Date('2024-12-21T14:00:00Z');
          const event = new AppointmentModified('appt-555', newDateTime);

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 50);
      });
    });
  });

  describe('Connection Lifecycle', () => {
    it('should handle client reconnection', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', () => {
        // Desconectar
        client1.disconnect();

        // Reconectar
        setTimeout(() => {
          client1.connect();

          client1.on('connect', () => {
            expect(client1.connected).toBe(true);
            done();
          });
        }, 100);
      });
    });

    it('should stop receiving events after disconnect', (done) => {
      let receivedAfterDisconnect = false;

      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', () => {
        client1.on('appointment:created', () => {
          if (!client1.connected) {
            receivedAfterDisconnect = true;
          }
        });

        // Desconectar
        client1.disconnect();

        // Intentar enviar evento después de desconectar
        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-after-disconnect',
            'business-123',
            'customer-456',
            'offering-789',
            new Date(),
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);

          // Verificar que no recibió el evento
          setTimeout(() => {
            expect(receivedAfterDisconnect).toBe(false);
            done();
          }, 100);
        }, 100);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should preserve Date objects in events', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      const originalDate = new Date('2024-12-20T10:30:00Z');

      client1.on('connect', () => {
        client1.on('appointment:created', (data) => {
          expect(data.dateTime).toBeDefined();
          // Socket.IO serializa Dates como strings
          const receivedDate = new Date(data.dateTime);
          expect(receivedDate.getTime()).toBe(originalDate.getTime());
          done();
        });

        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-date-test',
            'business-123',
            'customer-456',
            'offering-789',
            originalDate,
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 50);
      });
    });

    it('should handle complex nested data', (done) => {
      client1 = io(`http://localhost:${PORT}/events`, {
        auth: { businessId: 'business-123' },
      });

      client1.on('connect', () => {
        client1.on('appointment:created', (data) => {
          expect(data.appointmentId).toBe('appt-complex');
          expect(data.customerId).toBe('customer-456');
          expect(data.offeringId).toBe('offering-789');
          expect(data.timestamp).toBeDefined();
          done();
        });

        setTimeout(() => {
          const event = new AppointmentCreated(
            'appt-complex',
            'business-123',
            'customer-456',
            'offering-789',
            new Date(),
          );

          const broadcaster = (app as any).broadcaster;
          broadcaster.handleDomainEvent(event);
        }, 50);
      });
    });
  });
});
