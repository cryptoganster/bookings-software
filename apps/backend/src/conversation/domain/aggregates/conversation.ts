import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';
import { ConversationStarted } from '@conversation/domain/events/conversation-started';
import { ConversationStateChanged } from '@conversation/domain/events/conversation-state-changed';
import { ConversationCompleted } from '@conversation/domain/events/conversation-completed';
import { AdminQueryResolved } from '@conversation/domain/events/admin-query-resolved.event';

export class Conversation extends VersionedAggregateRoot {
  private id!: UUID;
  private businessId!: UUID;
  private customerId!: UUID;
  private customerPhone!: string;
  private state!: ConversationState;
  private status!: string; // 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
  private selectedOfferingId?: string;
  private selectedDate?: Date;
  private selectedTime?: string; // Store as "HH:MM" format
  private createdAppointmentId?: string;

  // Factory method para creación
  static start(id: UUID, businessId: UUID, customerId: UUID, customerPhone: string): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.state = ConversationState.initial();
    conversation.status = 'ACTIVE'; // Initial status

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
      new ConversationStateChanged(this.id.getValue(), previousState, this.state.getValue()),
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
      new ConversationStateChanged(this.id.getValue(), previousState, this.state.getValue()),
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
      new ConversationStateChanged(this.id.getValue(), previousState, this.state.getValue()),
    );
  }

  selectTime(time: string): void {
    if (!this.state.isSelectingTime()) {
      throw new Error('Cannot select time in current state');
    }

    this.selectedTime = time;
    const previousState = this.state.getValue();
    this.state = ConversationState.confirming();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(this.id.getValue(), previousState, this.state.getValue()),
    );
  }

  transitionToSelectingTime(): void {
    const previousState = this.state.getValue();
    this.state = ConversationState.selectingTime();
    this.incrementVersion();

    this.apply(
      new ConversationStateChanged(this.id.getValue(), previousState, this.state.getValue()),
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

  /**
   * Resolves an admin query by marking the conversation as resolved.
   *
   * @throws Error if conversation is already resolved
   *
   * @remarks
   * - Updates status from 'AWAITING_ADMIN' to 'RESOLVED'
   * - Increments version for optimistic locking
   * - Publishes AdminQueryResolved event
   */
  resolveAdminQuery(): void {
    if (this.status === 'RESOLVED') {
      throw new Error('Conversation is already resolved');
    }

    this.status = 'RESOLVED';
    this.incrementVersion();

    this.apply(new AdminQueryResolved(this.id.getValue()));
  }

  // Factory method para reconstrucción desde persistencia
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    customerPhone: string,
    state: ConversationState,
    status: string,
    selectedOfferingId: string | undefined,
    selectedDate: Date | undefined,
    selectedTime: string | undefined,
    createdAppointmentId: string | undefined,
    version: number,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.state = state;
    conversation.status = status;
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

  getSelectedTime(): string | undefined {
    return this.selectedTime;
  }

  getCreatedAppointmentId(): string | undefined {
    return this.createdAppointmentId;
  }

  getStatus(): string {
    return this.status;
  }
}
