export class ConversationStateChanged {
  constructor(
    public readonly conversationId: string,
    public readonly previousState: string,
    public readonly newState: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
