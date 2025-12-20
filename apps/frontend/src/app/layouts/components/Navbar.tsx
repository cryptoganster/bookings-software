/**
 * Navbar Component
 *
 * Side navigation with welcome message and navigation links.
 *
 * Adapted from templates-mantine-ui/dashvista/Navbar.tsx
 * Changes:
 * - Replaced title with "Bienvenido a Skeda"
 * - Removed UsersChat component (out of MVP scope)
 * - Created navlinks array: Dashboard (IconHome2), Appointments (IconCalendar), Customers (IconUsers)
 * - Using @tabler/icons-react instead of iconsax-react
 * - Using Link from react-router-dom instead of @remix-run/react
 * - Implemented highlight with data-active using useLocation
 * - Applied brandGreen.6 for active state, brandGreen.1 for hover
 * - Maintained radius="xl" on navlinks
 * - Maintained ScrollArea for responsive navigation
 * - Maintained smooth transition: cubic-bezier(0.075, 0.82, 0.165, 1)
 *
 * Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.10, 6.11, 6.12
 */

import { Flex, ScrollArea, Text } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { IconHome2, IconCalendar, IconUsers } from "@tabler/icons-react";
import classes from "./Navbar.module.css";

interface NavLink {
  id: number;
  name: string;
  link: string;
  icon: typeof IconHome2;
}

const navlinks: NavLink[] = [
  {
    id: 1,
    name: "Dashboard",
    link: "/",
    icon: IconHome2,
  },
  {
    id: 2,
    name: "Appointments",
    link: "/appointments",
    icon: IconCalendar,
  },
  {
    id: 3,
    name: "Customers",
    link: "/customers",
    icon: IconUsers,
  },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <Flex h="100%" direction="column" gap={30} align="start" w="100%">
      {/* Welcome Title */}
      <Flex direction="column" align="start">
        <Text className={classes.title} lh={1.1} fz={26} fw={500}>
          Bienvenido a
        </Text>
        <Text className={classes.title} fz={26} fw={500}>
          Skeda
        </Text>
      </Flex>

      {/* Navigation Links */}
      <ScrollArea scrollbarSize={0} h="calc(100% - 100px)" w="100%">
        <Flex className={classes.navlinkContainer}>
          {navlinks.map(({ id, link, name, icon: Icon }) => {
            const isActive = pathname === link;

            return (
              <Link
                data-active={isActive}
                className={classes.navlink}
                to={link}
                key={id}
              >
                <Flex flex={1} align="center" gap={6}>
                  <Icon size={18} />
                  <Text fz={13}>{name}</Text>
                </Flex>
              </Link>
            );
          })}
        </Flex>
      </ScrollArea>
    </Flex>
  );
}
