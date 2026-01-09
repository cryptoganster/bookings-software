/**
 * Component Tests for AppointmentDetailsModal
 *
 * Tests the modal's behavior with different states and user interactions.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/mocks/server";
import { AppointmentDetailsModal } from "../ui/AppointmentDetailsModal";
import type { AppointmentReadModel } from "@entities/appointment";

// Setup MSW server lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Helper to create a wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MantineProvider>{children}</MantineProvider>
      </QueryClientProvider>
    );
  };
}

// Mock appointment data
const mockAppointment: AppointmentReadModel = {
  id: "appointment-123",
  businessId: "business-123",
  customerId: "customer-123",
  customerName: "Juan Pérez",
  customerPhone: "+18095551234",
  offeringId: "offering-123",
  offeringName: "Corte de Pelo",
  dateTime: "2024-12-20T10:00:00.000Z",
  status: "CONFIRMED",
  createdAt: "2024-12-15T08:00:00.000Z",
  cancelledAt: null,
};

describe("AppointmentDetailsModal", () => {
  describe("Modal Opening and Closing", () => {
    it("should render modal when opened=true", () => {
      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(mockAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Modal title should be visible
      expect(screen.getByText("Detalles de la Cita")).toBeInTheDocument();
    });

    it("should not render modal when opened=false", () => {
      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={false}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Modal title should not be visible
      expect(screen.queryByText("Detalles de la Cita")).not.toBeInTheDocument();
    });

    it("should call onClose when modal is closed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(mockAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={onClose}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByText(mockAppointment.offeringName),
        ).toBeInTheDocument();
      });

      // Find and click the close button (X button in modal header)
      // The close button is a button with an SVG icon, we can find it by role and position
      const closeButtons = screen.getAllByRole("button");
      const closeButton = closeButtons.find((button) =>
        button.className.includes("mantine-Modal-close"),
      );

      expect(closeButton).toBeDefined();
      await user.click(closeButton!);

      // onClose should have been called
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading State", () => {
    it("should display LoadingOverlay while loading", async () => {
      // Delay the response to keep loading state visible
      server.use(
        http.get("*/api/appointments/:id", async () => {
          await delay(100);
          return HttpResponse.json(mockAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // LoadingOverlay should be visible (it has a specific class)
      const loadingOverlay = document.querySelector(
        ".mantine-LoadingOverlay-root",
      );
      expect(loadingOverlay).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error message when fetch fails", async () => {
      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
          );
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Wait for error message to appear
      await waitFor(() => {
        expect(
          screen.getByText(/error al cargar los detalles/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Appointment Details Display", () => {
    it("should display all appointment details correctly", async () => {
      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(mockAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load (check that error message is NOT present and loading is done)
      await waitFor(
        () => {
          expect(
            screen.queryByText(/error al cargar/i),
          ).not.toBeInTheDocument();
          // Also check that loading overlay is not visible
          const loadingOverlay = document.querySelector(
            ".mantine-LoadingOverlay-root",
          );
          expect(loadingOverlay).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Now check that the data is displayed
      expect(
        screen.getByText(mockAppointment.offeringName),
      ).toBeInTheDocument();

      // Status badge
      expect(screen.getByText(mockAppointment.status)).toBeInTheDocument();

      // Customer name
      expect(
        screen.getByText(mockAppointment.customerName || "Sin nombre"),
      ).toBeInTheDocument();

      // Customer phone
      expect(
        screen.getByText(mockAppointment.customerPhone),
      ).toBeInTheDocument();

      // Labels
      expect(screen.getByText("Cliente:")).toBeInTheDocument();
      expect(screen.getByText("Teléfono:")).toBeInTheDocument();
      expect(screen.getByText("Fecha y Hora:")).toBeInTheDocument();
      expect(screen.getByText("Creada:")).toBeInTheDocument();
    });
  });

  describe("Cancel Button Visibility", () => {
    it("should show cancel button for CONFIRMED appointments", async () => {
      const confirmedAppointment = {
        ...mockAppointment,
        status: "CONFIRMED" as const,
      };

      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(confirmedAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={confirmedAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByText(confirmedAppointment.offeringName),
        ).toBeInTheDocument();
      });

      // Cancel button should be visible
      const cancelButton = screen.getByRole("button", {
        name: /cancelar cita/i,
      });
      expect(cancelButton).toBeInTheDocument();
    });

    it("should NOT show cancel button for CANCELLED appointments", async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: "CANCELLED" as const,
      };

      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(cancelledAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={cancelledAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByText(cancelledAppointment.offeringName),
        ).toBeInTheDocument();
      });

      // Cancel button should NOT be visible
      const cancelButton = screen.queryByRole("button", {
        name: /cancelar cita/i,
      });
      expect(cancelButton).not.toBeInTheDocument();
    });

    it("should NOT show cancel button for COMPLETED appointments", async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: "COMPLETED" as const,
      };

      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(completedAppointment);
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={completedAppointment.id}
          opened={true}
          onClose={() => {}}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByText(completedAppointment.offeringName),
        ).toBeInTheDocument();
      });

      // Cancel button should NOT be visible
      const cancelButton = screen.queryByRole("button", {
        name: /cancelar cita/i,
      });
      expect(cancelButton).not.toBeInTheDocument();
    });
  });

  describe("Cancel Appointment Flow", () => {
    it("should trigger cancellation and close modal on success", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      server.use(
        http.get("*/api/appointments/:id", () => {
          return HttpResponse.json(mockAppointment);
        }),
        http.put("*/api/appointments/:id/cancel", () => {
          return new HttpResponse(null, { status: 200 });
        }),
      );

      const Wrapper = createWrapper();

      render(
        <AppointmentDetailsModal
          appointmentId={mockAppointment.id}
          opened={true}
          onClose={onClose}
        />,
        { wrapper: Wrapper },
      );

      // Wait for data to load
      await waitFor(() => {
        expect(
          screen.getByText(mockAppointment.offeringName),
        ).toBeInTheDocument();
      });

      // Click cancel button
      const cancelButton = screen.getByRole("button", {
        name: /cancelar cita/i,
      });
      await user.click(cancelButton);

      // Confirmation modal should appear
      await waitFor(() => {
        expect(screen.getByText(/confirmar cancelación/i)).toBeInTheDocument();
      });

      // Click confirm button in confirmation modal
      const confirmButton = screen.getByRole("button", {
        name: /sí, cancelar cita/i,
      });
      await user.click(confirmButton);

      // Wait for cancellation to complete and modal to close
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
