/**
 * useSearchCustomers Hook
 *
 * Hook para búsqueda de clientes con debounce
 * Integra TanStack Query con debounce para optimizar las búsquedas
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@shared/hooks";
import { searchCustomers } from "@shared/api/customers";
import { customerKeys } from "@entities/customer/model/useCustomer";
import type { CustomerFilters } from "@entities/customer/model/types";

/**
 * Hook para búsqueda de clientes con debounce
 *
 * Features:
 * - Debounce de 300ms en el texto de búsqueda
 * - Integración con TanStack Query
 * - keepPreviousData para mejor UX en paginación
 * - Manejo automático de loading y error states
 *
 * @param initialFilters - Filtros iniciales (opcional)
 * @returns Query result con datos, loading, error y funciones de actualización
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   filters,
 *   updateFilters,
 *   debouncedSearchText
 * } = useSearchCustomers();
 *
 * // Actualizar filtros
 * updateFilters({ searchText: 'Juan' });
 * ```
 */
export function useSearchCustomers(initialFilters?: Partial<CustomerFilters>) {
  const [filters, setFilters] = useState<CustomerFilters>({
    searchText: "",
    type: "all",
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...initialFilters,
  });

  // Debounce del texto de búsqueda (300ms)
  const debouncedSearchText = useDebounce(filters.searchText, 300);

  // Query con los filtros debounced
  const query = useQuery({
    queryKey: customerKeys.list({
      ...filters,
      searchText: debouncedSearchText,
    }),
    queryFn: () =>
      searchCustomers({
        ...filters,
        searchText: debouncedSearchText,
      }),
    placeholderData: (previousData) => previousData, // keepPreviousData replacement
  });

  /**
   * Actualizar filtros
   * Resetea la página a 1 si cambia el texto de búsqueda o los filtros
   */
  const updateFilters = (newFilters: Partial<CustomerFilters>) => {
    setFilters((prev) => {
      // Si cambia searchText o type, resetear página
      const shouldResetPage =
        newFilters.searchText !== undefined || newFilters.type !== undefined;

      return {
        ...prev,
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page ?? prev.page),
      };
    });
  };

  /**
   * Resetear filtros a valores iniciales
   */
  const resetFilters = () => {
    setFilters({
      searchText: "",
      type: "all",
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...initialFilters,
    });
  };

  return {
    ...query,
    filters,
    updateFilters,
    resetFilters,
    debouncedSearchText,
  };
}
