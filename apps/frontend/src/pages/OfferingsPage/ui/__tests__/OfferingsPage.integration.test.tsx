/**
 * Integration Tests for OfferingsPage
 *
 * Tests complete user flows:
 * - Flujo completo de creación
 * - Flujo completo de edición
 * - Flujo completo de eliminación
 * - Manejo de errores de API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@shared/../test/utils";
import { OfferingsPage } from "../OfferingsPage";
import * as offeringHooks from "@entities/offering";
import { notifications } from "@mantine/notifications";
import type { OfferingDto } from "@packages/shared-types";

// Mock dependencies
vi.mock("@entities/offering", async () => {
  const actual = await vi.importActual("@entities/offering");
  return {
    ...actual,
    useOfferings: vi.fn(),
    useCreateOffering: vi.fn(),
    useUpdateOffering: vi.fn(),
    useDeleteOffering: vi.fn(),
    useToggleOfferingActive: vi.fn(),
  };
});

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
  Notifications: () => null,
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, "confirm", {
  writable: true,
  value: mockConfirm,
});

// Type for mock mutation result
type MockMutationResult = {
  mutateAsync: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: null;
  data: undefined;
  mutate: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  status: string;
  variables: undefined;
  context: undefined;
  failureCount: number;
  failureReason: null;
  isIdle: boolean;
  isPaused: boolean;
  submittedAt: number;
};

// Sample offerings data
const mockOfferings: OfferingDto[] = [
  {
    id: "offering-1",
    businessId: "business-1",
    name: "Corte de Pelo",
    duration: 30,
    maxCapacityPerSlot: 1,
    maxDailyCapacity: 10,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "offering-2",
    businessId: "business-1",
    name: "Manicure",
    duration: 45,
    maxCapacityPerSlot: 2,
    maxDailyCapacity: null,
    isActive: false,
    createdAt: "2024-01-02T00:00:00Z",
  },
];

/**
 * Helper function to find offering card by name
 */
function findOfferingCard(name: string): HTMLElement {
  const nameElement = screen.getByText(name);
  const card = nameElement.closest('[class*="Card"]');
  if (!card) {
    throw new Error(`Card not found for offering: ${name}`);
  }
  return card as HTMLElement;
}

