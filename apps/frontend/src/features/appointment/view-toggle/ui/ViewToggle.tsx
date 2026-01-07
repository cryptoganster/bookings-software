/**
 * ViewToggle Component
 *
 * Control de alternancia entre vista de lista y vista de calendario
 * Persiste la selección del usuario en localStorage
 */

import { SegmentedControl, Center, Box } from "@mantine/core";
import { IconList, IconCalendar } from "@tabler/icons-react";
import { useViewPreference } from "../model/useViewPreference";

/**
 * Toggle para cambiar entre vista de lista y calendario
 *
 * Features:
 * - Iconos visuales para cada vista
 * - Persiste preferencia en localStorage
 * - Sincronización automática entre tabs
 * - Accesible con teclado
 *
 * @example
 * ```tsx
 * <ViewToggle />
 * ```
 */
export function ViewToggle() {
  const { view, setView } = useViewPreference();

  return (
    <SegmentedControl
      value={view}
      onChange={(value) => setView(value as "list" | "calendar")}
      data={[
        {
          value: "list",
          label: (
            <Center>
              <IconList size={16} />
              <Box ml={10}>Lista</Box>
            </Center>
          ),
        },
        {
          value: "calendar",
          label: (
            <Center>
              <IconCalendar size={16} />
              <Box ml={10}>Calendario</Box>
            </Center>
          ),
        },
      ]}
    />
  );
}
