import { useQuery } from "@tanstack/react-query";
// import { apiClient } from "@shared/api/client"; // Uncomment when backend endpoint is ready

interface StatsData {
  appointmentsToday: number;
  appointmentsThisWeek: number;
}

export const statsKeys = {
  all: ["stats"] as const,
  current: () => [...statsKeys.all, "current"] as const,
};

async function fetchStats(): Promise<StatsData> {
  // TODO: Backend endpoint GET /appointments/stats needs to be implemented
  // Task created in .kiro/specs/proyecto-base-mvp/tasks.md
  // For now, return mock data for MVP frontend development

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data - will be replaced when backend endpoint is ready
  return {
    appointmentsToday: 5,
    appointmentsThisWeek: 23,
  };

  // Future implementation (uncomment when backend is ready):
  // const { data } = await apiClient.get<StatsData>("/appointments/stats");
  // return data;
}

export function useStats() {
  return useQuery({
    queryKey: statsKeys.current(),
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
