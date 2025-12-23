import { Query } from '@nestjs/cqrs';

/**
 * Query to get a conversation
 * TODO: Implement full query logic and return type
 */
export class GetConversationQuery extends Query<any> {
  constructor(public readonly conversationId: string) {
    super();
  }
}
