import { Badge } from "@mantine/core";

interface ConversationBadgeProps {
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED";
  variant?: "filled" | "light" | "outline";
}

export function ConversationBadge({
  status,
  variant = "light",
}: ConversationBadgeProps) {
  const config = {
    ACTIVE: { color: "blue", label: "Activa" },
    AWAITING_ADMIN: { color: "red", label: "Pendiente" },
    RESOLVED: { color: "gray", label: "Resuelta" },
  };

  const { color, label } = config[status];

  return (
    <Badge color={color} variant={variant}>
      {label}
    </Badge>
  );
}
