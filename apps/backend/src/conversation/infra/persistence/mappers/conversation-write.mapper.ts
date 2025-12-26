import { Conversation } from '@conversation/domain/aggregates/conversation';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';

/**
 * ConversationWriteMapper
 *
 * Mapper para convertir Conversation aggregate a ConversationModel (TypeORM entity).
 * Usado en el write repository para persistencia y en factory para reconstrucción.
 *
 * @remarks
 * - Convierte aggregate ↔ model (bidirectional)
 * - Maneja value objects (UUID, ConversationState)
 * - Preserva version para optimistic locking
 * - status: Admin query tracking ('ACTIVE', 'AWAITING_ADMIN', 'RESOLVED')
 * - state: Conversation flow state machine (INITIAL, SELECTING_SERVICE, etc.)
 */
export class ConversationWriteMapper {
  /**
   * Convierte Conversation aggregate a ConversationModel
   *
   * @param conversation - Aggregate del dominio
   * @returns TypeORM entity para persistencia
   */
  static toModel(conversation: Conversation): ConversationModel {
    const model = new ConversationModel();

    model.id = conversation.getId().getValue();
    model.businessId = conversation.getBusinessId().getValue();
    model.customerId = conversation.getCustomerId().getValue();
    model.customerPhone = conversation.getCustomerPhone();

    // Map both status and state
    model.status = conversation.getStatus();
    model.state = conversation.getState().getValue();

    model.selectedOfferingId = conversation.getSelectedOfferingId();

    // Convert Date to "YYYY-MM-DD" string to avoid timezone issues
    model.selectedDate = conversation.getSelectedDate()
      ? conversation.getSelectedDate()!.toISOString().split('T')[0]
      : undefined;

    model.selectedTime = conversation.getSelectedTime();
    model.createdAppointmentId = conversation.getCreatedAppointmentId();

    // lastMessageAt se actualiza automáticamente por la base de datos
    // No lo seteamos aquí

    model.version = conversation.getVersion().getValue();

    return model;
  }

  /**
   * Reconstruye Conversation aggregate desde ConversationModel
   * Usado por ConversationFactory
   *
   * @param model - TypeORM entity desde base de datos
   * @returns Aggregate del dominio con lógica de negocio
   */
  static toDomain(model: ConversationModel): Conversation {
    // Convert "YYYY-MM-DD" string to Date at midnight UTC
    const selectedDate = model.selectedDate
      ? (() => {
          const [year, month, day] = model.selectedDate.split('-').map(Number);
          return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        })()
      : undefined;

    // selectedTime is stored as string "HH:MM:SS" in the database
    const selectedTime = model.selectedTime as string | undefined;

    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      model.customerPhone,
      ConversationState.fromString(model.state),
      model.status,
      model.selectedOfferingId,
      selectedDate,
      selectedTime,
      model.createdAppointmentId,
      model.version,
    );
  }
}
