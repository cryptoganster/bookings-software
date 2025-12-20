/**
 * CustomerFilters Component
 *
 * Filtros adicionales para la búsqueda de clientes
 * Incluye filtro por tipo (anónimo/registrado) y ordenamiento
 */

import { Select, Group } from "@mantine/core";
import type { CustomerFilters as CustomerFiltersType } from "@entities/customer/model/types";

interface CustomerFiltersProps {
  /**
   * Filtros actuales
   */
  filters: CustomerFiltersType;

  /**
   * Callback cuando cambian los filtros
   */
  onChange: (filters: Partial<CustomerFiltersType>) => void;

  /**
   * Si los filtros están deshabilitados (opcional)
   */
  disabled?: boolean;
}

/**
 * Filtros para búsqueda de clientes
 *
 * Features:
 * - Filtro por tipo (todos/anónimos/registrados)
 * - Ordenamiento por nombre, fecha de creación, número de citas
 * - Dirección de ordenamiento (ascendente/descendente)
 * - Diseño profesional con size="md" y radius="xl"
 *
 * Requirements:
 * - 8.3: Filtro por tipo de cliente
 * - 8.4: Ordenamiento por diferentes campos
 *
 * @example
 * ```tsx
 * const { filters, updateFilters } = useSearchCustomers();
 *
 * <CustomerFilters
 *   filters={filters}
 *   onChange={updateFilters}
 * />
 * ```
 */
export function CustomerFilters({
  filters,
  onChange,
  disabled = false,
}: CustomerFiltersProps) {
  return (
    <Group gap="md">
      {/* Filtro por tipo */}
      <Select
        label="Tipo"
        placeholder="Todos"
        value={filters.type || "all"}
        onChange={(value) =>
          onChange({ type: value as "all" | "anonymous" | "registered" })
        }
        data={[
          { value: "all", label: "Todos" },
          { value: "anonymous", label: "Anónimos" },
          { value: "registered", label: "Registrados" },
        ]}
        size="md"
        radius="xl"
        disabled={disabled}
        style={{ minWidth: 150 }}
      />

      {/* Ordenar por */}
      <Select
        label="Ordenar por"
        placeholder="Fecha de creación"
        value={filters.sortBy || "createdAt"}
        onChange={(value) =>
          onChange({
            sortBy: value as "name" | "createdAt" | "appointmentCount",
          })
        }
        data={[
          { value: "createdAt", label: "Fecha de creación" },
          { value: "name", label: "Nombre" },
          { value: "appointmentCount", label: "Número de citas" },
        ]}
        size="md"
        radius="xl"
        disabled={disabled}
        style={{ minWidth: 180 }}
      />

      {/* Dirección de ordenamiento */}
      <Select
        label="Dirección"
        placeholder="Descendente"
        value={filters.sortOrder || "desc"}
        onChange={(value) => onChange({ sortOrder: value as "asc" | "desc" })}
        data={[
          { value: "desc", label: "Descendente" },
          { value: "asc", label: "Ascendente" },
        ]}
        size="md"
        radius="xl"
        disabled={disabled}
        style={{ minWidth: 150 }}
      />
    </Group>
  );
}
