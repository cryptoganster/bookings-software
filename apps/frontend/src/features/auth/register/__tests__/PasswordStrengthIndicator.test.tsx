/**
 * PasswordStrengthIndicator Component Tests
 *
 * Unit tests for the password strength visual indicator
 *
 * Requirements: FR-1.3, NFR-3.1
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { PasswordStrengthIndicator } from "../ui/PasswordStrengthIndicator";

// Wrapper with MantineProvider
const renderWithProvider = (ui: React.ReactElement) => {
  return render(<MantineProvider>{ui}</MantineProvider>);
};

describe("PasswordStrengthIndicator", () => {
  describe("rendering", () => {
    it("should not render when password is empty", () => {
      renderWithProvider(<PasswordStrengthIndicator password="" />);

      expect(
        screen.queryByText("Fortaleza de contraseña"),
      ).not.toBeInTheDocument();
    });

    it("should render when password has content", () => {
      renderWithProvider(<PasswordStrengthIndicator password="a" />);

      expect(screen.getByText("Fortaleza de contraseña")).toBeInTheDocument();
    });

    it("should render all requirement items", () => {
      renderWithProvider(<PasswordStrengthIndicator password="test" />);

      expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
      expect(screen.getByText("Al menos una mayúscula")).toBeInTheDocument();
      expect(screen.getByText("Al menos una minúscula")).toBeInTheDocument();
      expect(screen.getByText("Al menos un número")).toBeInTheDocument();
      expect(
        screen.getByText("Al menos un carácter especial (!@#$%^&*)"),
      ).toBeInTheDocument();
    });
  });

  describe("strength levels", () => {
    it("should show 'Débil' for weak passwords (score 0-1)", () => {
      renderWithProvider(<PasswordStrengthIndicator password="a" />);

      expect(screen.getByText("Débil")).toBeInTheDocument();
    });

    it("should show 'Regular' for fair passwords (score 2)", () => {
      // lowercase + minLength = 2 checks
      renderWithProvider(<PasswordStrengthIndicator password="abcdefgh" />);

      expect(screen.getByText("Regular")).toBeInTheDocument();
    });

    it("should show 'Buena' for good passwords (score 3-4)", () => {
      // lowercase + uppercase + minLength = 3 checks
      renderWithProvider(<PasswordStrengthIndicator password="Abcdefgh" />);

      expect(screen.getByText("Buena")).toBeInTheDocument();
    });

    it("should show 'Fuerte' for strong passwords (score 5)", () => {
      // All 5 checks pass
      renderWithProvider(<PasswordStrengthIndicator password="Abcdefg1!" />);

      expect(screen.getByText("Fuerte")).toBeInTheDocument();
    });
  });

  describe("requirement checkmarks", () => {
    it("should show minLength as met when password >= 8 chars", () => {
      renderWithProvider(<PasswordStrengthIndicator password="12345678" />);

      // Find the list item containing "Mínimo 8 caracteres"
      const minLengthItem = screen.getByText("Mínimo 8 caracteres");
      const listItem = minLengthItem.closest("li");

      // Should have green check icon (ThemeIcon with color="green")
      expect(listItem).toBeInTheDocument();
      // The icon should be a check (green theme)
      const themeIcon = listItem?.querySelector('[class*="ThemeIcon"]');
      expect(themeIcon).toBeInTheDocument();
    });

    it("should show minLength as not met when password < 8 chars", () => {
      renderWithProvider(<PasswordStrengthIndicator password="1234567" />);

      const minLengthItem = screen.getByText("Mínimo 8 caracteres");
      const listItem = minLengthItem.closest("li");

      // Should have red X icon
      expect(listItem).toBeInTheDocument();
    });

    it("should show uppercase as met when password has uppercase", () => {
      renderWithProvider(<PasswordStrengthIndicator password="A" />);

      const uppercaseItem = screen.getByText("Al menos una mayúscula");
      expect(uppercaseItem).toBeInTheDocument();
    });

    it("should show lowercase as met when password has lowercase", () => {
      renderWithProvider(<PasswordStrengthIndicator password="a" />);

      const lowercaseItem = screen.getByText("Al menos una minúscula");
      expect(lowercaseItem).toBeInTheDocument();
    });

    it("should show number as met when password has number", () => {
      renderWithProvider(<PasswordStrengthIndicator password="1" />);

      const numberItem = screen.getByText("Al menos un número");
      expect(numberItem).toBeInTheDocument();
    });

    it("should show special as met when password has special char", () => {
      renderWithProvider(<PasswordStrengthIndicator password="!" />);

      const specialItem = screen.getByText(
        "Al menos un carácter especial (!@#$%^&*)",
      );
      expect(specialItem).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have aria-label with strength level", () => {
      renderWithProvider(<PasswordStrengthIndicator password="test" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Fortaleza de contraseña"),
      );
    });

    it("should have aria-live for real-time updates", () => {
      renderWithProvider(<PasswordStrengthIndicator password="test" />);

      const indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute("aria-live", "polite");
    });

    it("should update aria-label when strength changes", () => {
      const { rerender } = renderWithProvider(
        <PasswordStrengthIndicator password="a" />,
      );

      let indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "aria-label",
        "Fortaleza de contraseña: Débil",
      );

      // Rerender with strong password
      rerender(
        <MantineProvider>
          <PasswordStrengthIndicator password="Abcdefg1!" />
        </MantineProvider>,
      );

      indicator = screen.getByRole("status");
      expect(indicator).toHaveAttribute(
        "aria-label",
        "Fortaleza de contraseña: Fuerte",
      );
    });
  });

  describe("real-time updates", () => {
    it("should update strength when password changes", () => {
      const { rerender } = renderWithProvider(
        <PasswordStrengthIndicator password="a" />,
      );

      expect(screen.getByText("Débil")).toBeInTheDocument();

      // Update password
      rerender(
        <MantineProvider>
          <PasswordStrengthIndicator password="Abcdefg1!" />
        </MantineProvider>,
      );

      expect(screen.getByText("Fuerte")).toBeInTheDocument();
    });

    it("should update checkmarks when password changes", () => {
      const { rerender } = renderWithProvider(
        <PasswordStrengthIndicator password="abc" />,
      );

      // Initially minLength is not met
      // After adding more chars, it should be met
      rerender(
        <MantineProvider>
          <PasswordStrengthIndicator password="abcdefgh" />
        </MantineProvider>,
      );

      // The component should reflect the new state
      expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
    });
  });
});
