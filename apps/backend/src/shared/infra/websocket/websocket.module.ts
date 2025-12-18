import { Module, Global } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventsGateway } from './events.gateway';
import { WebSocketEventBroadcaster } from './event-broadcaster';

/**
 * WebSocket Module
 *
 * Módulo global que proporciona funcionalidad de WebSocket para
 * actualizaciones en tiempo real.
 *
 * Componentes:
 * - EventsGateway: Gateway de Socket.IO para conexiones WebSocket
 * - WebSocketEventBroadcaster: Suscriptor del EventBus que broadcast eventos
 *
 * Características:
 * - Multi-tenancy vía Socket.IO rooms
 * - Integración con @nestjs/cqrs EventBus
 * - No invasivo: No modifica Bounded Contexts existentes
 */
@Global() // Disponible en toda la aplicación sin necesidad de importar
@Module({
  imports: [CqrsModule], // Importar CqrsModule para acceso al EventBus
  providers: [EventsGateway, WebSocketEventBroadcaster],
  exports: [EventsGateway], // Exportar por si otros módulos necesitan acceso directo
})
export class WebSocketModule {}
