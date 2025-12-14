export class ProcessIncomingMessageCommand {
  constructor(
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly customerPhone: string,
    public readonly messageText: string,
    public readonly buttonId?: string,
  ) {}
}