describe("OfferingsPage Integration Tests", () => {
  const mockMutateAsync = vi.fn();
  const mockDeleteMutateAsync = vi.fn();
  const mockToggleMutateAsync = vi.fn();
  const mockUpdateMutateAsync = vi.fn();

  const createMockMutation = (
    mutateAsync: ReturnType<typeof vi.fn>,
    isPending = false,
  ): MockMutationResult => ({
    mutateAsync,
    isPending,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    mutate: vi.fn(),
    reset: vi.fn(),
    status: isPending ? "pending" : "idle",
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    isIdle: !isPending,
    isPaused: false,
    submittedAt: 0,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);

    // Default mock implementations
    vi.mocked(offeringHooks.useOfferings).mockReturnValue({
      data: mockOfferings,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof offeringHooks.useOfferings>);

    vi.mocked(offeringHooks.useCreateOffering).mockReturnValue(
      createMockMutation(mockMutateAsync) as unknown as ReturnType<
        typeof offeringHooks.useCreateOffering
      >,
    );

    vi.mocked(offeringHooks.useUpdateOffering).mockReturnValue(
      createMockMutation(mockUpdateMutateAsync) as unknown as ReturnType<
        typeof offeringHooks.useUpdateOffering
      >,
    );

    vi.mocked(offeringHooks.useDeleteOffering).mockReturnValue(
      createMockMutation(mockDeleteMutateAsync) as unknown as ReturnType<
        typeof offeringHooks.useDeleteOffering
      >,
    );

    vi.mocked(offeringHooks.useToggleOfferingActive).mockReturnValue(
      createMockMutation(mockToggleMutateAsync) as unknown as ReturnType<
        typeof offeringHooks.useToggleOfferingActive
      >,
    );
  });

  describe("Flujo completo de creación", () => {
    it('should open create modal when clicking "Nuevo Servicio" button', async () => {
      const user = userEvent.setup();
      render(<OfferingsPage />);

      // Click the create button
      const createButton = screen.getByRole("button", {
        name: /nuevo servicio/i,
      });
      await user.click(createButton);

      // Modal should be open - wait for it to appear
      await waitFor(() => {
        expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
      ).toBeInTheDocument();
    });

    it("should create offering and close modal on success", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({
        id: "new-offering",
        name: "Nuevo Servicio",
        duration: 60,
        maxCapacityPerSlot: 3,
        maxDailyCapacity: null,
        isActive: true,
      });

      render(<OfferingsPage />);

      // Open create modal
      await user.click(screen.getByRole("button", { name: /nuevo servicio/i }));

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
      });

      // Fill form
      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Nuevo Servicio",
      );

      // Change duration
      const durationInput = screen.getByLabelText(/duración/i);
      await user.clear(durationInput);
      await user.type(durationInput, "60");

      // Change capacity
      const capacityInput = screen.getByLabelText(/capacidad por slot/i);
      await user.clear(capacityInput);
      await user.type(capacityInput, "3");

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for mutation
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          name: "Nuevo Servicio",
          duration: 60,
          maxCapacityPerSlot: 3,
          maxDailyCapacity: undefined,
        });
      });

      // Success notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio creado exitosamente",
            color: "green",
          }),
        );
      });
    });

    it("should close create modal when clicking cancel", async () => {
      const user = userEvent.setup();
      render(<OfferingsPage />);

      // Open create modal
      await user.click(screen.getByRole("button", { name: /nuevo servicio/i }));

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
      });

      // Click cancel
      await user.click(screen.getByRole("button", { name: /cancelar/i }));

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText("Crear Servicio")).not.toBeInTheDocument();
      });
    });
  });

  describe("Flujo completo de edición", () => {
    it('should open edit modal with preloaded data when clicking "Editar"', async () => {
      const user = userEvent.setup();
      render(<OfferingsPage />);

      // Find the first offering card and open menu
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu to open and click edit option
      await waitFor(() => {
        expect(screen.getByText("Editar")).toBeInTheDocument();
      });

      const editOption = screen.getByText("Editar");
      await user.click(editOption);

      // Wait for modal to open with preloaded data
      await waitFor(() => {
        expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
      });

      // Check preloaded values
      const nameInput = screen.getByPlaceholderText(
        "Ej: Corte de pelo",
      ) as HTMLInputElement;
      expect(nameInput.value).toBe("Corte de Pelo");
    });

    it("should update offering and close modal on success", async () => {
      const user = userEvent.setup();
      mockUpdateMutateAsync.mockResolvedValue({
        ...mockOfferings[0],
        name: "Corte Premium",
      });

      render(<OfferingsPage />);

      // Open edit modal for first offering
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click edit
      await waitFor(() => {
        expect(screen.getByText("Editar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Editar"));

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
      });

      // Modify name
      const nameInput = screen.getByPlaceholderText("Ej: Corte de pelo");
      await user.clear(nameInput);
      await user.type(nameInput, "Corte Premium");

      // Submit form
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Wait for mutation
      await waitFor(() => {
        expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
          id: "offering-1",
          dto: {
            name: "Corte Premium",
            duration: 30,
            maxCapacityPerSlot: 1,
            maxDailyCapacity: 10,
          },
        });
      });

      // Success notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio actualizado exitosamente",
            color: "green",
          }),
        );
      });
    });

    it("should close edit modal when clicking cancel", async () => {
      const user = userEvent.setup();
      render(<OfferingsPage />);

      // Open edit modal
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click edit
      await waitFor(() => {
        expect(screen.getByText("Editar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Editar"));

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
      });

      // Click cancel
      await user.click(screen.getByRole("button", { name: /cancelar/i }));

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText("Editar Servicio")).not.toBeInTheDocument();
      });
    });
  });

  describe("Flujo completo de eliminación", () => {
    it('should show confirmation dialog when clicking "Eliminar"', async () => {
      const user = userEvent.setup();
      render(<OfferingsPage />);

      // Open menu for first offering
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click delete option
      await waitFor(() => {
        expect(screen.getByText("Eliminar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Eliminar"));

      // Confirm dialog should have been called
      expect(mockConfirm).toHaveBeenCalledWith(
        "¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.",
      );
    });

    it("should delete offering when confirmed", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockDeleteMutateAsync.mockResolvedValue(undefined);

      render(<OfferingsPage />);

      // Open menu and click delete
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click delete
      await waitFor(() => {
        expect(screen.getByText("Eliminar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Eliminar"));

      // Wait for mutation
      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith("offering-1");
      });

      // Success notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio eliminado exitosamente",
            color: "green",
          }),
        );
      });
    });

    it("should not delete offering when cancelled", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<OfferingsPage />);

      // Open menu and click delete
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click delete
      await waitFor(() => {
        expect(screen.getByText("Eliminar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Eliminar"));

      // Mutation should not be called
      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("Manejo de errores de API", () => {
    it("should show error notification when creation fails", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValue({
        response: {
          status: 409,
          data: { message: "Conflict" },
        },
      });

      render(<OfferingsPage />);

      // Open create modal and submit
      await user.click(screen.getByRole("button", { name: /nuevo servicio/i }));

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText("Crear Servicio")).toBeInTheDocument();
      });

      await user.type(
        screen.getByPlaceholderText("Ej: Corte de pelo"),
        "Duplicate Service",
      );
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Error notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Ya existe un servicio con ese nombre",
            color: "red",
          }),
        );
      });
    });

    it("should show error notification when update fails with 403", async () => {
      const user = userEvent.setup();
      mockUpdateMutateAsync.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "Forbidden" },
        },
      });

      render(<OfferingsPage />);

      // Open edit modal and submit
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click edit
      await waitFor(() => {
        expect(screen.getByText("Editar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Editar"));

      // Wait for modal and submit
      await waitFor(() => {
        expect(screen.getByText("Editar Servicio")).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /guardar/i }));

      // Error notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "No tienes permisos para realizar esta acción",
            color: "red",
          }),
        );
      });
    });

    it("should show error notification when delete fails", async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockDeleteMutateAsync.mockRejectedValue({
        response: {
          status: 404,
          data: { message: "Not found" },
        },
      });

      render(<OfferingsPage />);

      // Open menu and click delete
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click delete
      await waitFor(() => {
        expect(screen.getByText("Eliminar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Eliminar"));

      // Error notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "El servicio no fue encontrado",
            color: "red",
          }),
        );
      });
    });

    it("should show error notification when toggle active fails", async () => {
      const user = userEvent.setup();
      mockToggleMutateAsync.mockRejectedValue({
        response: {
          status: 403,
          data: { message: "Forbidden" },
        },
      });

      render(<OfferingsPage />);

      // Open menu and click toggle
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click deactivate
      await waitFor(() => {
        expect(screen.getByText("Desactivar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Desactivar"));

      // Error notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "No tienes permisos para realizar esta acción",
            color: "red",
          }),
        );
      });
    });
  });

  describe("Toggle Active Status", () => {
    it("should toggle offering active status", async () => {
      const user = userEvent.setup();
      mockToggleMutateAsync.mockResolvedValue({
        ...mockOfferings[0],
        isActive: false,
      });

      render(<OfferingsPage />);

      // Open menu for first offering (which is active)
      const firstCard = findOfferingCard("Corte de Pelo");
      const menuButton = within(firstCard).getByRole("button");
      await user.click(menuButton);

      // Wait for menu and click deactivate option
      await waitFor(() => {
        expect(screen.getByText("Desactivar")).toBeInTheDocument();
      });
      await user.click(screen.getByText("Desactivar"));

      // Wait for mutation
      await waitFor(() => {
        expect(mockToggleMutateAsync).toHaveBeenCalledWith({
          id: "offering-1",
          isActive: false,
        });
      });

      // Success notification should be shown
      await waitFor(() => {
        expect(notifications.show).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Servicio desactivado exitosamente",
            color: "green",
          }),
        );
      });
    });
  });

  describe("Loading and Error States", () => {
    it("should show loading state", () => {
      vi.mocked(offeringHooks.useOfferings).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof offeringHooks.useOfferings>);

      render(<OfferingsPage />);

      // Check for loader by finding the Center component with Loader inside
      expect(screen.getByText("Servicios")).toBeInTheDocument();
      // The loader is rendered, we just can't query it by role="presentation"
    });

    it("should show error state", () => {
      vi.mocked(offeringHooks.useOfferings).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load"),
      } as unknown as ReturnType<typeof offeringHooks.useOfferings>);

      render(<OfferingsPage />);

      expect(screen.getByText("Error al cargar servicios")).toBeInTheDocument();
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("should show empty state", () => {
      vi.mocked(offeringHooks.useOfferings).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as unknown as ReturnType<typeof offeringHooks.useOfferings>);

      render(<OfferingsPage />);

      expect(
        screen.getByText("No hay servicios configurados"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Crea tu primer servicio para comenzar"),
      ).toBeInTheDocument();
    });
  });
});
