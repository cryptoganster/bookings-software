import { Select, Button, Group } from "@mantine/core";
import { useAppointmentFilters } from "../model/useAppointmentFilters";
import { DateRangeFilter } from "./DateRangeFilter";
import type { AppointmentStatus } from "@packages/shared-types";

/**
 * Componente de filtros para appointments
 * Permite filtrar por estado y rango de fechas
 */
export function AppointmentFilters() {
  const { status, setStatus, reset } = useAppointmentFilters();

  const statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: "CONFIRMED", label: "Confirmada" },
    { value: "CANCELLED", label: "Cancelada" },
    { value: "COMPLETED", label: "Completada" },
  ];

  return (
    <Group gap="md" align="end">
      <Select
        label="Estado"
        placeholder="Todos los estados"
        data={statusOptions}
        value={status}
        onChange={(value) => setStatus(value as AppointmentStatus | null)}
        clearable
        radius="xl"
        style={{ minWidth: "min(200px, 100%)" }}
      />

      <DateRangeFilter />

      <Button variant="subtle" onClick={reset} radius="xl">
        Limpiar filtros
      </Button>
    </Group>
  );
}
