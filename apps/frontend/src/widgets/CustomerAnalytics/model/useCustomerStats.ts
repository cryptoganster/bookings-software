import { useQuery } from "@tanstack/react-query";
import { getCustomerStats } from "@shared/api/customers";
import type { CustomerStats } from "@entities/customer/model/types";

export const customerStatsKeys = {
  all: ["customerStats"] as const,
  current: () => [...customerStatsKeys.all, "current"] as const,
};

export function useCustomerStats() {
  return useQuery<CustomerStats>({
    queryKey: customerStatsKeys.current(),
    queryFn: getCustomerStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
