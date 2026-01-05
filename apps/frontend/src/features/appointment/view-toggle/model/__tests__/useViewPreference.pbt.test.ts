/**
 * Property-Based Tests for useViewPreference
 *
 * Task 1.3: Write property test for view preference persistence
 * Property 1: View Preference Persistence
 * Validates: Requirements 1.4, 1.5
 *
 * Tests that any view selection persists to localStorage and retrieves correctly
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { renderHook, act } from "@testing-library/react";
import { useViewPreference } from "../useViewPreference";

describe("useViewPreference - Property-Based Tests", () => {
  // Limpiar localStorage y forzar rehydration de Zustand antes y después de cada test
  beforeEach(() => {
    localStorage.clear();
    // Forzar a Zustand a rehydratar desde localStorage vacío
    useViewPreference.persist.rehydrate();
  });

  afterEach(() => {
    localStorage.clear();
    // Resetear el estado de Zustand al valor por defecto
    useViewPreference.setState({ view: "list" });
  });

  describe("Property 1: View Preference Persistence", () => {
    /**
     * Property: Para cualquier vista seleccionada (list o calendar),
     * después de seleccionarla y almacenarla en localStorage,
     * recuperar el valor debe retornar la misma preferencia de vista.
     *
     * Invariante: setView(v) → getView() === v
     */
    test.prop([fc.constantFrom("list" as const, "calendar" as const)])(
      "should persist any view selection to localStorage",
      (viewMode) => {
        // Arrange: Renderizar el hook
        const { result } = renderHook(() => useViewPreference());

        // Act: Cambiar la vista
        act(() => {
          result.current.setView(viewMode);
        });

        // Assert: La vista debe cambiar inmediatamente
        expect(result.current.view).toBe(viewMode);

        // Act: Simular recarga - crear nueva instancia del hook
        const { result: result2 } = renderHook(() => useViewPreference());

        // Assert: La vista debe persistir después de "recarga"
        expect(result2.current.view).toBe(viewMode);
      },
    );

    /**
     * Property: Múltiples cambios de vista deben persistir el último valor
     *
     * Invariante: setView(v1) → setView(v2) → getView() === v2
     */
    test.prop([
      fc.array(fc.constantFrom("list" as const, "calendar" as const), {
        minLength: 1,
        maxLength: 10,
      }),
    ])(
      "should persist the last view selection after multiple changes",
      (views) => {
        // Arrange
        const { result } = renderHook(() => useViewPreference());

        // Act: Aplicar todos los cambios de vista
        act(() => {
          views.forEach((view) => {
            result.current.setView(view);
          });
        });

        const lastView = views[views.length - 1];

        // Assert: La vista actual debe ser la última
        expect(result.current.view).toBe(lastView);

        // Act: Simular recarga
        const { result: result2 } = renderHook(() => useViewPreference());

        // Assert: La vista persistida debe ser la última
        expect(result2.current.view).toBe(lastView);
      },
    );

    /**
     * Property: El valor en localStorage debe coincidir con el estado del hook
     *
     * Invariante: setView(v) → localStorage.getItem() contiene v
     */
    test.prop([fc.constantFrom("list" as const, "calendar" as const)])(
      "should store view preference in localStorage with correct key",
      (viewMode) => {
        // Arrange
        const { result } = renderHook(() => useViewPreference());

        // Act
        act(() => {
          result.current.setView(viewMode);
        });

        // Assert: localStorage debe contener el valor
        const stored = localStorage.getItem("appointments-view-preference");
        expect(stored).toBeTruthy();

        // Parse el JSON almacenado
        const parsed = JSON.parse(stored!);
        expect(parsed.state.view).toBe(viewMode);
      },
    );

    /**
     * Property: Idempotencia - llamar setView con el mismo valor múltiples veces
     * debe resultar en el mismo estado
     *
     * Invariante: setView(v) → setView(v) → setView(v) → getView() === v
     */
    test.prop([
      fc.constantFrom("list" as const, "calendar" as const),
      fc.integer({ min: 1, max: 5 }),
    ])(
      "should be idempotent - setting same view multiple times has same result",
      (viewMode, repetitions) => {
        // Arrange
        const { result } = renderHook(() => useViewPreference());

        // Act: Establecer la misma vista múltiples veces
        act(() => {
          for (let i = 0; i < repetitions; i++) {
            result.current.setView(viewMode);
          }
        });

        // Assert: El resultado debe ser el mismo
        expect(result.current.view).toBe(viewMode);

        // Act: Simular recarga
        const { result: result2 } = renderHook(() => useViewPreference());

        // Assert: La persistencia debe ser consistente
        expect(result2.current.view).toBe(viewMode);
      },
    );
  });

  describe("Default behavior", () => {
    it("should default to 'list' view when no preference is stored", () => {
      // Arrange: localStorage vacío
      localStorage.clear();

      // Act
      const { result } = renderHook(() => useViewPreference());

      // Assert
      expect(result.current.view).toBe("list");
    });

    it("should provide setView function", () => {
      // Arrange
      const { result } = renderHook(() => useViewPreference());

      // Assert
      expect(typeof result.current.setView).toBe("function");
    });
  });

  describe("Edge cases", () => {
    it("should handle corrupted localStorage data gracefully", () => {
      // Arrange: Datos corruptos en localStorage
      localStorage.setItem("appointments-view-preference", "invalid-json");

      // Act: Debería usar el valor por defecto
      const { result } = renderHook(() => useViewPreference());

      // Assert: Debe usar el valor por defecto sin crashear
      expect(result.current.view).toBe("list");
    });

    it("should handle missing state property in localStorage", () => {
      // Arrange: JSON válido pero sin la propiedad state
      localStorage.setItem("appointments-view-preference", JSON.stringify({}));

      // Act
      const { result } = renderHook(() => useViewPreference());

      // Assert: Debe usar el valor por defecto
      expect(result.current.view).toBe("list");
    });
  });
});
