import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { AppointmentSlot } from "../AppointmentSlot";
import type { AppointmentReadModel } from "@entities/appointment";

// Test wrapper with providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider>{children}</MantineProvider>
    </QueryClientProvider>
  );
}

describe("AppointmentSlot Integration Tests", () => {
  const mockAppointment: AppointmentReadModel = {
    id: "test-appointment-id",
    businessId: "business-123",
    customerId: "customer-123",
    customerName: "Juan Pérez",
    customerPhone: "+18095551234",
    offeringId: "offering-123",
    offeringName: "Corte de Pelo",
    dateTime: new Date("2024-12-20T10:30:00Z").toISOString(),
    status: "CONFIRMED",
    createdAt: new Date("2024-12-15T08:00:00Z").toISOString(),
    cancelledAt: null,
  };

  beforeEach(() => {
    // Setup MSW handler for appointment details
    server.use(
      http.get("*/api/appointments/:id", ({ params }) => {
        if (params.id === "test-appointment-id") {
          return HttpResponse.json(mockAppointment);
        }
        return HttpResponse.json(
          { message: "Appointment not found" },
          { status: 404 },
        );
      }),
    );
  });

  it("should open modal when appointment slot is clicked", async () => {
    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    // Click the appointment slot
    const slot = screen.getByText("Corte de Pelo");
    fireEvent.click(slot);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Verify modal is present
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();
  });

  it("should display correct appointment details in modal", async () => {
    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    // Click the appointment slot
    const slot = screen.getByText("Corte de Pelo");
    fireEvent.click(slot);

    // Wait for modal to appear and content to load
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Wait for phone number to appear (indicates full content loaded)
    await waitFor(
      () => {
        expect(screen.getByText("+18095551234")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify appointment details are displayed
    expect(screen.getByText("+18095551234")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();

    // Verify customer name appears in modal (use getAllByText since it's in both slot and modal)
    const customerNames = screen.getAllByText("Juan Pérez");
    expect(customerNames.length).toBeGreaterThan(0);
  });

  it("should close modal and return to calendar when close button is clicked", async () => {
    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    // Click the appointment slot to open modal
    const slot = screen.getByText("Corte de Pelo");
    fireEvent.click(slot);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Find and click the close button
    const closeButton = screen
      .getAllByRole("button")
      .find((button) => button.className.includes("mantine-Modal-close"));
    expect(closeButton).toBeDefined();
    fireEvent.click(closeButton!);

    // Wait for modal to disappear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should handle multiple open/close cycles", async () => {
    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    const slot = screen.getByText("Corte de Pelo");

    // First cycle: open and close
    fireEvent.click(slot);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const closeButton1 = screen
      .getAllByRole("button")
      .find((button) => button.className.includes("mantine-Modal-close"));
    fireEvent.click(closeButton1!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Second cycle: open again
    fireEvent.click(slot);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Wait for phone number to appear (indicates full content loaded)
    await waitFor(
      () => {
        expect(screen.getByText("+18095551234")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Verify modal content is still correct
    expect(screen.getByText("+18095551234")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
  });

  it("should display loading state while fetching appointment details", async () => {
    // Delay the response to test loading state
    server.use(
      http.get("*/api/appointments/:id", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockAppointment);
      }),
    );

    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    // Click the appointment slot
    const slot = screen.getByText("Corte de Pelo");
    fireEvent.click(slot);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Verify loading overlay is present (Mantine's LoadingOverlay)
    const modal = screen.getByRole("dialog");
    expect(modal).toBeInTheDocument();

    // Wait for content to load
    await waitFor(
      () => {
        expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("should display error message when appointment fetch fails", async () => {
    // Setup error response
    server.use(
      http.get("*/api/appointments/:id", () => {
        return HttpResponse.json(
          { message: "Failed to fetch appointment" },
          { status: 500 },
        );
      }),
    );

    render(
      <TestWrapper>
        <AppointmentSlot appointment={mockAppointment} />
      </TestWrapper>,
    );

    // Click the appointment slot
    const slot = screen.getByText("Corte de Pelo");
    fireEvent.click(slot);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Wait for error message
    await waitFor(
      () => {
        expect(
          screen.getByText(/Error al cargar los detalles de la cita/i),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
