/**
 * Blockouts API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";

export interface BlockoutDto {
  id: string;
  businessId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface CreateBlockoutDto {
  startDate: string;
  endDate: string;
  reason: string;
}

export const blockoutsService = {
  async getAll(): Promise<BlockoutDto[]> {
    const { data } = await apiClient.get<BlockoutDto[]>(
      ENDPOINTS.BLOCKOUTS.LIST,
    );
    return data;
  },

  async create(dto: CreateBlockoutDto): Promise<BlockoutDto> {
    const { data } = await apiClient.post<BlockoutDto>(
      ENDPOINTS.BLOCKOUTS.CREATE,
      dto,
    );
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.BLOCKOUTS.DELETE(id));
  },
};
