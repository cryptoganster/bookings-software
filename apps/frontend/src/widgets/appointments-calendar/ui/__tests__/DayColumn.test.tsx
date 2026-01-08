/**
 * Component Tests for DayColumn
 *
 * Tests the DayColumn component behavior and rendering
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DayColumn } from "../DayColumn";
import type { AppointmentReadModel } from "@entities/appointment";

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
}

// Helper to create mock appointments
const createMockAppointment = (
  overrides?: Partial<AppointmentReadModel>,
): AppointmentReadModel => ({
  id: crypto.randomUUID(),
  businessId: crypto.randomUUID(),
  customerId: crypto.randomUUID(),
  customerName: "Juan Pérez",
  customerPhone: "+18095551234",
  offeringId: crypto.randomUUID(),
  offeringName: "Corte de Pelo",
  dateTime: new Date("2024-01-15T10:00:00Z").toISOString(),
  status: "CONFIRMED",
  createdAt: new Date("2024-01-01T00:00:00Z").toISOString(),
  cancelledAt: null,
  ...overrides,
});

describe("DayColumn", () => {
  describe("Day header", () => {
    it("should display day name in uppercase Spanish", () => {
      const date = new Date("2024-01-15"); // Monday
      const appointments: AppointmentReadModel[] = [];

      render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      const dayName = format(date, "EEEE", { locale: es }).toUpperCase();
      expect(screen.getByText(dayName)).toBeInTheDocument();
    });

    it("should display date in Spanish format", () => {
      const date = new Date("2024-01-15");
      const appointments: AppointmentReadModel[] = [];

      render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      const dateFormatted = format(date, "d 'de' MMMM", { locale: es });
      expect(screen.getByText(dateFormatted)).toBeInTheDocument();
    });
  });

  describe("Current day highlighting", () => {
    it("should have blue border and background for current day", () => {
      const today = new Date();
      const appointments: AppointmentReadModel[] = [];

      const { container } = render(
        <TestWrapper>
          <DayColumn date={today} appointments={appointments} />
        </TestWrapper>,
      );

      const paper = container.querySelector('[class*="Paper"]');
      expect(paper).toBeTruthy();

      const style = paper?.getAttribute("style") || "";

      // Should have blue border
      expect(style).toContain("border-color");
      expect(style).toContain("blue");

      // Should have thicker border (2px)
      expect(style).toContain("border-width");
      expect(style).toContain("2");

      // Should have blue background
      expect(style).toContain("background-color");
      expect(style).toContain("blue");
    });

    it("should not have blue styling for non-current days", () => {
      const pastDate = new Date("2020-01-15");
      const appointments: AppointmentReadModel[] = [];

      const { container } = render(
        <TestWrapper>
          <DayColumn date={pastDate} appointments={appointments} />
        </TestWrapper>,
      );

      const paper = container.querySelector('[class*="Paper"]');
      expect(paper).toBeTruthy();

      const style = paper?.getAttribute("style") || "";

      // Should not have blue border or background
      if (style.includes("border-color")) {
        expect(style).not.toContain("blue");
      }
      if (style.includes("background-color")) {
        expect(style).not.toContain("blue");
      }
    });
  });

  describe("Appointments display", () => {
    it("should sort appointments by time (chronological order)", () => {
      const date = new Date("2024-01-15");
      const appointments: AppointmentReadModel[] = [
        createMockAppointment({
          dateTime: new Date("2024-01-15T14:00:00Z").toISOString(),
          offeringName: "Servicio 2",
        }),
        createMockAppointment({
          dateTime: new Date("2024-01-15T10:00:00Z").toISOString(),
          offeringName: "Servicio 1",
        }),
        createMockAppointment({
          dateTime: new Date("2024-01-15T16:00:00Z").toISOString(),
          offeringName: "Servicio 3",
        }),
      ];

      const { container } = render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      const content = container.textContent || "";

      // Verify order: Servicio 1 should appear before Servicio 2, which should appear before Servicio 3
      const index1 = content.indexOf("Servicio 1");
      const index2 = content.indexOf("Servicio 2");
      const index3 = content.indexOf("Servicio 3");

      expect(index1).toBeLessThan(index2);
      expect(index2).toBeLessThan(index3);
    });

    it("should display all appointments for the day", () => {
      const date = new Date("2024-01-15");
      const appointments: AppointmentReadModel[] = [
        createMockAppointment({ offeringName: "Corte de Pelo" }),
        createMockAppointment({ offeringName: "Tinte" }),
        createMockAppointment({ offeringName: "Lavado" }),
      ];

      render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      expect(screen.getByText("Corte de Pelo")).toBeInTheDocument();
      expect(screen.getByText("Tinte")).toBeInTheDocument();
      expect(screen.getByText("Lavado")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("should display empty state when no appointments", () => {
      const date = new Date("2024-01-15");
      const appointments: AppointmentReadModel[] = [];

      render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      expect(screen.getByText("Sin citas")).toBeInTheDocument();
      expect(
        screen.getByText("No hay citas programadas para este día"),
      ).toBeInTheDocument();
    });

    it("should not display empty state when appointments exist", () => {
      const date = new Date("2024-01-15");
      const appointments: AppointmentReadModel[] = [
        createMockAppointment({ offeringName: "Corte de Pelo" }),
      ];

      render(
        <TestWrapper>
          <DayColumn date={date} appointments={appointments} />
        </TestWrapper>,
      );

      expect(screen.queryByText("Sin citas")).not.toBeInTheDocument();
      expect(screen.getByText("Corte de Pelo")).toBeInTheDocument();
    });
  });
});
