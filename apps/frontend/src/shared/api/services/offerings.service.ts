/**
 * Offerings API Service
 *
 * Handles all API calls related to offerings (services offered by business).
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  OfferingDto,
  CreateOfferingRequestDto,
  UpdateOfferingRequestDto,
} from "@packages/shared-types";

export const offeringsService = {
  /**
   * Get all offerings for the authenticated business
   */
  async getAll(): Promise<OfferingDto[]> {
    const { data } = await apiClient.get<OfferingDto[]>(
      ENDPOINTS.OFFERINGS.LIST,
    );
    return data;
  },

  /**
   * Get only active offerings
   */
  async getActive(): Promise<OfferingDto[]> {
    const { data } = await apiClient.get<OfferingDto[]>(
      ENDPOINTS.OFFERINGS.ACTIVE,
    );
    return data;
  },

  /**
   * Get offering by ID
   */
  async getById(id: string): Promise<OfferingDto> {
    const { data } = await apiClient.get<OfferingDto>(
      ENDPOINTS.OFFERINGS.DETAIL(id),
    );
    return data;
  },

  /**
   * Create new offering
   */
  async create(dto: CreateOfferingRequestDto): Promise<OfferingDto> {
    const { data } = await apiClient.post<OfferingDto>(
      ENDPOINTS.OFFERINGS.CREATE,
      dto,
    );
    return data;
  },

  /**
   * Update existing offering
   */
  async update(
    id: string,
    dto: UpdateOfferingRequestDto,
  ): Promise<OfferingDto> {
    const { data } = await apiClient.put<OfferingDto>(
      ENDPOINTS.OFFERINGS.UPDATE(id),
      dto,
    );
    return data;
  },

  /**
   * Delete (deactivate) offering
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.OFFERINGS.DELETE(id));
  },

  /**
   * Toggle offering active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<OfferingDto> {
    const { data } = await apiClient.patch<OfferingDto>(
      ENDPOINTS.OFFERINGS.TOGGLE_ACTIVE(id),
      { isActive },
    );
    return data;
  },
};
