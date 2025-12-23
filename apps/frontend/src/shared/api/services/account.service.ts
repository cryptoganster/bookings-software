/**
 * Account API Service
 */

import { apiClient } from "../client";
import { ENDPOINTS } from "../endpoints";

export interface ProfileDto {
  id: string;
  userId: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface SubscriptionDto {
  plan: string;
  status: string;
  maxBusinesses: number;
  maxAppointmentsPerMonth: number;
  price: number;
}

export interface UpgradeSubscriptionDto {
  newPlan: string;
}

export const accountService = {
  async getProfile(): Promise<ProfileDto> {
    const { data } = await apiClient.get<ProfileDto>(ENDPOINTS.ACCOUNT.PROFILE);
    return data;
  },

  async getSubscription(): Promise<SubscriptionDto> {
    const { data } = await apiClient.get<SubscriptionDto>(
      ENDPOINTS.ACCOUNT.SUBSCRIPTION,
    );
    return data;
  },

  async upgradeSubscription(dto: UpgradeSubscriptionDto): Promise<void> {
    await apiClient.put(ENDPOINTS.ACCOUNT.UPGRADE_SUBSCRIPTION, dto);
  },

  async completeOnboarding(): Promise<void> {
    await apiClient.post(ENDPOINTS.ACCOUNT.COMPLETE_ONBOARDING);
  },
};
