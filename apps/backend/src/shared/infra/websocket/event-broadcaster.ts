import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Subject, takeUntil } from 'rxjs';
import { EventsGateway } from './events.gateway';

// Domain Events - Booking
import { AppointmentCreated } from '@booking/domain/events/appointment-created';
import { AppointmentCancelled } from '@booking/domain/events/appointment-cancelled';
import { AppointmentModified } from '@booking/domain/events/appointment-modified';

// Domain Events - Offering
import { OfferingCreated } from '@offering/domain/events/offering-created';
import { OfferingUpdated } from '@offering/domain/events/offering-updated';
import { OfferingDeactivated } from '@offering/domain/events/offering-deactivated';
import { OfferingActivated } from '@offering/domain/events/offering-activated';

/**
 * Escucha todos los eventos del EventBus y los broadcast vía WebSocket
 *
 * Este broadcaster se suscribe al EventBus de NestJS CQRS y convierte
 * eventos de dominio en mensajes de WebSocket para clientes conectados.
 *
 * Características:
 * - Multi-tenancy: Solo broadcast a clientes del mismo businessId
 * - No invasivo: No modifica Bounded Contexts existentes
 * - Event-driven: Usa EventBus como fuente de verdad
 */
@Injectable()
export class WebSocketEventBroadcaster implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebSocketEventBroadcaster.name);
  private destroy$ = new Subject<void>();

  constructor(
    private readonly eventBus: EventBus,
    private readonly eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    this.logger.log('WebSocket Event Broadcaster initialized');

    // Suscribirse al EventBus para escuchar todos los eventos
    this.eventBus.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      this.handleDomainEvent(event);
    });
  }

  onModuleDestroy() {
    this.logger.log('WebSocket Event Broadcaster destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Mapea eventos de dominio a eventos de WebSocket
   */
  private handleDomainEvent(event: unknown) {
    // Booking events
    if (event instanceof AppointmentCreated) {
      this.broadcastAppointmentCreated(event);
    } else if (event instanceof AppointmentCancelled) {
      this.broadcastAppointmentCancelled(event);
    } else if (event instanceof AppointmentModified) {
      this.broadcastAppointmentModified(event);
    }
    // Offering events
    else if (event instanceof OfferingCreated) {
      this.broadcastOfferingCreated(event);
    } else if (event instanceof OfferingUpdated) {
      this.broadcastOfferingUpdated(event);
    } else if (event instanceof OfferingDeactivated) {
      this.broadcastOfferingDeactivated(event);
    } else if (event instanceof OfferingActivated) {
      this.broadcastOfferingActivated(event);
    }
  }

  /**
   * Broadcast: Nueva cita creada
   */
  private broadcastAppointmentCreated(event: AppointmentCreated) {
    this.eventsGateway.broadcastToBusinessRoom(event.businessId, 'appointment:created', {
      appointmentId: event.appointmentId,
      customerId: event.customerId,
      offeringId: event.offeringId,
      dateTime: event.dateTime,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted appointment:created to business ${event.businessId}`);
  }

  /**
   * Broadcast: Cita cancelada
   *
   * Nota: AppointmentCancelled no incluye businessId en el evento.
   * Para MVP, solo broadcast el appointmentId. Los clientes pueden
   * invalidar queries específicas con este ID.
   */
  private broadcastAppointmentCancelled(event: AppointmentCancelled) {
    // TODO: En producción, considerar agregar businessId al evento
    // o hacer query para obtenerlo antes de broadcast
    this.logger.warn(
      'AppointmentCancelled event does not include businessId. Broadcasting to all connected clients.',
    );

    // Broadcast a todos los clientes (no ideal, pero funcional para MVP)
    // Los clientes filtrarán por appointmentId
    this.eventsGateway.broadcastToAllClients('appointment:cancelled', {
      appointmentId: event.appointmentId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted appointment:cancelled for appointment ${event.appointmentId}`);
  }

  /**
   * Broadcast: Cita modificada
   *
   * Nota: AppointmentModified no incluye businessId en el evento.
   * Para MVP, solo broadcast el appointmentId y newDateTime.
   */
  private broadcastAppointmentModified(event: AppointmentModified) {
    // TODO: En producción, considerar agregar businessId al evento
    // o hacer query para obtenerlo antes de broadcast
    this.logger.warn(
      'AppointmentModified event does not include businessId. Broadcasting to all connected clients.',
    );

    // Broadcast a todos los clientes (no ideal, pero funcional para MVP)
    this.eventsGateway.broadcastToAllClients('appointment:modified', {
      appointmentId: event.appointmentId,
      newDateTime: event.newDateTime,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted appointment:modified for appointment ${event.appointmentId}`);
  }

  /**
   * Broadcast: Nuevo offering creado
   */
  private broadcastOfferingCreated(event: OfferingCreated) {
    this.eventsGateway.broadcastToBusinessRoom(event.businessId, 'offering:created', {
      offeringId: event.offeringId,
      name: event.name,
      durationMinutes: event.durationMinutes,
      maxCapacityPerSlot: event.maxCapacityPerSlot,
      maxDailyCapacity: event.maxDailyCapacity,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted offering:created to business ${event.businessId}`);
  }

  /**
   * Broadcast: Offering actualizado
   */
  private broadcastOfferingUpdated(event: OfferingUpdated) {
    this.eventsGateway.broadcastToBusinessRoom(event.businessId, 'offering:updated', {
      offeringId: event.offeringId,
      name: event.name,
      durationMinutes: event.durationMinutes,
      maxCapacityPerSlot: event.maxCapacityPerSlot,
      maxDailyCapacity: event.maxDailyCapacity,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted offering:updated to business ${event.businessId}`);
  }

  /**
   * Broadcast: Offering desactivado
   */
  private broadcastOfferingDeactivated(event: OfferingDeactivated) {
    this.eventsGateway.broadcastToBusinessRoom(event.businessId, 'offering:deactivated', {
      offeringId: event.offeringId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted offering:deactivated to business ${event.businessId}`);
  }

  /**
   * Broadcast: Offering activado
   */
  private broadcastOfferingActivated(event: OfferingActivated) {
    this.eventsGateway.broadcastToBusinessRoom(event.businessId, 'offering:activated', {
      offeringId: event.offeringId,
      timestamp: new Date().toISOString(),
    });

    this.logger.debug(`Broadcasted offering:activated to business ${event.businessId}`);
  }
}
