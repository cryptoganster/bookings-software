/**
 * Unit tests for OfferingForm component
 *
 * Tests:
 * - Renderiza todos los campos correctamente
 * - Muestra errores de validación
 * - Llama onSubmit con datos válidos
 * - Llama onCancel al hacer clic en cancelar
 * - Deshabilita campos durante loading
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { OfferingForm } from "../OfferingForm";
import type { OfferingDto } from "@packages/shared-types";

describe("OfferingForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado", () => {
    it("renderiza todos los campos correctamente en modo creación", () => {
      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Verificar que todos los campos están presentes
      expect(screen.getByLabelText(/nombre del servicio/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/duración \(minutos\)/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/capacidad por slot/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/capacidad diaria máxima/i),
      ).toBeInTheDocument();

      // Verificar botones
      expect(
        screen.getByRole("button", { name: /cancelar/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /guardar/i }),
      ).toBeInTheDocument();
    });

    it("precarga datos en modo edición", () => {
      const offering: OfferingDto = {
        id: "1",
        businessId: "business-1",
        name: "Corte de pelo",
        duration: 45,
        maxCapacityPerSlot: 2,
        maxDailyCapacity: 10,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
      };

      render(
        <OfferingForm
          offering={offering}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Verificar que los campos tienen los valores correctos
      const nameInput = screen.getByLabelText(
        /nombre del servicio/i,
      ) as HTMLInputElement;
      expect(nameInput.value).toBe("Corte de pelo");

      // Los NumberInput de Mantine renderizan el valor en el input
      const durationInput = screen.getByLabelText(
        /duración \(minutos\)/i,
      ) as HTMLInputElement;
      expect(durationInput.value).toBe("45");

      const capacityInput = screen.getByLabelText(
        /capacidad por slot/i,
      ) as HTMLInputElement;
      expect(capacityInput.value).toBe("2");

      const dailyCapacityInput = screen.getByLabelText(
        /capacidad diaria máxima/i,
      ) as HTMLInputElement;
      expect(dailyCapacityInput.value).toBe("10");
    });
  });

  describe("Validación", () => {
    it("muestra errores de validación cuando los datos son inválidos", async () => {
      const user = userEvent.setup();

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Enfocar y desenfocar el campo nombre para activar validación onBlur
      const nameInput = screen.getByLabelText(/nombre del servicio/i);
      await user.click(nameInput);
      await user.tab(); // Trigger onBlur

      // Esperar a que aparezcan los errores
      await waitFor(() => {
        expect(
          screen.getByText(/el nombre debe tener al menos 3 caracteres/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra error cuando el nombre es muy corto", async () => {
      const user = userEvent.setup();

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByLabelText(/nombre del servicio/i);
      await user.type(nameInput, "AB");
      await user.tab(); // Trigger onBlur

      await waitFor(() => {
        expect(
          screen.getByText(/el nombre debe tener al menos 3 caracteres/i),
        ).toBeInTheDocument();
      });
    });

    it("muestra error cuando el nombre es muy largo", async () => {
      const user = userEvent.setup();

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const nameInput = screen.getByLabelText(/nombre del servicio/i);
      const longName = "A".repeat(101);
      await user.type(nameInput, longName);
      await user.tab(); // Trigger onBlur

      await waitFor(() => {
        expect(
          screen.getByText(/el nombre no puede exceder 100 caracteres/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Envío de formulario", () => {
    it("llama onSubmit con datos válidos", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Llenar formulario con datos válidos
      const nameInput = screen.getByLabelText(/nombre del servicio/i);
      await user.type(nameInput, "Corte de pelo");

      // Los NumberInput ya tienen valores por defecto (30, 1)
      // Solo necesitamos enviar el formulario

      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: "Corte de pelo",
          durationMinutes: 30,
          maxCapacityPerSlot: 1,
          maxDailyCapacity: null,
        });
      });
    });

    it("no llama onSubmit cuando hay errores de validación", async () => {
      const user = userEvent.setup();

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      // Dejar el nombre vacío (inválido)
      const submitButton = screen.getByRole("button", { name: /guardar/i });
      await user.click(submitButton);

      // onSubmit no debe ser llamado
      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Cancelación", () => {
    it("llama onCancel al hacer clic en cancelar", async () => {
      const user = userEvent.setup();

      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByRole("button", { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Estados de carga", () => {
    it("deshabilita campos durante loading", () => {
      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />,
      );

      // Verificar que los campos están deshabilitados
      expect(screen.getByLabelText(/nombre del servicio/i)).toBeDisabled();
      expect(screen.getByLabelText(/duración \(minutos\)/i)).toBeDisabled();
      expect(screen.getByLabelText(/capacidad por slot/i)).toBeDisabled();
      expect(screen.getByLabelText(/capacidad diaria máxima/i)).toBeDisabled();

      // Verificar que los botones están deshabilitados
      expect(screen.getByRole("button", { name: /cancelar/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /guardando/i })).toBeDisabled();
    });

    it("muestra spinner en botón durante loading", () => {
      render(
        <OfferingForm
          offering={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />,
      );

      // Verificar que el texto del botón cambió
      expect(
        screen.getByRole("button", { name: /guardando/i }),
      ).toBeInTheDocument();
    });
  });
});
