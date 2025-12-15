import type { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { MantineProvider } from "./MantineProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <MantineProvider>{children}</MantineProvider>
    </QueryProvider>
  );
}
