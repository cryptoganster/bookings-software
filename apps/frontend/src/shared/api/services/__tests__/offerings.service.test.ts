/**
 * Tests for Offerings API Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { offeringsService } from "../offerings.service";
import { apiClient } from "../../client";
import { ENDPOINTS } from "../../endpoints";
import type { OfferingDto } from "@packages/shared-types";

vi.mock("../../client");

describe("offeringsService", () => {
  const mockOffering: OfferingDto = {
    id: "offering-1",
    businessId: "business-1",
    name: "Haircut",
    duration: 30,
    maxCapacityPerSlot: 5,
    maxDailyCapacity: null,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all offerings", async () => {
      const mockData = [mockOffering];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await offeringsService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.OFFERINGS.LIST);
      expect(result).toEqual(mockData);
    });
  });

  describe("getActive", () => {
    it("should fetch only active offerings", async () => {
      const mockData = [mockOffering];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const result = await offeringsService.getActive();

      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.OFFERINGS.ACTIVE);
      expect(result).toEqual(mockData);
    });
  });

  describe("getById", () => {
    it("should fetch offering by id", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockOffering });

      const result = await offeringsService.getById("offering-1");

      expect(apiClient.get).toHaveBeenCalledWith(
        ENDPOINTS.OFFERINGS.DETAIL("offering-1"),
      );
      expect(result).toEqual(mockOffering);
    });
  });

  describe("create", () => {
    it("should create new offering", async () => {
      const createDto = {
        name: "Haircut",
        duration: 30,
        maxCapacityPerSlot: 5,
      };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockOffering });

      const result = await offeringsService.create(createDto);

      expect(apiClient.post).toHaveBeenCalledWith(
        ENDPOINTS.OFFERINGS.CREATE,
        createDto,
      );
      expect(result).toEqual(mockOffering);
    });
  });

  describe("update", () => {
    it("should update existing offering", async () => {
      const updateDto = { name: "Updated Haircut" };
      const updatedOffering = { ...mockOffering, name: "Updated Haircut" };
      vi.mocked(apiClient.put).mockResolvedValue({ data: updatedOffering });

      const result = await offeringsService.update("offering-1", updateDto);

      expect(apiClient.put).toHaveBeenCalledWith(
        ENDPOINTS.OFFERINGS.UPDATE("offering-1"),
        updateDto,
      );
      expect(result).toEqual(updatedOffering);
    });
  });

  describe("delete", () => {
    it("should delete offering", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });

      await offeringsService.delete("offering-1");

      expect(apiClient.delete).toHaveBeenCalledWith(
        ENDPOINTS.OFFERINGS.DELETE("offering-1"),
      );
    });
  });

  describe("toggleActive", () => {
    it("should toggle offering active status", async () => {
      const toggledOffering = { ...mockOffering, isActive: false };
      vi.mocked(apiClient.patch).mockResolvedValue({ data: toggledOffering });

      const result = await offeringsService.toggleActive("offering-1", false);

      expect(apiClient.patch).toHaveBeenCalledWith(
        ENDPOINTS.OFFERINGS.TOGGLE_ACTIVE("offering-1"),
        { isActive: false },
      );
      expect(result).toEqual(toggledOffering);
    });
  });
});
