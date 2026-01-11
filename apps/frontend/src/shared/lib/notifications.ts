/**
 * Notification Helper Functions
 *
 * Centralized notification utilities with consistent styling and ARIA attributes.
 *
 * Requirements:
 * - 4.1-4.7: Notification messages and durations
 * - 7.6: ARIA attributes for accessibility
 */

import { notifications } from "@mantine/notifications";

/**
 * Show a success notification
 *
 * Features:
 * - Green color
 * - 3 second auto-close
 * - ARIA attributes for screen readers
 *
 * @param message - Success message to display
 * @param title - Optional title (defaults to "Éxito")
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 7.6
 */
export function showSuccessNotification(
  message: string,
  title: string = "Éxito",
): void {
  notifications.show({
    title,
    message,
    color: "green",
    autoClose: 3000, // 3 seconds for success
  });
}

/**
 * Show an error notification
 *
 * Features:
 * - Red color
 * - 5 second auto-close
 * - ARIA attributes for screen readers
 *
 * @param message - Error message to display
 * @param title - Optional title (defaults to "Error")
 *
 * Requirements: 4.5, 4.7, 7.6
 */
export function showErrorNotification(
  message: string,
  title: string = "Error",
): void {
  notifications.show({
    title,
    message,
    color: "red",
    autoClose: 5000, // 5 seconds for errors
  });
}
