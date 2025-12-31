/**
 * PasswordStrengthIndicator Component
 *
 * Visual feedback for password strength with progress bar and checklist
 *
 * Features:
 * - Progress bar with color coding (red/orange/yellow/green)
 * - Checklist of password requirements with checkmarks
 * - Real-time updates as user types
 * - Accessibility: aria-label with current strength level
 *
 * Requirements: FR-1.3, NFR-3.1
 */

import { Progress, Text, List, ThemeIcon, Box, Group } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";

import {
  calculatePasswordStrength,
  getStrengthColor,
  getStrengthPercentage,
  type StrengthLevel,
} from "../model/passwordStrength";

export interface PasswordStrengthIndicatorProps {
  /** Password to evaluate */
  password: string;
}

/**
 * Requirement item with check/x icon
 */
interface RequirementItemProps {
  /** Whether the requirement is met */
  met: boolean;
  /** Requirement label */
  label: string;
}

const RequirementItem = ({ met, label }: RequirementItemProps) => (
  <List.Item
    icon={
      <ThemeIcon
        color={met ? "green" : "red"}
        size={20}
        radius="xl"
        variant="light"
      >
        {met ? <IconCheck size={12} /> : <IconX size={12} />}
      </ThemeIcon>
    }
  >
    <Text size="sm" c={met ? "dimmed" : undefined}>
      {label}
    </Text>
  </List.Item>
);

/**
 * Maps strength level to Spanish label
 */
const getStrengthLabel = (level: StrengthLevel): string => {
  switch (level) {
    case "weak":
      return "Débil";
    case "fair":
      return "Regular";
    case "good":
      return "Buena";
    case "strong":
      return "Fuerte";
  }
};

/**
 * Password strength indicator with progress bar and requirements checklist
 *
 * @example
 * ```tsx
 * <PasswordStrengthIndicator password={watchedPassword} />
 * ```
 */
export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const { level, score, checks } = calculatePasswordStrength(password);
  const color = getStrengthColor(level);
  const percentage = getStrengthPercentage(score);
  const strengthLabel = getStrengthLabel(level);

  // Don't show anything if password is empty
  if (!password) {
    return null;
  }

  return (
    <Box
      aria-label={`Fortaleza de contraseña: ${strengthLabel}`}
      role="status"
      aria-live="polite"
    >
      {/* Strength label and progress bar */}
      <Group justify="space-between" mb={5}>
        <Text size="sm" fw={500}>
          Fortaleza de contraseña
        </Text>
        <Text size="sm" c={color} fw={500}>
          {strengthLabel}
        </Text>
      </Group>

      <Progress
        value={percentage}
        color={color}
        size="sm"
        radius="xl"
        mb="sm"
        aria-label={`Fortaleza: ${percentage}%`}
      />

      {/* Requirements checklist */}
      <List spacing="xs" size="sm" center>
        <RequirementItem met={checks.minLength} label="Mínimo 8 caracteres" />
        <RequirementItem
          met={checks.hasUppercase}
          label="Al menos una mayúscula"
        />
        <RequirementItem
          met={checks.hasLowercase}
          label="Al menos una minúscula"
        />
        <RequirementItem met={checks.hasNumber} label="Al menos un número" />
        <RequirementItem
          met={checks.hasSpecial}
          label="Al menos un carácter especial (!@#$%^&*)"
        />
      </List>
    </Box>
  );
}
