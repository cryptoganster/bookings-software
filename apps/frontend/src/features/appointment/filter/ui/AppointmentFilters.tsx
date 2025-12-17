import { Select, Button, Group } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import { useAppointmentFilters } from '../model/useAppointmentFilters';
import type { AppointmentStatus } from '@packages/shared-types';

/**
 * Componente de filtros para appointments
 * Permite filtrar por estado y rango de fechas
 */
export function AppointmentFilters() {
  const { status, dateRange, setStatus, setDateRange, reset } = useAppointmentFilters();

  const statusOptions: { value: AppointmentStatus; label: string }[] = [
    { value: 'CONFIRMED', label: 'Confirmada' },
    { value: 'CANCELLED', label: 'Cancelada' },
    { value: 'COMPLETED', label: 'Completada' },
  ];

  // Convert between Mantine's DatesRangeValue and our store's [Date, Date] | null
  const handleDateRangeChange = (value: DatesRangeValue) => {
    if (value[0] && value[1]) {
      setDateRange([value[0], value[1]]);
    } else {
      setDateRange(null);
    }
  };

  return (
    <Group gap="md">
      <Select
        label="Estado"
        placeholder="Todos los estados"
        data={statusOptions}
        value={status}
        onChange={(value) => setStatus(value as AppointmentStatus | null)}
        clearable
        style={{ minWidth: 200 }}
      />

      <DatePickerInput
        type="range"
        label="Rango de fechas"
        placeholder="Selecciona fechas"
        value={dateRange ? [dateRange[0], dateRange[1]] : [null, null]}
        onChange={handleDateRangeChange}
        clearable
        style={{ minWidth: 300 }}
      />

      <Button
        variant="subtle"
        onClick={reset}
        style={{ marginTop: 24 }}
      >
        Limpiar filtros
      </Button>
    </Group>
  );
}
