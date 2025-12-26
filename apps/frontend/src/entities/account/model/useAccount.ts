/**
 * React Query hooks for Account (BusinessOwner)
 *
 * Provides hooks for:
 * - Fetching profile
 * - Fetching subscription
 * - Upgrading subscription
 * - Completing onboarding
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@shared/api/services/account.service";
import type { UpgradeSubscriptionRequestDto } from "@packages/shared-types";

// Query Keys
export const accountKeys = {
  all: ["account"] as const,
  profile: () => [...accountKeys.all, "profile"] as const,
  subscription: () => [...accountKeys.all, "subscription"] as const,
};

/**
 * Hook to fetch business owner profile
 */
export function useProfile() {
  return useQuery({
    queryKey: accountKeys.profile(),
    queryFn: () => accountService.getProfile(),
  });
}

/**
 * Hook to fetch subscription details
 */
export function useSubscription() {
  return useQuery({
    queryKey: accountKeys.subscription(),
    queryFn: () => accountService.getSubscription(),
  });
}

/**
 * Hook to upgrade subscription
 */
export function useUpgradeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpgradeSubscriptionRequestDto) =>
      accountService.upgradeSubscription(dto),
    onSuccess: () => {
      // Invalidate profile and subscription
      queryClient.invalidateQueries({ queryKey: accountKeys.profile() });
      queryClient.invalidateQueries({ queryKey: accountKeys.subscription() });
    },
  });
}

/**
 * Hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => accountService.completeOnboarding(),
    onSuccess: () => {
      // Invalidate profile
      queryClient.invalidateQueries({ queryKey: accountKeys.profile() });
    },
  });
}
