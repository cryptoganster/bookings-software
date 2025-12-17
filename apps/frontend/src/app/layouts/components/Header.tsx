/**
 * Header Component
 *
 * Top navigation bar with burger menu, business name, and user menu.
 *
 * Adapted from templates-mantine-ui/dashvista/Header.tsx
 * Changes:
 * - Replaced logo with simple business name text
 * - Removed SearchInput (out of MVP scope)
 * - Removed notification and settings ActionIcons (out of MVP scope)
 * - Integrated existing LogoutButton in Popover
 * - Using @tabler/icons-react instead of iconsax-react
 * - Applied brandGreen color scheme
 * - Applied radius="xl" to ActionIcons and Popover
 *
 * Requirements: 6.2, 6.6, 6.7, 6.8
 */

import {
  ActionIcon,
  Burger,
  Divider,
  Flex,
  Group,
  Popover,
  Text,
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { LogoutButton } from "@features/auth/logout";
import { useAuthStore } from "@app/store/auth.store";
import classes from "./Header.module.css";

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <Group w="100%" gap={0} className={classes.root} p={0} h="100%">
      <Burger
        mr={10}
        opened={opened}
        onClick={toggle}
        hiddenFrom="md"
        size="sm"
      />

      <Flex gap="sm" align="center">
        <Text fz={18} fw={600}>
          Skeda
        </Text>
      </Flex>

      <Flex
        flex={1}
        justify="end"
        align="center"
        gap={14}
        className={classes.toolSection}
      >
        {/* Desktop: Show user info (text only, no avatar) */}
        <Flex visibleFrom="md" direction="column" gap={3} align="end">
          <Text lh={1} fw={500} fz={14}>
            {user?.name || "Usuario"}
          </Text>
          <Text lh={1} fz={13} c="dimmed">
            {user?.email || ""}
          </Text>
        </Flex>

        {/* Mobile: Avatar with Popover */}
        <Popover
          width={200}
          position="bottom"
          withArrow
          shadow="md"
          radius="xl"
        >
          <Popover.Target>
            <ActionIcon
              hiddenFrom="md"
              size={36}
              radius="xl"
              variant="light"
              color="brandGreen"
            >
              <IconUser size={20} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <Flex direction="column" gap={10} align="start">
              <Flex direction="column" gap={3} align="start">
                <Text fw={500} fz={14}>
                  {user?.name || "Usuario"}
                </Text>
                <Text fz={13} c="dimmed">
                  {user?.email || ""}
                </Text>
              </Flex>
              <Divider w="100%" />
              <LogoutButton variant="subtle" size="xs" />
            </Flex>
          </Popover.Dropdown>
        </Popover>

        {/* Desktop: Logout button in Popover */}
        <Group visibleFrom="md">
          <Popover
            width={200}
            position="bottom-end"
            withArrow
            shadow="md"
            radius="xl"
          >
            <Popover.Target>
              <ActionIcon
                size={36}
                radius="xl"
                variant="light"
                color="brandGreen"
                className={classes.actionControl}
              >
                <IconUser size={20} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Flex direction="column" gap={10} align="start">
                <Flex direction="column" gap={3} align="start">
                  <Text fw={500} fz={14}>
                    {user?.name || "Usuario"}
                  </Text>
                  <Text fz={13} c="dimmed">
                    {user?.email || ""}
                  </Text>
                </Flex>
                <Divider w="100%" />
                <LogoutButton variant="subtle" size="xs" />
              </Flex>
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Flex>
    </Group>
  );
}
