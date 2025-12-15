export class ConversationCompleted {
  constructor(
    public readonly conversationId: string,
    public readonly appointmentId: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
