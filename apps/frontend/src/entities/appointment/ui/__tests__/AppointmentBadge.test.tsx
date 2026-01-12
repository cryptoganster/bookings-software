/**
 * Test: AppointmentBadge Component
 * Verifica el renderizado del badge de estado de cita
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { AppointmentBadge } from "../AppointmentBadge";

const renderWithMantine = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("AppointmentBadge", () => {
  it("should render CONFIRMED status", () => {
    renderWithMantine(<AppointmentBadge status="CONFIRMED" />);
    expect(screen.getByText("Confirmada")).toBeInTheDocument();
  });

  it("should render CANCELLED status", () => {
    renderWithMantine(<AppointmentBadge status="CANCELLED" />);
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("should render COMPLETED status", () => {
    renderWithMantine(<AppointmentBadge status="COMPLETED" />);
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("should accept custom size prop", () => {
    const { container } = renderWithMantine(
      <AppointmentBadge status="CONFIRMED" size="lg" />,
    );
    const badge = container.querySelector(".mantine-Badge-root");
    expect(badge).toBeInTheDocument();
  });

  it("should accept custom variant prop", () => {
    const { container } = renderWithMantine(
      <AppointmentBadge status="CONFIRMED" variant="filled" />,
    );
    const badge = container.querySelector(".mantine-Badge-root");
    expect(badge).toBeInTheDocument();
  });

  it("should use default size and variant when not provided", () => {
    const { container } = renderWithMantine(
      <AppointmentBadge status="CONFIRMED" />,
    );
    const badge = container.querySelector(".mantine-Badge-root");
    expect(badge).toBeInTheDocument();
  });
});
