/**
 * Test: Offering Entity Index Exports
 * Verifica que todos los exports públicos estén disponibles
 */

import { describe, it, expect } from "vitest";
import * as OfferingEntity from "../index";

describe("Offering Entity - Public API", () => {
  it("should export hooks", () => {
    expect(OfferingEntity.useOfferings).toBeDefined();
    expect(OfferingEntity.useCreateOffering).toBeDefined();
    expect(OfferingEntity.useUpdateOffering).toBeDefined();
    expect(OfferingEntity.useDeleteOffering).toBeDefined();
    expect(OfferingEntity.useToggleOfferingActive).toBeDefined();
  });

  it("should export query keys", () => {
    expect(OfferingEntity.offeringKeys).toBeDefined();
  });

  it("should export validation schema", () => {
    expect(OfferingEntity.offeringFormSchema).toBeDefined();
  });

  it("should export default values", () => {
    expect(OfferingEntity.defaultOfferingValues).toBeDefined();
  });
});
