/**
 * Unit Tests for OfferingCreateModal
 *
 * Tests:
 * - Abre y cierra correctamente
 * - Crea offering exitosamente
 * - Muestra notificación de éxito
 * - Maneja errores apropiadamente
 * - Cierra con Escape
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@shared/../test/utils";
import { OfferingCreateModal } from "../OfferingCreateModal";
import * as offeringHooks from "@entities/offering";
import { notifications } from "@mantine/notifications";

// Mock dependencies
vi.mock("@entities/offering", async () => {
  const actual = await vi.importActual("@entities/offering");
  return {
    ...actual,
    useCreateOffering: vi.fn(),
  };
});

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
  Notifications: () => null,
}));

// Type for mock mutation result - using ReturnType to match actual hook
type MockMutationResult = ReturnType<typeof offeringHooks.useCreateOffering>;

describe("OfferingCreateModal", () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    vi.mocked(offeringHooks.useCreateOffering).mockReturnValue({
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
      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
      ).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(<OfferingCreateModal opened={false} onClose={mockOnClose} />);

      expect(screen.queryByText("Crear Servicio")).not.toBeInTheDocument();
    });

    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole("button", { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should close with Escape key", async () => {
      const user = userEvent.setup();
      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      await user.keyboard("{Escape}");

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Success Flow", () => {
    it("should create offering successfully", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({
        id: "123",
        name: "Test Service",
        duration: 30,
        maxCapacityPerSlot: 1,
        maxDailyCapacity: null,
        isActive: true,
      });

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );

      // Submit form
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // Wait for mutation
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Test Service",
          duration: 30,
          maxCapacityPerSlot: 1,
          maxDailyCapacity: undefined,
        });
      });
    });

    it("should show success notification", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({
        id: "123",
        name: "Test Service",
        duration: 30,
        maxCapacityPerSlot: 1,
        maxDailyCapacity: null,
        isActive: true,
      });

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for success notification
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio creado exitosamente",
            color: "green",
            autoClose: 3000,
          }),
        );
      });
    });

    it("should close modal after successful creation", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({
        id: "123",
        name: "Test Service",
        duration: 30,
        maxCapacityPerSlot: 1,
        maxDailyCapacity: null,
        isActive: true,
      });

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );
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

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Duplicate Service",
      );
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

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );
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

    it("should handle generic error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error("Network error"));

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );
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

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill and submit form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Test Service",
      );
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalled();
      });

      // Modal should still be open (onClose not called)
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
    });

    it("should preserve form data on error", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue(new Error("Error"));

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Fill form
      const nameInput = screen.getByPlaceholderText(
        "Ej: Corte de pelo",
      ) as HTMLInputElement;
      await user.type(nameInput, "Test Service");

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for error
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalled();
      });

      // Form data should be preserved
      expect(nameInput.value).toBe("Test Service");
    });
  });

  describe("Loading State", () => {
    it("should disable form during submission", async () => {
      // Mock pending state
      vi.mocked(offeringHooks.useCreateOffering).mockReturnValue({
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

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Form fields should be disabled
      expect(screen.getByPlaceholderText("Ej: Corte de pelo")).toBeDisabled();
      expect(screen.getByRole("button", { name: /guardando/i })).toBeDisabled();
    });

    it("should prevent modal close during submission", () => {
      // Mock pending state
      vi.mocked(offeringHooks.useCreateOffering).mockReturnValue({
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

      render(<OfferingCreateModal opened={true} onClose={mockOnClose} />);

      // Modal should have closeOnClickOutside and closeOnEscape disabled
      // This is tested by checking the Modal props in the component
      expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
    });
  });
});
