/**
 * useViewPreference Hook
 *
 * Gestiona la preferencia de vista (lista o calendario) del usuario
 * Persiste la preferencia en localStorage usando Zustand persist middleware
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tipo de vista disponible
 */
export type ViewMode = "list" | "calendar";

/**
 * Estado de la preferencia de vista
 */
interface ViewPreferenceState {
  /** Vista actual seleccionada */
  view: ViewMode;
  /** Función para cambiar la vista */
  setView: (view: ViewMode) => void;
}

/**
 * Hook de Zustand para gestionar la preferencia de vista
 *
 * Features:
 * - Persiste en localStorage con key "appointments-view-preference"
 * - Vista por defecto: "list"
 * - Sincronización automática entre tabs
 *
 * @example
 * ```tsx
 * const { view, setView } = useViewPreference();
 *
 * // Cambiar a vista de calendario
 * setView("calendar");
 *
 * // Renderizado condicional
 * {view === "list" ? <ListView /> : <CalendarView />}
 * ```
 */
export const useViewPreference = create<ViewPreferenceState>()(
  persist(
    (set) => ({
      view: "list",
      setView: (view) => set({ view }),
    }),
    {
      name: "appointments-view-preference",
    },
  ),
);
