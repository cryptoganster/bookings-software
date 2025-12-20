/**
 * SearchCustomersForm Component
 *
 * Formulario de búsqueda de clientes con debounce
 * Incluye input de texto con icono de búsqueda
 */

import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface SearchCustomersFormProps {
  /**
   * Valor actual del texto de búsqueda
   */
  value: string;

  /**
   * Callback cuando cambia el texto de búsqueda
   */
  onChange: (value: string) => void;

  /**
   * Placeholder del input (opcional)
   */
  placeholder?: string;

  /**
   * Si el input está deshabilitado (opcional)
   */
  disabled?: boolean;
}

/**
 * Formulario de búsqueda de clientes
 *
 * Features:
 * - Input de texto con icono de búsqueda
 * - Placeholder descriptivo
 * - Diseño profesional con size="md" y radius="xl"
 * - Integración con debounce (manejado por el hook)
 *
 * Requirements:
 * - 8.1: Input de búsqueda con debounce
 * - 8.2: Búsqueda por nombre o teléfono
 *
 * @example
 * ```tsx
 * const { filters, updateFilters } = useSearchCustomers();
 *
 * <SearchCustomersForm
 *   value={filters.searchText}
 *   onChange={(value) => updateFilters({ searchText: value })}
 * />
 * ```
 */
export function SearchCustomersForm({
  value,
  onChange,
  placeholder = "Buscar por nombre o teléfono...",
  disabled = false,
}: SearchCustomersFormProps) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      leftSection={<IconSearch size={16} />}
      size="md"
      radius="xl"
      disabled={disabled}
      style={{ flex: 1 }}
    />
  );
}
