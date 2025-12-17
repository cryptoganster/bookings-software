import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { DateRangeFilter } from "../DateRangeFilter";
import { useAppointmentFilters } from "../../model/useAppointmentFilters";

// Wrapper para Mantine
function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("DateRangeFilter", () => {
  beforeEach(() => {
    // Reset store antes de cada test
    useAppointmentFilters.getState().reset();
  });

  afterEach(() => {
    // Limpiar después de cada test
    useAppointmentFilters.getState().reset();
  });

  it("renderiza SegmentedControl con 4 opciones", () => {
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Verificar que las 4 opciones están presentes
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByText("Semana")).toBeInTheDocument();
    expect(screen.getByText("Mes")).toBeInTheDocument();
    expect(screen.getByText("Personalizado")).toBeInTheDocument();
  });

  it('click en "Hoy" actualiza preset y oculta DatePickerInput', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Inicialmente preset es 'custom', así que DatePickerInput debería estar visible
    expect(screen.getByLabelText("Rango personalizado")).toBeInTheDocument();

    // Click en "Hoy"
    await user.click(screen.getByText("Hoy"));

    // Verificar que preset cambió
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("today");

    // Verificar que DatePickerInput ya no está visible
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();
  });

  it('click en "Esta Semana" actualiza preset y oculta DatePickerInput', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Click en "Esta Semana"
    await user.click(screen.getByText("Semana"));

    // Verificar que preset cambió
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("week");

    // Verificar que DatePickerInput ya no está visible
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();
  });

  it('click en "Este Mes" actualiza preset y oculta DatePickerInput', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Click en "Este Mes"
    await user.click(screen.getByText("Mes"));

    // Verificar que preset cambió
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("month");

    // Verificar que DatePickerInput ya no está visible
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();
  });

  it('click en "Personalizado" muestra DatePickerInput', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Primero cambiar a otro preset
    await user.click(screen.getByText("Hoy"));
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();

    // Luego click en "Personalizado"
    await user.click(screen.getByText("Personalizado"));

    // Verificar que preset cambió
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("custom");

    // Verificar que DatePickerInput ahora está visible
    expect(screen.getByLabelText("Rango personalizado")).toBeInTheDocument();
  });

  it("DatePickerInput solo visible cuando preset es 'custom'", () => {
    const { rerender } = render(<DateRangeFilter />, { wrapper: Wrapper });

    // Inicialmente preset es 'custom'
    expect(screen.getByLabelText("Rango personalizado")).toBeInTheDocument();

    // Cambiar preset a 'today'
    useAppointmentFilters.getState().setDateRangePreset("today");
    rerender(<DateRangeFilter />);
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();

    // Cambiar preset a 'week'
    useAppointmentFilters.getState().setDateRangePreset("week");
    rerender(<DateRangeFilter />);
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();

    // Cambiar preset a 'month'
    useAppointmentFilters.getState().setDateRangePreset("month");
    rerender(<DateRangeFilter />);
    expect(
      screen.queryByLabelText("Rango personalizado"),
    ).not.toBeInTheDocument();

    // Cambiar preset de vuelta a 'custom'
    useAppointmentFilters.getState().setDateRangePreset("custom");
    rerender(<DateRangeFilter />);
    expect(screen.getByLabelText("Rango personalizado")).toBeInTheDocument();
  });

  it("cambiar fecha personalizada mantiene preset en 'custom'", () => {
    render(<DateRangeFilter />, { wrapper: Wrapper });

    // Verificar que preset inicial es 'custom'
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("custom");

    // Simular cambio de fecha (esto es complejo con DatePickerInput de Mantine)
    // Por ahora verificamos que el preset se mantiene en 'custom'
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Actualizar dateRange directamente en el store
    useAppointmentFilters.getState().setDateRange([today, tomorrow]);

    // Verificar que preset sigue siendo 'custom'
    expect(useAppointmentFilters.getState().dateRangePreset).toBe("custom");
  });
});
