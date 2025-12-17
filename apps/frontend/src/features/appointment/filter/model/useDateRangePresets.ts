import { useCallback } from "react";
import { useAppointmentFilters } from "./useAppointmentFilters";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
  type DateRangePreset,
} from "../lib/dateRangeCalculations";

export interface UseDateRangePresetsReturn {
  preset: DateRangePreset;
  setPreset: (preset: DateRangePreset) => void;
  getPresetRange: (preset: DateRangePreset) => [Date, Date] | null;
  getPresetLabel: (preset: DateRangePreset) => string;
}

/**
 * Hook para gestionar presets de rangos de fechas
 * Integra con useAppointmentFilters store y proporciona utilidades para UI
 */
export function useDateRangePresets(): UseDateRangePresetsReturn {
  const { dateRangePreset, setDateRangePreset, setDateRange } =
    useAppointmentFilters();

  /**
   * Calcula el rango de fechas para un preset dado
   */
  const getPresetRange = useCallback(
    (preset: DateRangePreset): [Date, Date] | null => {
      switch (preset) {
        case "today":
          return getTodayRange();
        case "week":
          return getWeekRange();
        case "month":
          return getMonthRange();
        case "custom":
          return null;
        default:
          return null;
      }
    },
    [],
  );

  /**
   * Retorna el label en español para un preset
   */
  const getPresetLabel = useCallback((preset: DateRangePreset): string => {
    switch (preset) {
      case "today":
        return "Hoy";
      case "week":
        return "Semana";
      case "month":
        return "Mes";
      case "custom":
        return "Personalizado";
      default:
        return "Personalizado";
    }
  }, []);

  /**
   * Actualiza el preset y el rango de fechas en el store
   * Si preset !== 'custom', calcula y actualiza el rango automáticamente
   * Si preset === 'custom', no modifica el rango (usuario lo seleccionará manualmente)
   */
  const setPreset = useCallback(
    (preset: DateRangePreset) => {
      // Actualizar preset en store
      setDateRangePreset(preset);

      // Si no es custom, calcular y actualizar rango automáticamente
      if (preset !== "custom") {
        const range = getPresetRange(preset);
        setDateRange(range);
      }
      // Si es custom, no modificar dateRange (usuario lo seleccionará con DatePicker)
    },
    [setDateRangePreset, setDateRange, getPresetRange],
  );

  return {
    preset: dateRangePreset,
    setPreset,
    getPresetRange,
    getPresetLabel,
  };
}
