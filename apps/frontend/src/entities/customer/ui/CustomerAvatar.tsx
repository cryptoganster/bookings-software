import { Avatar } from "@mantine/core";
import type { CustomerReadModel } from "@packages/shared-types";
import { getCustomerInitials } from "@shared/lib/customer/formatters";

interface CustomerAvatarProps {
  customer: CustomerReadModel;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  radius?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * Customer avatar component with initials
 * Color based on customer type (blue for registered, gray for anonymous)
 */
export function CustomerAvatar({
  customer,
  size = "md",
  radius = "xl",
}: CustomerAvatarProps) {
  const isRegistered = customer.userId !== null;
  const initials = getCustomerInitials(customer);

  return (
    <Avatar color={isRegistered ? "blue" : "gray"} radius={radius} size={size}>
      {initials}
    </Avatar>
  );
}
