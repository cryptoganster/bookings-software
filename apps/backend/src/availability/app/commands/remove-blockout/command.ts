import { Command } from '@nestjs/cqrs';

/**
 * Command to remove a blockout
 * TODO: Implement full command logic
 */
export class RemoveBlockoutCommand extends Command<void> {
  constructor(public readonly blockoutId: string) {
    super();
  }
}
