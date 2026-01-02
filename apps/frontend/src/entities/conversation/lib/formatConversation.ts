import type { ConversationReadModel } from "@packages/shared-types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formats conversation last message time as relative time
 */
export function formatConversationTime(
  conversation: ConversationReadModel,
): string {
  return formatDistanceToNow(new Date(conversation.lastMessageAt), {
    addSuffix: true,
    locale: es,
  });
}

/**
 * Gets display name for conversation (customer name or fallback)
 */
export function getConversationDisplayName(
  conversation: ConversationReadModel,
): string {
  return conversation.customerName || "Cliente";
}

/**
 * Checks if conversation needs admin attention
 */
export function needsAdminAttention(
  conversation: ConversationReadModel,
): boolean {
  return conversation.status === "AWAITING_ADMIN";
}

/**
 * Sorts conversations by priority (awaiting admin first, then by last message)
 */
export function sortConversationsByPriority(
  conversations: ConversationReadModel[],
): ConversationReadModel[] {
  return [...conversations].sort((a, b) => {
    // Awaiting admin first
    if (a.status === "AWAITING_ADMIN" && b.status !== "AWAITING_ADMIN")
      return -1;
    if (b.status === "AWAITING_ADMIN" && a.status !== "AWAITING_ADMIN")
      return 1;

    // Then by most recent
    return (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });
}
