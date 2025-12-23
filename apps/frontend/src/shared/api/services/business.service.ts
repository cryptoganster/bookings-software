/**
 * Business API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";
import type {
  BusinessDto,
  CreateBusinessRequestDto,
  UpdateBusinessInfoRequestDto,
  ConfigureWhatsAppRequestDto,
} from "@packages/shared-types";

export const businessService = {
  async getAll(): Promise<BusinessDto[]> {
    const { data } = await apiClient.get<BusinessDto[]>(
      ENDPOINTS.BUSINESS.LIST,
    );
    return data;
  },

  async getById(id: string): Promise<BusinessDto> {
    const { data } = await apiClient.get<BusinessDto>(
      ENDPOINTS.BUSINESS.DETAIL(id),
    );
    return data;
  },

  async create(dto: CreateBusinessRequestDto): Promise<BusinessDto> {
    const { data } = await apiClient.post<BusinessDto>(
      ENDPOINTS.BUSINESS.CREATE,
      dto,
    );
    return data;
  },

  async update(
    id: string,
    dto: UpdateBusinessInfoRequestDto,
  ): Promise<BusinessDto> {
    const { data } = await apiClient.put<BusinessDto>(
      ENDPOINTS.BUSINESS.UPDATE(id),
      dto,
    );
    return data;
  },

  async configureWhatsApp(
    id: string,
    dto: ConfigureWhatsAppRequestDto,
  ): Promise<BusinessDto> {
    const { data } = await apiClient.put<BusinessDto>(
      ENDPOINTS.BUSINESS.CONFIGURE_WHATSAPP(id),
      dto,
    );
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.BUSINESS.DEACTIVATE(id));
  },

  async activate(id: string): Promise<BusinessDto> {
    const { data } = await apiClient.post<BusinessDto>(
      ENDPOINTS.BUSINESS.ACTIVATE(id),
    );
    return data;
  },
};
