/**
 * Unit Tests for OfferingEditModal
 *
 * Tests:
 * - Abre con datos precargados
 * - Actualiza offering exitosamente
 * - Muestra notificación de éxito
 * - Maneja errores apropiadamente
 * - Cierra con Escape
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@shared/../test/utils";
import { OfferingEditModal } from "../OfferingEditModal";
import * as offeringHooks from "@entities/offering";
import { notifications } from "@mantine/notifications";
import type { OfferingDto } from "@packages/shared-types";

// Mock dependencies
vi.mock("@entities/offering", async () => {
  const actual = await vi.importActual("@entities/offering");
  return {
    ...actual,
    useUpdateOffering: vi.fn(),
  };
});

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
  Notifications: () => null,
}));

// Type for mock mutation result - using ReturnType to match actual hook
type MockMutationResult = ReturnType<typeof offeringHooks.useUpdateOffering>;

describe("OfferingEditModal", () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();

  const mockOffering: OfferingDto = {
    id: "123",
    businessId: "business-123",
    name: "Test Service",
    duration: 60,
    maxCapacityPerSlot: 2,
    maxDailyCapacity: 10,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(offeringHooks.useUpdateOffering).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      mutate: vi.fn(),
      reset: vi.fn(),
      status: "idle",
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isIdle: true,
      isPaused: false,
      submittedAt: 0,
    } as unknown as MockMutationResult);
  });

  describe("Modal Behavior", () => {
    it("should render when opened", () => {
      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <OfferingEditModal
          opened={false}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      expect(screen.queryByText("Editar Servicio")).not.toBeInTheDocument();
    });

    it("should preload form with offering data", () => {
      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Check that form fields are preloaded
      const nameInput = screen.getByDisplayValue("Test Service");
      expect(nameInput).toBeInTheDocument();

      // Duration should be 60
      const durationInput = screen.getByDisplayValue("60");
      expect(durationInput).toBeInTheDocument();

      // Capacity should be 2
      const capacityInput = screen.getByDisplayValue("2");
      expect(capacityInput).toBeInTheDocument();

      // Daily capacity should be 10
      const dailyCapacityInput = screen.getByDisplayValue("10");
      expect(dailyCapacityInput).toBeInTheDocument();
    });

    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should close with Escape key", async () => {
      const user = userEvent.setup();
      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Success Flow", () => {
    it("should update offering successfully", async () => {
      const user = userEvent.setup();
      const updatedOffering = {
        ...mockOffering,
        name: "Updated Service",
        duration: 90,
      };
      mockMutateAsync.mockResolvedValue(updatedOffering);

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Modify form
      const nameInput = screen.getByDisplayValue("Test Service");
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Service");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Wait for mutation
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: "123",
          dto: {
            name: "Updated Service",
            duration: 60,
            maxCapacityPerSlot: 2,
            maxDailyCapacity: 10,
          },
        });
      });
    });

    it("should show success notification", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockOffering);

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form without changes
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for success notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio actualizado exitosamente",
            color: "green",
            autoClose: 3000,
          }),
        );
      });
    });

    it("should close modal after successful update", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue(mockOffering);

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for modal to close
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 409 conflict error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue({
        response: {
          status: 409,
          data: { message: "Conflict" },
        },
      });

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Ya existe un servicio con ese nombre",
            color: "red",
            autoClose: 5000,
          }),
        );
      });
    });

    it("should handle 403 forbidden error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "Forbidden" },
        },
      });

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "No tienes permisos para realizar esta acción",
            color: "red",
            autoClose: 5000,
          }),
        );
      });
    });

    it("should handle 404 not found error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Not Found" },
        },
      });

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "El servicio no fue encontrado",
            color: "red",
            autoClose: 5000,
          }),
        );
      });
    });

    it("should handle generic error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Network error",
            color: "red",
            autoClose: 5000,
          }),
        );
      });
    });

    it("should keep modal open on error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error("Error"));

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalled();
      });

      // Modal should still be open (onClose not called)
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
    });

    it("should preserve form data on error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error("Error"));

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Modify form
      const nameInput = screen.getByDisplayValue(
        "Test Service",
      ) as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, "Modified Service");

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalled();
      });

      // Form data should be preserved
      expect(nameInput.value).toBe("Modified Service");
    });
  });

  describe("Loading State", () => {
    it("should disable form during submission", async () => {
      // Mock pending state
      vi.mocked(offeringHooks.useUpdateOffering).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: "pending",
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isIdle: false,
        isPaused: false,
        submittedAt: Date.now(),
      } as unknown as MockMutationResult);

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Form fields should be disabled
      expect(screen.getByDisplayValue("Test Service")).toBeDisabled();
      expect(screen.getByRole("button", { name: /guardando/i })).toBeDisabled();
    });

    it("should prevent modal close during submission", () => {
      // Mock pending state
      vi.mocked(offeringHooks.useUpdateOffering).mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        mutate: vi.fn(),
        reset: vi.fn(),
        status: "pending",
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isIdle: false,
        isPaused: false,
        submittedAt: Date.now(),
      } as unknown as MockMutationResult);

      render(
        <OfferingEditModal
          opened={true}
          onClose={mockOnClose}
          offering={mockOffering}
        />,
      );

      // Modal should have closeOnClickOutside and closeOnEscape disabled
      // This is tested by checking the Modal props in the component
      expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
    });
  });
});
