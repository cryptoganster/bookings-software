/**
 * Tests for Logger Utility
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger } from "../logger";

describe("logger", () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupSpy: ReturnType<typeof vi.spyOn>;
  let consoleGroupEndSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
    consoleGroupEndSpy = vi
      .spyOn(console, "groupEnd")
      .mockImplementation(() => {});
  });

  describe("debug", () => {
    it("should log debug messages with context", () => {
      logger.debug("Debug message", { userId: "123" });

      // In test environment, DEV is true by default
      expect(consoleDebugSpy).toHaveBeenCalledWith("[DEBUG] Debug message", {
        userId: "123",
      });
    });

    it("should handle missing context", () => {
      logger.debug("Debug message");

      expect(consoleDebugSpy).toHaveBeenCalledWith("[DEBUG] Debug message", "");
    });
  });

  describe("info", () => {
    it("should log info messages", () => {
      logger.info("Info message", { action: "login" });

      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] Info message", {
        action: "login",
      });
    });
  });

  describe("warn", () => {
    it("should always log warning messages", () => {
      logger.warn("Warning message", { reason: "timeout" });

      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] Warning message", {
        reason: "timeout",
      });
    });
  });

  describe("error", () => {
    it("should always log error messages", () => {
      const error = new Error("Test error");
      logger.error("Error message", { error });

      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] Error message", {
        error,
      });
    });
  });

  describe("group", () => {
    it("should create log group", () => {
      logger.group("Test Group");

      expect(consoleGroupSpy).toHaveBeenCalledWith("Test Group");
    });
  });

  describe("groupEnd", () => {
    it("should end log group", () => {
      logger.groupEnd();

      expect(consoleGroupEndSpy).toHaveBeenCalled();
    });
  });
});
