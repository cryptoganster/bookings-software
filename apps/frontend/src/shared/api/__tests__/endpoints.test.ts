/**
 * Tests for API Endpoints
 */

import { describe, it, expect } from "vitest";
import { ENDPOINTS } from "../endpoints";

describe("ENDPOINTS", () => {
  describe("AUTH", () => {
    it("should have correct auth endpoints", () => {
      expect(ENDPOINTS.AUTH.LOGIN).toBe("/auth/login");
      expect(ENDPOINTS.AUTH.REGISTER).toBe("/auth/register");
      expect(ENDPOINTS.AUTH.REFRESH).toBe("/auth/refresh");
      expect(ENDPOINTS.AUTH.LOGOUT).toBe("/auth/logout");
    });
  });

  describe("ACCOUNT", () => {
    it("should have correct account endpoints", () => {
      expect(ENDPOINTS.ACCOUNT.PROFILE).toBe("/account/profile");
      expect(ENDPOINTS.ACCOUNT.SUBSCRIPTION).toBe("/account/subscription");
      expect(ENDPOINTS.ACCOUNT.UPGRADE_SUBSCRIPTION).toBe(
        "/account/subscription/upgrade",
      );
      expect(ENDPOINTS.ACCOUNT.COMPLETE_ONBOARDING).toBe(
        "/account/onboarding/complete",
      );
    });
  });

  describe("APPOINTMENTS", () => {
    it("should have correct appointment endpoints", () => {
      expect(ENDPOINTS.APPOINTMENTS.LIST).toBe("/appointments");
      expect(ENDPOINTS.APPOINTMENTS.TODAY).toBe("/appointments/today");
      expect(ENDPOINTS.APPOINTMENTS.UPCOMING).toBe("/appointments/upcoming");
    });

    it("should generate dynamic appointment endpoints", () => {
      expect(ENDPOINTS.APPOINTMENTS.DETAIL("123")).toBe("/appointments/123");
      expect(ENDPOINTS.APPOINTMENTS.CANCEL("456")).toBe(
        "/appointments/456/cancel",
      );
    });
  });

  describe("OFFERINGS", () => {
    it("should have correct offering endpoints", () => {
      expect(ENDPOINTS.OFFERINGS.LIST).toBe("/offerings");
      expect(ENDPOINTS.OFFERINGS.ACTIVE).toBe("/offerings/active");
      expect(ENDPOINTS.OFFERINGS.CREATE).toBe("/offerings");
    });

    it("should generate dynamic offering endpoints", () => {
      expect(ENDPOINTS.OFFERINGS.DETAIL("123")).toBe("/offerings/123");
      expect(ENDPOINTS.OFFERINGS.UPDATE("123")).toBe("/offerings/123");
      expect(ENDPOINTS.OFFERINGS.DELETE("123")).toBe("/offerings/123");
      expect(ENDPOINTS.OFFERINGS.TOGGLE_ACTIVE("123")).toBe(
        "/offerings/123/active",
      );
    });
  });

  describe("SCHEDULES", () => {
    it("should have correct schedule endpoints", () => {
      expect(ENDPOINTS.SCHEDULES.LIST).toBe("/schedules");
      expect(ENDPOINTS.SCHEDULES.CREATE).toBe("/schedules");
    });

    it("should generate dynamic schedule endpoints", () => {
      expect(ENDPOINTS.SCHEDULES.UPDATE("123")).toBe("/schedules/123");
      expect(ENDPOINTS.SCHEDULES.DELETE("123")).toBe("/schedules/123");
    });
  });

  describe("BLOCKOUTS", () => {
    it("should have correct blockout endpoints", () => {
      expect(ENDPOINTS.BLOCKOUTS.LIST).toBe("/blockouts");
      expect(ENDPOINTS.BLOCKOUTS.CREATE).toBe("/blockouts");
    });

    it("should generate dynamic blockout endpoints", () => {
      expect(ENDPOINTS.BLOCKOUTS.DELETE("123")).toBe("/blockouts/123");
    });
  });

  describe("AVAILABILITY", () => {
    it("should have correct availability endpoints", () => {
      expect(ENDPOINTS.AVAILABILITY.DATES).toBe("/availability/dates");
      expect(ENDPOINTS.AVAILABILITY.SLOTS).toBe("/availability/slots");
    });
  });

  describe("BUSINESS", () => {
    it("should have correct business endpoints", () => {
      expect(ENDPOINTS.BUSINESS.LIST).toBe("/businesses");
      expect(ENDPOINTS.BUSINESS.CREATE).toBe("/businesses");
    });

    it("should generate dynamic business endpoints", () => {
      expect(ENDPOINTS.BUSINESS.DETAIL("123")).toBe("/businesses/123");
      expect(ENDPOINTS.BUSINESS.UPDATE("123")).toBe("/businesses/123");
      expect(ENDPOINTS.BUSINESS.CONFIGURE_WHATSAPP("123")).toBe(
        "/businesses/123/whatsapp",
      );
      expect(ENDPOINTS.BUSINESS.DEACTIVATE("123")).toBe("/businesses/123");
      expect(ENDPOINTS.BUSINESS.ACTIVATE("123")).toBe(
        "/businesses/123/activate",
      );
    });
  });

  describe("CONVERSATIONS", () => {
    it("should have correct conversation endpoints", () => {
      expect(ENDPOINTS.CONVERSATIONS.PENDING).toBe("/admin-queries/pending");
    });

    it("should generate dynamic conversation endpoints", () => {
      expect(ENDPOINTS.CONVERSATIONS.DETAIL("123")).toBe("/admin-queries/123");
      expect(ENDPOINTS.CONVERSATIONS.RESPOND("123")).toBe(
        "/admin-queries/123/respond",
      );
    });
  });

  describe("ANALYTICS", () => {
    it("should have correct analytics endpoints", () => {
      expect(ENDPOINTS.ANALYTICS.APPOINTMENTS).toBe("/analytics/appointments");
      expect(ENDPOINTS.ANALYTICS.OFFERINGS).toBe("/analytics/offerings");
    });
  });

  describe("CUSTOMERS", () => {
    it("should have correct customer endpoints", () => {
      expect(ENDPOINTS.CUSTOMERS.LIST).toBe("/customers");
      expect(ENDPOINTS.CUSTOMERS.SEARCH).toBe("/customers/search");
      expect(ENDPOINTS.CUSTOMERS.STATS).toBe("/customers/stats");
      expect(ENDPOINTS.CUSTOMERS.MERGE).toBe("/customers/merge");
      expect(ENDPOINTS.CUSTOMERS.DUPLICATES).toBe("/customers/duplicates");
    });

    it("should generate dynamic customer endpoints", () => {
      expect(ENDPOINTS.CUSTOMERS.DETAIL("123")).toBe("/customers/123");
      expect(ENDPOINTS.CUSTOMERS.BY_USER_ID("user-123")).toBe(
        "/customers/user/user-123",
      );
      expect(ENDPOINTS.CUSTOMERS.DELETE("123")).toBe("/customers/123");
      expect(ENDPOINTS.CUSTOMERS.EXPORT("123")).toBe("/customers/123/export");
    });
  });
});
