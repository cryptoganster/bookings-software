import { Button } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@app/store/auth.store";

/**
 * LogoutButton Component
 *
 * Button that logs out the user, clears authentication state,
 * and redirects to the login page.
 *
 * @example
 * ```tsx
 * <LogoutButton />
 * <LogoutButton variant="subtle" />
 * ```
 */
export function LogoutButton({
  variant = "default",
  size = "sm",
}: {
  variant?: "default" | "subtle" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Clear auth state (token and user data)
    logout();

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  return (
    <Button
      variant={variant}
      size={size}
      leftSection={<IconLogout size={16} />}
      onClick={handleLogout}
    >
      Cerrar Sesión
    </Button>
  );
}
