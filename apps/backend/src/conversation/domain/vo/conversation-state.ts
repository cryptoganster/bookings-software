import { ValueObject } from '@shared/kernel/value-object';

export class ConversationState extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    const validStates = [
      'INITIAL',
      'SELECTING_SERVICE',
      'SELECTING_DATE',
      'SELECTING_TIME',
      'CONFIRMING',
      'COMPLETED',
    ];

    if (!validStates.includes(value)) {
      throw new Error(`Invalid conversation state: ${value}`);
    }
  }

  static initial(): ConversationState {
    return new ConversationState('INITIAL');
  }

  static selectingService(): ConversationState {
    return new ConversationState('SELECTING_SERVICE');
  }

  static selectingDate(): ConversationState {
    return new ConversationState('SELECTING_DATE');
  }

  static selectingTime(): ConversationState {
    return new ConversationState('SELECTING_TIME');
  }

  static confirming(): ConversationState {
    return new ConversationState('CONFIRMING');
  }

  static completed(): ConversationState {
    return new ConversationState('COMPLETED');
  }

  static fromString(value: string): ConversationState {
    return new ConversationState(value);
  }

  getValue(): string {
    return this.value;
  }

  isInitial(): boolean {
    return this.value === 'INITIAL';
  }

  isSelectingService(): boolean {
    return this.value === 'SELECTING_SERVICE';
  }

  isSelectingDate(): boolean {
    return this.value === 'SELECTING_DATE';
  }

  isSelectingTime(): boolean {
    return this.value === 'SELECTING_TIME';
  }

  isConfirming(): boolean {
    return this.value === 'CONFIRMING';
  }

  isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
