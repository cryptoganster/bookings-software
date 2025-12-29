import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events.gateway';
import { Logger } from '@nestjs/common';
import * as fc from 'fast-check';
import { Server, Socket } from 'socket.io';

interface MockServer {
  to: jest.Mock;
  emit: jest.Mock;
}

interface MockSocket {
  id: string;
  handshake: {
    auth: { businessId?: string | null };
  };
  join: jest.Mock;
  disconnect: jest.Mock;
}

describe('EventsGateway (Property-Based Tests)', () => {
  let gateway: EventsGateway;
  let mockServer: MockServer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);

    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway.server = mockServer as unknown as Server;

    // Silenciar logs
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('broadcastToBusinessRoom properties', () => {
    it('should always call server.to() with correct room format', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // businessId
          fc.string({ minLength: 1, maxLength: 50 }), // eventName
          fc.anything(), // data
          (businessId, eventName, data) => {
            // Arrange
            mockServer.to.mockClear();
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId, eventName, data);

            // Assert
            expect(mockServer.to).toHaveBeenCalledWith(`business:${businessId}`);
            expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should preserve data integrity when broadcasting', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.record({
            id: fc.uuid(),
            value: fc.integer(),
            text: fc.string(),
            nested: fc.record({
              field: fc.string(),
            }),
          }),
          (businessId, eventName, data) => {
            // Arrange
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId, eventName, data);

            // Assert
            const emittedData = mockServer.emit.mock.calls[0][1];
            expect(emittedData).toEqual(data);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle any valid businessId format', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.uuid(),
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 1 }).map(String),
          ),
          (businessId) => {
            // Arrange
            mockServer.to.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId, 'test:event', {});

            // Assert
            expect(mockServer.to).toHaveBeenCalledWith(`business:${businessId}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('broadcastToClient properties', () => {
    it('should always call server.to() with exact socketId', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // socketId
          fc.string({ minLength: 1, maxLength: 50 }), // eventName
          fc.anything(), // data
          (socketId, eventName, data) => {
            // Arrange
            mockServer.to.mockClear();
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToClient(socketId, eventName, data);

            // Assert
            expect(mockServer.to).toHaveBeenCalledWith(socketId);
            expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('broadcastToAllClients properties', () => {
    it('should never call server.to() when broadcasting to all', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // eventName
          fc.anything(), // data
          (eventName, data) => {
            // Arrange
            mockServer.to.mockClear();
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToAllClients(eventName, data);

            // Assert
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('handleConnection properties', () => {
    it('should always join room when businessId is provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }), // businessId
          fc.uuid(), // socketId
          (businessId, socketId) => {
            // Arrange
            const mockSocket: MockSocket = {
              id: socketId,
              handshake: {
                auth: { businessId },
              },
              join: jest.fn(),
              disconnect: jest.fn(),
            };

            // Act
            gateway.handleConnection(mockSocket as unknown as Socket);

            // Assert
            expect(mockSocket.join).toHaveBeenCalledWith(`business:${businessId}`);
            expect(mockSocket.disconnect).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always disconnect when businessId is missing', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // socketId
          fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant('')),
          (socketId, invalidBusinessId) => {
            // Arrange
            const mockSocket: MockSocket = {
              id: socketId,
              handshake: {
                auth: { businessId: invalidBusinessId },
              },
              join: jest.fn(),
              disconnect: jest.fn(),
            };

            // Act
            gateway.handleConnection(mockSocket as unknown as Socket);

            // Assert
            expect(mockSocket.disconnect).toHaveBeenCalled();
            expect(mockSocket.join).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Multi-tenancy properties', () => {
    it('should isolate broadcasts by businessId', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }), // businessId1
          fc.string({ minLength: 1 }), // businessId2
          fc.string({ minLength: 1 }), // eventName
          fc.anything(), // data
          (businessId1, businessId2, eventName, data) => {
            // Arrange
            fc.pre(businessId1 !== businessId2); // Asegurar que son diferentes
            mockServer.to.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId1, eventName, data);

            // Assert
            expect(mockServer.to).toHaveBeenCalledWith(`business:${businessId1}`);
            expect(mockServer.to).not.toHaveBeenCalledWith(`business:${businessId2}`);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Data type handling properties', () => {
    it('should handle various data types correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.array(fc.anything()),
            fc.record({
              field1: fc.string(),
              field2: fc.integer(),
              field3: fc.boolean(),
            }),
          ),
          (businessId, eventName, data) => {
            // Arrange
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId, eventName, data);

            // Assert
            expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Idempotency properties', () => {
    it('broadcasting same event multiple times should produce same result', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          fc.record({
            id: fc.uuid(),
            value: fc.integer(),
          }),
          (businessId, eventName, data) => {
            // Arrange
            mockServer.to.mockClear();
            mockServer.emit.mockClear();

            // Act
            gateway.broadcastToBusinessRoom(businessId, eventName, data);
            const firstCall = mockServer.emit.mock.calls[0];

            mockServer.to.mockClear();
            mockServer.emit.mockClear();

            gateway.broadcastToBusinessRoom(businessId, eventName, data);
            const secondCall = mockServer.emit.mock.calls[0];

            // Assert
            expect(firstCall).toEqual(secondCall);
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
