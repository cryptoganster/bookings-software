/**
 * Axe Accessibility Audit Tests
 *
 * Tests:
 * - OfferingForm no tiene violaciones de accesibilidad
 * - OfferingCreateModal no tiene violaciones
 * - OfferingEditModal no tiene violaciones
 *
 * Feature: offering-frontend-integration
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@/test/test-utils";
import { axe, toHaveNoViolations } from "jest-axe";
import { OfferingForm } from "../OfferingForm";
import { OfferingCreateModal } from "../OfferingCreateModal";
import { OfferingEditModal } from "../OfferingEditModal";
import type { OfferingDto } from "@packages/shared-types";

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

describe("Axe Accessibility Audit", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: OfferingForm no tiene violaciones de accesibilidad
   * Validates: Requirements 7.1, 7.2, 7.5
   */
  it("OfferingForm no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <OfferingForm
        offering={null}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: OfferingCreateModal no tiene violaciones
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4
   */
  it("OfferingCreateModal no tiene violaciones de accesibilidad", async () => {
    const { container } = render(
      <OfferingCreateModal opened={true} onClose={mockOnClose} />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  /**
   * Test: OfferingEditModal no tiene violaciones
   * Validates: Requirements 7.1, 7.2, 7.3, 7.4
   */
  it("OfferingEditModal no tiene violaciones de accesibilidad", async () => {
    const offering: OfferingDto = {
      id: "1",
      businessId: "business-1",
      name: "Test Service",
      duration: 30,
      maxCapacityPerSlot: 1,
      maxDailyCapacity: null,
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
    };

    const { container } = render(
      <OfferingEditModal
        opened={true}
        onClose={mockOnClose}
        offering={offering}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
