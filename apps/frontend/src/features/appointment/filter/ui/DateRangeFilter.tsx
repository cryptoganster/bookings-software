import {
  Stack,
  SegmentedControl,
  type SegmentedControlItem,
} from "@mantine/core";
import { DatePickerInput, type DatesRangeValue } from "@mantine/dates";
import { useDateRangePresets } from "../model/useDateRangePresets";
import { useAppointmentFilters } from "../model/useAppointmentFilters";

/**
 * DateRangeFilter component
 * Permite seleccionar un rango de fechas mediante presets (Hoy, Semana, Mes)
 * o un rango personalizado con DatePickerInput
 */
export function DateRangeFilter() {
  const { preset, setPreset, getPresetLabel } = useDateRangePresets();
  const { dateRange, setDateRange } = useAppointmentFilters();

  // Configurar opciones del SegmentedControl
  const segmentedControlData: SegmentedControlItem[] = [
    { label: getPresetLabel("today"), value: "today" },
    { label: getPresetLabel("week"), value: "week" },
    { label: getPresetLabel("month"), value: "month" },
    { label: getPresetLabel("custom"), value: "custom" },
  ];

  // Convertir dateRange a DatesRangeValue para Mantine
  const mantineDateRange: DatesRangeValue = dateRange
    ? [dateRange[0], dateRange[1]]
    : [null, null];

  // Handler para convertir DatesRangeValue de vuelta a nuestro formato
  const handleDateRangeChange = (value: DatesRangeValue) => {
    if (value[0] && value[1]) {
      setDateRange([value[0], value[1]]);
    } else {
      setDateRange(null);
    }
  };

  return (
    <Stack gap="md">
      <SegmentedControl
        value={preset}
        onChange={(value) => setPreset(value as typeof preset)}
        data={segmentedControlData}
        radius="xl"
        aria-label="Seleccionar período de fechas"
      />

      {preset === "custom" && (
        <DatePickerInput
          type="range"
          label="Rango personalizado"
          placeholder="Selecciona un rango"
          value={mantineDateRange}
          onChange={handleDateRangeChange}
          clearable
          style={{ minWidth: 300 }}
          aria-label="Rango de fechas personalizado"
        />
      )}
    </Stack>
  );
}
