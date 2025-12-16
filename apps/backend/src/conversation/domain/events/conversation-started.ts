export class ConversationStarted {
  constructor(
    public readonly conversationId: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly customerPhone: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
