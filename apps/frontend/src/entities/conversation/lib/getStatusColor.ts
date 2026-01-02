import type { MantineColor } from "@mantine/core";

/**
 * Maps conversation status to Mantine color
 */
export function getConversationStatusColor(
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED",
): MantineColor {
  const colorMap: Record<string, MantineColor> = {
    ACTIVE: "blue",
    AWAITING_ADMIN: "red",
    RESOLVED: "gray",
  };

  return colorMap[status] || "gray";
}

/**
 * Maps message direction to color
 */
export function getMessageDirectionColor(
  direction: "INBOUND" | "OUTBOUND",
): MantineColor {
  return direction === "OUTBOUND" ? "blue" : "gray";
}
