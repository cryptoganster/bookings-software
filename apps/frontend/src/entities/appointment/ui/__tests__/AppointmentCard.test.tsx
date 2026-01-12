/**
 * Tests for AppointmentCard Component
 */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppointmentCard } from "../AppointmentCard";
import type { AppointmentReadModel } from "../../model/types";
import { renderWithProviders } from "@/test/utils";

describe("AppointmentCard", () => {
  const mockAppointment: AppointmentReadModel = {
    id: "apt-1",
    businessId: "biz-1",
    customerId: "cust-1",
    customerName: "John Doe",
    customerPhone: "+18095551234",
    offeringId: "off-1",
    offeringName: "Haircut",
    dateTime: "2024-01-15T14:30:00Z",
    status: "CONFIRMED",
    createdAt: "2024-01-01T00:00:00Z",
    cancelledAt: null,
  };

  it("should render appointment information", () => {
    renderWithProviders(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Haircut")).toBeInTheDocument();
  });

  it("should render customer phone", () => {
    renderWithProviders(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText(/809-555-1234/)).toBeInTheDocument();
  });

  it("should render appointment status badge", () => {
    renderWithProviders(<AppointmentCard appointment={mockAppointment} />);

    expect(screen.getByText("Confirmada")).toBeInTheDocument();
  });

  it("should call onClick when card is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithProviders(
      <AppointmentCard appointment={mockAppointment} onClick={handleClick} />,
    );

    const card = screen.getByText("John Doe").closest("div")?.parentElement;
    if (card) {
      await user.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should not have pointer cursor when onClick is not provided", () => {
    const { container } = renderWithProviders(
      <AppointmentCard appointment={mockAppointment} />,
    );

    const card = container.querySelector('[style*="cursor"]');
    expect(card).toHaveStyle({ cursor: "default" });
  });

  it("should have pointer cursor when onClick is provided", () => {
    const { container } = renderWithProviders(
      <AppointmentCard appointment={mockAppointment} onClick={() => {}} />,
    );

    const card = container.querySelector('[style*="cursor"]');
    expect(card).toHaveStyle({ cursor: "pointer" });
  });

  it("should render custom actions", () => {
    renderWithProviders(
      <AppointmentCard
        appointment={mockAppointment}
        actions={<button>Custom Action</button>}
      />,
    );

    expect(screen.getByText("Custom Action")).toBeInTheDocument();
  });

  it("should not render actions section when actions not provided", () => {
    const { container } = renderWithProviders(
      <AppointmentCard appointment={mockAppointment} />,
    );

    const actionsGroup = container.querySelector('[justify="flex-end"]');
    expect(actionsGroup).not.toBeInTheDocument();
  });

  it("should render cancelled appointment", () => {
    const cancelledAppointment = {
      ...mockAppointment,
      status: "CANCELLED" as const,
    };

    renderWithProviders(<AppointmentCard appointment={cancelledAppointment} />);

    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });

  it("should render completed appointment", () => {
    const completedAppointment = {
      ...mockAppointment,
      status: "COMPLETED" as const,
    };

    renderWithProviders(<AppointmentCard appointment={completedAppointment} />);

    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("should render appointment without customer name", () => {
    const appointmentWithoutName = {
      ...mockAppointment,
      customerName: null,
    };

    renderWithProviders(
      <AppointmentCard appointment={appointmentWithoutName} />,
    );

    // When customer name is null, it shows the phone number instead
    expect(screen.getByText(/809-555-1234/)).toBeInTheDocument();
  });
});
