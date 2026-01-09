/**
 * Appointment Query Keys and Hooks
 *
 * Este módulo define las query keys y hooks de TanStack Query
 * para gestionar el estado del servidor relacionado con appointments.
 *
 * Patrón de Query Keys:
 * - Jerárquico: permite invalidación granular
 * - Tipado: TypeScript infiere tipos automáticamente
 * - Consistente: mismo patrón en toda la app
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@shared/api/client";
import { ENDPOINTS } from "@shared/api/endpoints";
import type { AppointmentReadModel, AppointmentFilters } from "./types";
import type {
  AppointmentDto,
  AppointmentFiltersDto,
} from "@packages/shared-types";

/**
 * Query Keys Factory
 *
 * Estructura jerárquica que permite invalidación granular:
 * - appointmentKeys.all → invalida TODAS las queries de appointments
 * - appointmentKeys.lists() → invalida todas las listas
 * - appointmentKeys.list(filters) → invalida lista específica con esos filtros
 * - appointmentKeys.details() → invalida todos los detalles
 * - appointmentKeys.detail(id) → invalida detalle específico
 */
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters?: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  upcoming: () => [...appointmentKeys.all, "upcoming"] as const,
  today: () => [...appointmentKeys.all, "today"] as const,
};

/**
 * Convierte filtros del frontend al formato API
 */
function convertFiltersToApi(
  filters?: AppointmentFilters,
): AppointmentFiltersDto | undefined {
  if (!filters) return undefined;

  const apiFilters: AppointmentFiltersDto = {};

  if (filters.status) {
    apiFilters.status = filters.status;
  }

  if (filters.dateRange) {
    const [startDate, endDate] = filters.dateRange;
    apiFilters.startDate = startDate.toISOString();
    apiFilters.endDate = endDate.toISOString();
  }

  if (filters.offeringId) {
    apiFilters.offeringId = filters.offeringId;
  }

  return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
}

/**
 * API Functions
 */
const appointmentsApi = {
  /**
   * Obtiene lista de appointments con filtros opcionales
   */
  getAll: async (
    filters?: AppointmentFilters,
  ): Promise<AppointmentReadModel[]> => {
    const apiFilters = convertFiltersToApi(filters);
    const response = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.LIST,
      { params: apiFilters },
    );
    return response.data;
  },

  /**
   * Obtiene un appointment por ID
   */
  getById: async (id: string): Promise<AppointmentReadModel> => {
    const response = await apiClient.get<AppointmentDto>(
      ENDPOINTS.APPOINTMENTS.DETAIL(id),
    );
    return response.data;
  },

  /**
   * Obtiene appointments próximos
   */
  getUpcoming: async (): Promise<AppointmentReadModel[]> => {
    const response = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.UPCOMING,
    );
    return response.data;
  },

  /**
   * Obtiene appointments de hoy
   */
  getToday: async (): Promise<AppointmentReadModel[]> => {
    const response = await apiClient.get<AppointmentDto[]>(
      ENDPOINTS.APPOINTMENTS.TODAY,
    );
    return response.data;
  },
};

/**
 * Hook: useAppointments
 *
 * Obtiene lista de appointments con filtros opcionales
 *
 * Configuración de caching:
 * - staleTime: 30 segundos - datos considerados frescos por 30s
 * - gcTime: 5 minutos - datos en cache por 5 minutos después de no usarse
 * - retry: 3 intentos con exponential backoff
 *
 * @param filters - Filtros opcionales (status, dateRange, offeringId)
 * @param options - Opciones adicionales de TanStack Query
 *
 * @example
 * ```tsx
 * const { data: appointments, isLoading } = useAppointments();
 *
 * // Con filtros
 * const { data } = useAppointments({
 *   status: 'CONFIRMED',
 *   dateRange: [new Date(), new Date()]
 * });
 * ```
 */
export function useAppointments(
  filters?: AppointmentFilters,
  options?: Omit<
    UseQueryOptions<AppointmentReadModel[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<AppointmentReadModel[], Error>({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => appointmentsApi.getAll(filters),
    staleTime: 30000, // 30 segundos - datos frescos por 30s
    gcTime: 300000, // 5 minutos - mantener en cache por 5 minutos
    retry: 3, // 3 reintentos con exponential backoff
    ...options,
  });
}

/**
 * Hook: useAppointment
 *
 * Obtiene un appointment específico por ID
 *
 * @param id - ID del appointment
 * @param options - Opciones adicionales de TanStack Query
 *
 * @example
 * ```tsx
 * const { data: appointment, isLoading } = useAppointment('appointment-id');
 * ```
 */
export function useAppointment(
  id: string,
  options?: Omit<
    UseQueryOptions<AppointmentReadModel, Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<AppointmentReadModel, Error>({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsApi.getById(id),
    ...options,
  });
}

/**
 * Hook: useUpcomingAppointments
 *
 * Obtiene appointments próximos (útil para dashboard)
 *
 * @param options - Opciones adicionales de TanStack Query
 *
 * @example
 * ```tsx
 * const { data: upcoming, isLoading } = useUpcomingAppointments();
 * ```
 */
export function useUpcomingAppointments(
  options?: Omit<
    UseQueryOptions<AppointmentReadModel[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<AppointmentReadModel[], Error>({
    queryKey: appointmentKeys.upcoming(),
    queryFn: () => appointmentsApi.getUpcoming(),
    ...options,
  });
}

/**
 * Hook: useTodayAppointments
 *
 * Obtiene appointments de hoy (útil para dashboard)
 *
 * @param options - Opciones adicionales de TanStack Query
 *
 * @example
 * ```tsx
 * const { data: today, isLoading } = useTodayAppointments();
 * ```
 */
export function useTodayAppointments(
  options?: Omit<
    UseQueryOptions<AppointmentReadModel[], Error>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<AppointmentReadModel[], Error>({
    queryKey: appointmentKeys.today(),
    queryFn: () => appointmentsApi.getToday(),
    ...options,
  });
}
