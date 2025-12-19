import { Badge } from "@mantine/core";
import type { CustomerReadModel } from "@packages/shared-types";

interface CustomerBadgeProps {
  customer: CustomerReadModel;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "light" | "filled" | "outline";
}

/**
 * Customer badge component showing customer type
 * Shows "Registrado" (green) for registered customers or "Anónimo" (gray) for anonymous
 */
export function CustomerBadge({
  customer,
  size = "sm",
  variant = "light",
}: CustomerBadgeProps) {
  const isRegistered = customer.userId !== null;

  return (
    <Badge
      color={isRegistered ? "green" : "gray"}
      variant={variant}
      size={size}
    >
      {isRegistered ? "Registrado" : "Anónimo"}
    </Badge>
  );
}
