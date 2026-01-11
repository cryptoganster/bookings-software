/**
 * Property-Based Tests for Notification Helpers
 *
 * Tests universal properties of notification functions using fast-check.
 *
 * Properties tested:
 * - Property 7: Success notifications are consistent
 * - Property 8: Error notifications are consistent
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { notifications } from "@mantine/notifications";
import {
  showSuccessNotification,
  showErrorNotification,
} from "../notifications";

// Mock Mantine notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

describe("Notification Helpers - Property Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 7: Notificaciones de éxito son consistentes
   *
   * Para cualquier mensaje de éxito, el sistema debe mostrar una notificación
   * toast verde con el mensaje correcto que se oculta automáticamente después
   * de 3 segundos.
   *
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6
   *
   * Feature: offering-frontend-integration, Property 7: Success notifications are consistent
   */
  describe("Property 7: Success notifications are consistent", () => {
    it("should show green notification with 3s duration for any success message", () => {
      fc.assert(
        fc.property(
          // Generate random success messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (message) => {
            // Clear previous calls
            vi.clearAllMocks();

            // Act: Show success notification
            showSuccessNotification(message);

            // Assert: Verify notification was called with correct parameters
            expect(notifications.show).toHaveBeenCalledTimes(1);
            expect(notifications.show).toHaveBeenCalledWith(
              expect.objectContaining({
                title: "Éxito",
                message: message,
                color: "green",
                autoClose: 3000, // 3 seconds
              }),
            );
          },
        ),
        { numRuns: 100 }, // Run 100 iterations
      );
    });

    it("should allow custom title for success notifications", () => {
      fc.assert(
        fc.property(
          // Generate random messages and titles
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (message, title) => {
            // Clear previous calls
            vi.clearAllMocks();

            // Act: Show success notification with custom title
            showSuccessNotification(message, title);

            // Assert: Verify notification was called with custom title
            expect(notifications.show).toHaveBeenCalledTimes(1);
            expect(notifications.show).toHaveBeenCalledWith(
              expect.objectContaining({
                title: title,
                message: message,
                color: "green",
                autoClose: 3000,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always use green color for success notifications", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          vi.clearAllMocks();

          showSuccessNotification(message);

          const call = vi.mocked(notifications.show).mock.calls[0][0];
          expect(call.color).toBe("green");
        }),
        { numRuns: 100 },
      );
    });

    it("should always use 3000ms autoClose for success notifications", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          vi.clearAllMocks();

          showSuccessNotification(message);

          const call = vi.mocked(notifications.show).mock.calls[0][0];
          expect(call.autoClose).toBe(3000);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 8: Notificaciones de error son consistentes
   *
   * Para cualquier operación que falle, el sistema debe mostrar una notificación
   * toast roja con el mensaje de error específico que se oculta automáticamente
   * después de 5 segundos.
   *
   * Validates: Requirements 4.5, 4.7
   *
   * Feature: offering-frontend-integration, Property 8: Error notifications are consistent
   */
  describe("Property 8: Error notifications are consistent", () => {
    it("should show red notification with 5s duration for any error message", () => {
      fc.assert(
        fc.property(
          // Generate random error messages
          fc.string({ minLength: 1, maxLength: 200 }),
          (message) => {
            // Clear previous calls
            vi.clearAllMocks();

            // Act: Show error notification
            showErrorNotification(message);

            // Assert: Verify notification was called with correct parameters
            expect(notifications.show).toHaveBeenCalledTimes(1);
            expect(notifications.show).toHaveBeenCalledWith(
              expect.objectContaining({
                title: "Error",
                message: message,
                color: "red",
                autoClose: 5000, // 5 seconds
              }),
            );
          },
        ),
        { numRuns: 100 }, // Run 100 iterations
      );
    });

    it("should allow custom title for error notifications", () => {
      fc.assert(
        fc.property(
          // Generate random messages and titles
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (message, title) => {
            // Clear previous calls
            vi.clearAllMocks();

            // Act: Show error notification with custom title
            showErrorNotification(message, title);

            // Assert: Verify notification was called with custom title
            expect(notifications.show).toHaveBeenCalledTimes(1);
            expect(notifications.show).toHaveBeenCalledWith(
              expect.objectContaining({
                title: title,
                message: message,
                color: "red",
                autoClose: 5000,
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always use red color for error notifications", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          vi.clearAllMocks();

          showErrorNotification(message);

          const call = vi.mocked(notifications.show).mock.calls[0][0];
          expect(call.color).toBe("red");
        }),
        { numRuns: 100 },
      );
    });

    it("should always use 5000ms autoClose for error notifications", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          vi.clearAllMocks();

          showErrorNotification(message);

          const call = vi.mocked(notifications.show).mock.calls[0][0];
          expect(call.autoClose).toBe(5000);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional property: Verify different durations between success and error
   */
  describe("Success vs Error duration difference", () => {
    it("should always use longer duration for errors than success", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (message) => {
          vi.clearAllMocks();

          // Show both notifications
          showSuccessNotification(message);
          const successCall = vi.mocked(notifications.show).mock.calls[0][0];

          vi.clearAllMocks();

          showErrorNotification(message);
          const errorCall = vi.mocked(notifications.show).mock.calls[0][0];

          // Error duration should be longer than success duration
          const successDuration = successCall.autoClose as number;
          const errorDuration = errorCall.autoClose as number;
          expect(errorDuration).toBeGreaterThan(successDuration);
        }),
        { numRuns: 100 },
      );
    });
  });
});
