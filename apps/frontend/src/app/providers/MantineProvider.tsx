import { MantineProvider as MantineUIProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

interface MantineProviderProps {
  children: ReactNode;
}

/**
 * Tema personalizado con paleta brandGreen
 * Basado en los colores de la imagen de fondo del login
 */
const theme = createTheme({
  colors: {
    brandGreen: [
      '#e6f4ed',  // 0 - Más claro (tinte muy suave para backgrounds)
      '#c2e6d3',  // 1 - Claro (para hovers y estados sutiles)
      '#9dd8b9',  // 2 - Claro medio
      '#78ca9f',  // 3 - Medio claro
      '#53bc85',  // 4 - Medio
      '#19874e',  // 5 - Base (HSL: hsl(149, 69, 31))
      '#138147',  // 6 - Medio oscuro (HSL: hsl(148, 74, 29)) ← Primary en light mode
      '#107c42',  // 7 - Oscuro (HSL: hsl(148, 77, 27)) ← Primary en dark mode
      '#086b38',  // 8 - Más oscuro (HSL: hsl(149, 86, 23))
      '#065529',  // 9 - Muy oscuro (para textos en fondos claros)
    ],
  },
  primaryColor: 'brandGreen',
  primaryShade: { light: 6, dark: 7 },
  fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
});

export function MantineProvider({ children }: MantineProviderProps) {
  return (
    <MantineUIProvider theme={theme}>
      <Notifications position="top-right" />
      {children}
    </MantineUIProvider>
  );
}
