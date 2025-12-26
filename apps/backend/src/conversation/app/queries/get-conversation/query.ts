import { Query } from '@shared/kernel';

/**
 * Query to get a conversation
 * TODO: Implement full query logic and return type
 */
export class GetConversationQuery extends Query<unknown> {
  constructor(public readonly conversationId: string) {
    super();
  }
}
