/**
 * AdminQueryResolved Domain Event
 *
 * Published when an admin responds to a customer query,
 * marking the conversation as resolved.
 *
 * @remarks
 * - Triggers notification to customer
 * - Updates conversation status tracking
 * - Part of admin query management flow
 */
export class AdminQueryResolved {
  constructor(
    public readonly conversationId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
