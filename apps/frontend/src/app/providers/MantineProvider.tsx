import { MantineProvider as MantineUIProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

interface MantineProviderProps {
  children: ReactNode;
}

export function MantineProvider({ children }: MantineProviderProps) {
  return (
    <MantineUIProvider
      theme={{
        primaryColor: "blue",
        fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
      }}
    >
      <Notifications position="top-right" />
      {children}
    </MantineUIProvider>
  );
}
