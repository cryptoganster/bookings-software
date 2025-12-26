import { Command } from '@shared/kernel';

/**
 * Command to create a blockout
 * TODO: Implement full command logic
 */
export class CreateBlockoutCommand extends Command<{ blockoutId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string | null,
  ) {
    super();
  }
}
