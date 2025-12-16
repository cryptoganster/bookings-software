import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/events', // Namespace específico para eventos
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private readonly connectedClients = new Map<string, string>(); // socketId -> businessId

  handleConnection(client: Socket) {
    const businessId = client.handshake.auth.businessId;

    if (!businessId) {
      this.logger.warn(`Client ${client.id} connected without businessId`);
      client.disconnect();
      return;
    }

    this.connectedClients.set(client.id, businessId);
    client.join(`business:${businessId}`); // Room por negocio (multi-tenancy)

    this.logger.log(`Client ${client.id} connected to business ${businessId}`);
  }

  handleDisconnect(client: Socket) {
    const businessId = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);

    this.logger.log(`Client ${client.id} disconnected from business ${businessId}`);
  }

  /**
   * Broadcast evento a todos los clientes de un negocio específico
   */
  broadcastToBusinessRoom(businessId: string, eventName: string, data: unknown) {
    this.server.to(`business:${businessId}`).emit(eventName, data);
    this.logger.debug(`Broadcasted ${eventName} to business ${businessId}`);
  }

  /**
   * Broadcast evento a un cliente específico
   */
  broadcastToClient(socketId: string, eventName: string, data: unknown) {
    this.server.to(socketId).emit(eventName, data);
  }
}
