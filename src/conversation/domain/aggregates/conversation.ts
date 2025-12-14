import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '../vo/conversation-state';
import { ConversationStarted } from '../events/conversation-started';
import { ConversationStateChanged } from '../events/conversation-state-changed';
import { ConversationCompleted } from '../events/conversation-completed';

export class Conversation extends VersionedAggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private customerId!: UUID;
  private customerPhone!: string;
  private state!: ConversationState;
  private selectedOfferingId?: string;
  private selectedDate?: Date;
  private selectedTime?: Date;
  private createdAppointmentId?: string;

  // Factory method para creación
  static start(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    customerPhone: string,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.state = ConversationState.initial();

    // Publicar evento
    conversation.apply(
      new ConversationStarted(
        id.getValue(),
        businessId.getValue(),
        customerId.getValue(),
        customerPhone,
      ),
    );
    conversation.incrementVersion();

    return conversation;
  }

  // Métodos para transiciones de estado
  transitionToSelectingService(): void {
    const previousState = this.state.getValue();
    this.state = ConversationState.selectingService();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(
        this.id.getValue(),
        previousState,
        this.state.getValue(),
      ),
    );
  }

  selectService(offeringId: string): void {
    if (!this.state.isSelectingService()) {
      throw new Error('Cannot select service in current state');
    }

    this.selectedOfferingId = offeringId;
    const previousState = this.state.getValue();
    this.state = ConversationState.selectingDate();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(
        this.id.getValue(),
        previousState,
        this.state.getValue(),
      ),
    );
  }

  selectDate(date: Date): void {
    if (!this.state.isSelectingDate()) {
      throw new Error('Cannot select date in current state');
    }

    this.selectedDate = date;
    const previousState = this.state.getValue();
    this.state = ConversationState.selectingTime();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(
        this.id.getValue(),
        previousState,
        this.state.getValue(),
      ),
    );
  }

  selectTime(time: Date): void {
    if (!this.state.isSelectingTime()) {
      throw new Error('Cannot select time in current state');
    }

    this.selectedTime = time;
    const previousState = this.state.getValue();
    this.state = ConversationState.confirming();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(
        this.id.getValue(),
        previousState,
        this.state.getValue(),
      ),
    );
  }

  complete(appointmentId: string | null): void {
    if (!this.state.isConfirming()) {
      throw new Error('Cannot complete conversation in current state');
    }

    this.createdAppointmentId = appointmentId || undefined;
    this.state = ConversationState.completed();
    this.incrementVersion();

    this.apply(new ConversationCompleted(this.id.getValue(), appointmentId));
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    customerPhone: string,
    state: ConversationState,
    selectedOfferingId: string | undefined,
    selectedDate: Date | undefined,
    selectedTime: Date | undefined,
    createdAppointmentId: string | undefined,
    version: number,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.state = state;
    conversation.selectedOfferingId = selectedOfferingId;
    conversation.selectedDate = selectedDate;
    conversation.selectedTime = selectedTime;
    conversation.createdAppointmentId = createdAppointmentId;
    conversation.setVersion(version);
    return conversation;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }

  getBusinessId(): UUID {
    return this.businessId;
  }

  getCustomerId(): UUID {
    return this.customerId;
  }

  getCustomerPhone(): string {
    return this.customerPhone;
  }

  getState(): ConversationState {
    return this.state;
  }

  getSelectedOfferingId(): string | undefined {
    return this.selectedOfferingId;
  }

  getSelectedDate(): Date | undefined {
    return this.selectedDate;
  }

  getSelectedTime(): Date | undefined {
    return this.selectedTime;
  }

  getCreatedAppointmentId(): string | undefined {
    return this.createdAppointmentId;
  }
}
