import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from '../events.gateway';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let mockServer: {
    to: jest.Mock;
    emit: jest.Mock;
  };
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsGateway],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);

    // Mock del servidor Socket.IO
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    gateway.server = mockServer as unknown as Server;

    // Mock del socket del cliente
    mockSocket = {
      id: 'test-socket-id',
      handshake: {
        auth: {},
      } as unknown as Socket['handshake'],
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    // Silenciar logs en tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid businessId', () => {
      // Arrange
      mockSocket.handshake!.auth.businessId = 'business-123';

      // Act
      gateway.handleConnection(mockSocket as Socket);

      // Assert
      expect(mockSocket.join).toHaveBeenCalledWith('business:business-123');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client without businessId', () => {
      // Arrange
      mockSocket.handshake!.auth.businessId = undefined;

      // Act
      gateway.handleConnection(mockSocket as Socket);

      // Assert
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.join).not.toHaveBeenCalled();
    });

    it('should log warning when client connects without businessId', () => {
      // Arrange
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      mockSocket.handshake!.auth.businessId = undefined;

      // Act
      gateway.handleConnection(mockSocket as Socket);

      // Assert
      expect(warnSpy).toHaveBeenCalledWith(`Client ${mockSocket.id} connected without businessId`);
    });

    it('should log successful connection', () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      mockSocket.handshake!.auth.businessId = 'business-123';

      // Act
      gateway.handleConnection(mockSocket as Socket);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} connected to business business-123`,
      );
    });

    it('should store businessId in connectedClients map', () => {
      // Arrange
      mockSocket.handshake!.auth.businessId = 'business-123';

      // Act
      gateway.handleConnection(mockSocket as Socket);

      // Assert - Verificar indirectamente a través de handleDisconnect
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      gateway.handleDisconnect(mockSocket as Socket);
      expect(logSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} disconnected from business business-123`,
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client from connectedClients map', () => {
      // Arrange
      mockSocket.handshake!.auth.businessId = 'business-123';
      gateway.handleConnection(mockSocket as Socket);

      // Act
      gateway.handleDisconnect(mockSocket as Socket);

      // Assert - Verificar que se eliminó del mapa
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      gateway.handleDisconnect(mockSocket as Socket); // Segunda desconexión
      expect(logSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} disconnected from business undefined`,
      );
    });

    it('should log disconnection', () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');
      mockSocket.handshake!.auth.businessId = 'business-123';
      gateway.handleConnection(mockSocket as Socket);

      // Act
      gateway.handleDisconnect(mockSocket as Socket);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} disconnected from business business-123`,
      );
    });

    it('should handle disconnection of client that was never connected', () => {
      // Arrange
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      // Act
      gateway.handleDisconnect(mockSocket as Socket);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(
        `Client ${mockSocket.id} disconnected from business undefined`,
      );
    });
  });

  describe('broadcastToBusinessRoom', () => {
    it('should broadcast event to specific business room', () => {
      // Arrange
      const businessId = 'business-123';
      const eventName = 'test:event';
      const data = { message: 'test data' };

      // Act
      gateway.broadcastToBusinessRoom(businessId, eventName, data);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith('business:business-123');
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
    });

    it('should log debug message when broadcasting to business room', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const businessId = 'business-123';
      const eventName = 'test:event';

      // Act
      gateway.broadcastToBusinessRoom(businessId, eventName, {});

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(`Broadcasted ${eventName} to business ${businessId}`);
    });

    it('should handle complex data objects', () => {
      // Arrange
      const businessId = 'business-123';
      const eventName = 'appointment:created';
      const data = {
        appointmentId: 'appt-456',
        customerId: 'customer-789',
        dateTime: new Date('2024-12-20T10:00:00Z'),
        nested: {
          field: 'value',
        },
      };

      // Act
      gateway.broadcastToBusinessRoom(businessId, eventName, data);

      // Assert
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
    });
  });

  describe('broadcastToClient', () => {
    it('should broadcast event to specific client', () => {
      // Arrange
      const socketId = 'socket-123';
      const eventName = 'test:event';
      const data = { message: 'test data' };

      // Act
      gateway.broadcastToClient(socketId, eventName, data);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(socketId);
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
    });

    it('should not log when broadcasting to specific client', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const socketId = 'socket-123';

      // Act
      gateway.broadcastToClient(socketId, 'test:event', {});

      // Assert
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('broadcastToAllClients', () => {
    it('should broadcast event to all connected clients', () => {
      // Arrange
      const eventName = 'test:event';
      const data = { message: 'test data' };

      // Act
      gateway.broadcastToAllClients(eventName, data);

      // Assert
      expect(mockServer.emit).toHaveBeenCalledWith(eventName, data);
      expect(mockServer.to).not.toHaveBeenCalled(); // No debe usar .to() para broadcast global
    });

    it('should log debug message when broadcasting to all clients', () => {
      // Arrange
      const debugSpy = jest.spyOn(Logger.prototype, 'debug');
      const eventName = 'test:event';

      // Act
      gateway.broadcastToAllClients(eventName, {});

      // Assert
      expect(debugSpy).toHaveBeenCalledWith(`Broadcasted ${eventName} to all clients`);
    });
  });

  describe('Multi-tenancy', () => {
    it('should allow multiple clients from same business to connect', () => {
      // Arrange
      const socket1 = {
        id: 'socket-1',
        handshake: {
          auth: { businessId: 'business-123' },
        } as unknown,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      const socket2 = {
        id: 'socket-2',
        handshake: {
          auth: { businessId: 'business-123' },
        } as unknown,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      // Act
      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      // Assert
      expect(socket1.join).toHaveBeenCalledWith('business:business-123');
      expect(socket2.join).toHaveBeenCalledWith('business:business-123');
    });

    it('should isolate clients from different businesses', () => {
      // Arrange
      const socket1 = {
        id: 'socket-1',
        handshake: {
          auth: { businessId: 'business-123' },
        } as unknown,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      const socket2 = {
        id: 'socket-2',
        handshake: {
          auth: { businessId: 'business-456' },
        } as unknown,
        join: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as Socket;

      // Act
      gateway.handleConnection(socket1);
      gateway.handleConnection(socket2);

      // Assert
      expect(socket1.join).toHaveBeenCalledWith('business:business-123');
      expect(socket2.join).toHaveBeenCalledWith('business:business-456');
    });
  });
});
