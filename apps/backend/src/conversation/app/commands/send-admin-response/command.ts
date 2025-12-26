import { Command } from '@shared/kernel';

/**
 * Command to send an admin response
 * TODO: Implement full command logic
 */
export class SendAdminResponseCommand extends Command<void> {
  constructor(
    public readonly conversationId: string,
    public readonly message: string,
  ) {
    super();
  }
}
