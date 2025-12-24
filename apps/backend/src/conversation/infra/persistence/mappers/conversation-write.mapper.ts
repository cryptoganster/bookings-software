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
 * - status y state se mapean al mismo valor (state del aggregate)
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

    // status y state se mapean al mismo valor por ahora
    const stateValue = conversation.getState().getValue();
    model.status = stateValue;
    model.state = stateValue;

    model.selectedOfferingId = conversation.getSelectedOfferingId();
    model.selectedDate = conversation.getSelectedDate();
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
    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      model.customerPhone,
      ConversationState.fromString(model.state),
      model.selectedOfferingId,
      model.selectedDate,
      model.selectedTime,
      model.createdAppointmentId,
      model.version,
    );
  }
}
