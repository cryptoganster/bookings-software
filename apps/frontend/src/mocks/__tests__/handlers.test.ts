/**
 * MSW Handlers Tests
 *
 * Verify that MSW handlers are working correctly
 */

import { describe, it, expect } from "vitest";
import axios from "axios";

// Use the same API_URL as the handlers
const API_URL = "http://localhost:3000/api";

// Create a test client that matches the MSW handlers URL
const testClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

describe("MSW Handlers", () => {
  describe("Auth endpoints", () => {
    it("should mock login endpoint", async () => {
      const response = await testClient.post("/auth/login", {
        email: "test@example.com",
        password: "password",
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("user");
      expect(response.data).toHaveProperty("token");
      expect(response.data.user.email).toBe("test@example.com");
      expect(response.data.token).toBe("mock-jwt-token");
    });
  });

  describe("Appointments endpoints", () => {
    it("should mock get appointments endpoint", async () => {
      const response = await testClient.get("/appointments");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it("should filter appointments by status", async () => {
      const response = await testClient.get("/appointments", {
        params: { status: "CONFIRMED" },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach((appointment: { status: string }) => {
        expect(appointment.status).toBe("CONFIRMED");
      });
    });

    it("should mock get appointment by id endpoint", async () => {
      const response = await testClient.get("/appointments/test-id");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("id");
      expect(response.data).toHaveProperty("customerName");
      expect(response.data).toHaveProperty("offeringName");
    });

    it("should mock cancel appointment endpoint", async () => {
      const response = await testClient.put("/appointments/test-id/cancel");

      expect(response.status).toBe(200);
      expect(response.data.status).toBe("CANCELLED");
      expect(response.data.cancelledAt).toBeDefined();
    });
  });

  describe("Stats endpoint", () => {
    it("should mock stats endpoint", async () => {
      const response = await testClient.get("/appointments/stats");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("today");
      expect(response.data).toHaveProperty("thisWeek");
      expect(response.data).toHaveProperty("pendingQueries");
      expect(response.data).toHaveProperty("occupancyRate");
    });
  });
});
