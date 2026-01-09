/**
 * Component Tests for AppointmentSlot
 *
 * Tests specific behaviors and edge cases for the AppointmentSlot component.
 * Validates: Requirements 2.5, 2.7, 4.1, 4.2, 4.3, 4.5, 4.6
 */

import { render, screen } from "@/test/test-utils";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AppointmentSlot } from "../AppointmentSlot";
import type { AppointmentReadModel } from "@entities/appointment";

describe("AppointmentSlot", () => {
  const baseAppointment: AppointmentReadModel = {
    id: "appt-1",
    businessId: "biz-1",
    customerId: "cust-1",
    customerName: "John Doe",
    customerPhone: "+18095551234",
    offeringId: "off-1",
    offeringName: "Haircut",
    dateTime: "2024-01-15T14:30:00Z",
    status: "CONFIRMED",
    createdAt: "2024-01-10T10:00:00Z",
    cancelledAt: null,
  };

  it("displays time in 12-hour format", () => {
    // Use a fixed date to avoid timezone issues
    const fixedAppointment: AppointmentReadModel = {
      ...baseAppointment,
      dateTime: "2024-01-15T14:30:00.000Z",
    };

    render(<AppointmentSlot appointment={fixedAppointment} />);

    // Calculate expected time based on local timezone
    const date = new Date(fixedAppointment.dateTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const expectedTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;

    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it("displays offering name with ellipsis for long text", () => {
    const longOfferingAppointment: AppointmentReadModel = {
      ...baseAppointment,
      offeringName:
        "Very Long Offering Name That Should Be Truncated With Ellipsis",
    };

    render(<AppointmentSlot appointment={longOfferingAppointment} />);

    const offeringText = screen.getByText(longOfferingAppointment.offeringName);
    expect(offeringText).toBeInTheDocument();
    // Mantine's lineClamp uses data attribute, not inline style
    expect(offeringText).toHaveAttribute("data-line-clamp", "true");
  });

  it("displays customer name with ellipsis for long text", () => {
    const longNameAppointment: AppointmentReadModel = {
      ...baseAppointment,
      customerName:
        "Very Long Customer Name That Should Be Truncated With Ellipsis",
    };

    render(<AppointmentSlot appointment={longNameAppointment} />);

    const customerText = screen.getByText(
      longNameAppointment.customerName || "Sin nombre",
    );
    expect(customerText).toBeInTheDocument();
    // Mantine's lineClamp uses data attribute, not inline style
    expect(customerText).toHaveAttribute("data-line-clamp", "true");
  });

  it("displays 'Sin nombre' when customer name is null", () => {
    const noNameAppointment: AppointmentReadModel = {
      ...baseAppointment,
      customerName: null,
    };

    render(<AppointmentSlot appointment={noNameAppointment} />);

    expect(screen.getByText("Sin nombre")).toBeInTheDocument();
  });

  it("has blue styling for CONFIRMED status", () => {
    const { container } = render(
      <AppointmentSlot
        appointment={{ ...baseAppointment, status: "CONFIRMED" }}
      />,
    );

    const paperElement = container.querySelector('[style*="background"]');
    const style = paperElement?.getAttribute("style") || "";

    expect(style).toContain("--mantine-color-green-1");
    expect(style).toContain("--mantine-color-green-6");
  });

  it("has red styling for CANCELLED status", () => {
    const { container } = render(
      <AppointmentSlot
        appointment={{ ...baseAppointment, status: "CANCELLED" }}
      />,
    );

    const paperElement = container.querySelector('[style*="background"]');
    const style = paperElement?.getAttribute("style") || "";

    expect(style).toContain("--mantine-color-red-1");
    expect(style).toContain("--mantine-color-red-6");
  });

  it("has green styling for COMPLETED status", () => {
    const { container } = render(
      <AppointmentSlot
        appointment={{ ...baseAppointment, status: "COMPLETED" }}
      />,
    );

    const paperElement = container.querySelector('[style*="background"]');
    const style = paperElement?.getAttribute("style") || "";

    expect(style).toContain("--mantine-color-blue-1");
    expect(style).toContain("--mantine-color-blue-6");
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <AppointmentSlot appointment={baseAppointment} onClick={handleClick} />,
    );

    const slot = screen.getByText("Haircut").closest("div");
    expect(slot).toBeTruthy();

    await user.click(slot!);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(baseAppointment);
  });

  it("has pointer cursor", () => {
    const { container } = render(
      <AppointmentSlot appointment={baseAppointment} />,
    );

    const paperElement = container.querySelector('[style*="cursor"]');
    const style = paperElement?.getAttribute("style") || "";

    expect(style).toContain("cursor: pointer");
  });
});
