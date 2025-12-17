/**
 * DashboardLayout Component
 *
 * Main layout for authenticated pages based on dashvista template.
 * Includes Header with navigation and user menu, and Navbar with navigation links.
 *
 * Adapted from templates-mantine-ui/dashvista/App.tsx
 * Changes:
 * - Removed Remix dependencies, using React Router DOM
 * - Configured AppShell with height: 60, width: 280, breakpoint: "md"
 * - Using useDisclosure from @mantine/hooks for mobile navbar control
 * - Applied radius="xl" to interactive components
 *
 * Requirements: 6.1, 6.2
 */

import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Navbar } from "./components/Navbar";
import classes from "./DashboardLayout.module.css";

export function DashboardLayout() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      withBorder={false}
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: "md",
        collapsed: { mobile: !opened },
      }}
      padding={0}
      classNames={{
        root: classes.root,
        navbar: classes.navbar,
        header: classes.header,
        main: classes.main,
      }}
    >
      <AppShell.Header>
        <Header opened={opened} toggle={toggle} />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
