import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";

interface StatsData {
  appointmentsToday: number;
  appointmentsThisWeek: number;
}

const statsKeys = {
  all: ["stats"] as const,
  current: () => [...statsKeys.all, "current"] as const,
};

async function fetchStats(): Promise<StatsData> {
  const { data } = await apiClient.get<StatsData>("/appointments/stats");
  return data;
}

export function useStats() {
  return useQuery({
    queryKey: statsKeys.current(),
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
