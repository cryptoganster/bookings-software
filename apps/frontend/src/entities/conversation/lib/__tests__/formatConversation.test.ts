import { describe, it, expect } from "vitest";
import type { ConversationReadModel } from "@packages/shared-types";
import {
  formatConversationTime,
  getConversationDisplayName,
  needsAdminAttention,
  sortConversationsByPriority,
} from "../formatConversation";

const mockConversation: ConversationReadModel = {
  id: "1",
  businessId: "business-1",
  customerId: "customer-1",
  customerName: "Juan Pérez",
  customerPhone: "+18095551234",
  status: "ACTIVE",
  lastMessageAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

describe("formatConversationTime", () => {
  it("should format time as relative", () => {
    const result = formatConversationTime(mockConversation);
    expect(result).toContain("hace");
  });
});

describe("getConversationDisplayName", () => {
  it("should return customer name when available", () => {
    expect(getConversationDisplayName(mockConversation)).toBe("Juan Pérez");
  });

  it("should return fallback when no customer name", () => {
    const conversation = { ...mockConversation, customerName: null };
    expect(getConversationDisplayName(conversation)).toBe("Cliente");
  });
});

describe("needsAdminAttention", () => {
  it("should return true for AWAITING_ADMIN status", () => {
    const conversation = {
      ...mockConversation,
      status: "AWAITING_ADMIN" as const,
    };
    expect(needsAdminAttention(conversation)).toBe(true);
  });

  it("should return false for other statuses", () => {
    expect(needsAdminAttention(mockConversation)).toBe(false);
  });
});

describe("sortConversationsByPriority", () => {
  it("should sort AWAITING_ADMIN first", () => {
    const conversations: ConversationReadModel[] = [
      { ...mockConversation, id: "1", status: "ACTIVE" },
      { ...mockConversation, id: "2", status: "AWAITING_ADMIN" },
      { ...mockConversation, id: "3", status: "RESOLVED" },
    ];

    const sorted = sortConversationsByPriority(conversations);

    expect(sorted[0].status).toBe("AWAITING_ADMIN");
  });

  it("should sort by most recent within same priority", () => {
    const now = Date.now();
    const conversations: ConversationReadModel[] = [
      {
        ...mockConversation,
        id: "1",
        lastMessageAt: new Date(now - 3600000).toISOString(),
      },
      {
        ...mockConversation,
        id: "2",
        lastMessageAt: new Date(now).toISOString(),
      },
    ];

    const sorted = sortConversationsByPriority(conversations);

    expect(sorted[0].id).toBe("2");
  });

  it("should not mutate original array", () => {
    const conversations: ConversationReadModel[] = [
      { ...mockConversation, id: "1", status: "ACTIVE" },
      { ...mockConversation, id: "2", status: "AWAITING_ADMIN" },
    ];

    const original = [...conversations];
    sortConversationsByPriority(conversations);

    expect(conversations).toEqual(original);
  });
});
