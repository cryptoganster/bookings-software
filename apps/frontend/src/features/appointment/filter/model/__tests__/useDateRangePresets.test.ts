import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDateRangePresets } from "../useDateRangePresets";
import { useAppointmentFilters } from "../useAppointmentFilters";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
} from "../../lib/dateRangeCalculations";

describe("useDateRangePresets", () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAppointmentFilters());
    act(() => {
      result.current.reset();
    });
  });

  it("should initialize with preset 'custom'", () => {
    const { result } = renderHook(() => useDateRangePresets());

    expect(result.current.preset).toBe("custom");
  });

  it("should update store and calculate range when setPreset('today') is called", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    act(() => {
      hookResult.current.setPreset("today");
    });

    // Verify preset was updated in store
    expect(storeResult.current.dateRangePreset).toBe("today");

    // Verify dateRange was calculated and updated
    const expectedRange = getTodayRange();
    expect(storeResult.current.dateRange).toEqual(expectedRange);
  });

  it("should update store and calculate range when setPreset('week') is called", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    act(() => {
      hookResult.current.setPreset("week");
    });

    // Verify preset was updated in store
    expect(storeResult.current.dateRangePreset).toBe("week");

    // Verify dateRange was calculated and updated
    const expectedRange = getWeekRange();
    expect(storeResult.current.dateRange).toEqual(expectedRange);
  });

  it("should update store and calculate range when setPreset('month') is called", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    act(() => {
      hookResult.current.setPreset("month");
    });

    // Verify preset was updated in store
    expect(storeResult.current.dateRangePreset).toBe("month");

    // Verify dateRange was calculated and updated
    const expectedRange = getMonthRange();
    expect(storeResult.current.dateRange).toEqual(expectedRange);
  });

  it("should update store but not modify dateRange when setPreset('custom') is called", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    // First set a preset with a range
    act(() => {
      hookResult.current.setPreset("today");
    });

    const rangeAfterToday = storeResult.current.dateRange;
    expect(rangeAfterToday).not.toBeNull();

    // Now switch to custom
    act(() => {
      hookResult.current.setPreset("custom");
    });

    // Verify preset was updated
    expect(storeResult.current.dateRangePreset).toBe("custom");

    // Verify dateRange was NOT modified (still has the previous range)
    expect(storeResult.current.dateRange).toEqual(rangeAfterToday);
  });

  it("should return correct Spanish labels via getPresetLabel", () => {
    const { result } = renderHook(() => useDateRangePresets());

    expect(result.current.getPresetLabel("today")).toBe("Hoy");
    expect(result.current.getPresetLabel("week")).toBe("Semana");
    expect(result.current.getPresetLabel("month")).toBe("Mes");
    expect(result.current.getPresetLabel("custom")).toBe("Personalizado");
  });

  it("should clear previous dateRange when changing from 'custom' to another preset", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    // Start with custom preset and set a custom range
    const customRange: [Date, Date] = [
      new Date("2024-12-01"),
      new Date("2024-12-15"),
    ];

    act(() => {
      storeResult.current.setDateRange(customRange);
    });

    expect(storeResult.current.dateRange).toEqual(customRange);
    expect(storeResult.current.dateRangePreset).toBe("custom");

    // Change to 'today' preset
    act(() => {
      hookResult.current.setPreset("today");
    });

    // Verify the custom range was replaced with today's range
    const expectedTodayRange = getTodayRange();
    expect(storeResult.current.dateRange).toEqual(expectedTodayRange);
    expect(storeResult.current.dateRange).not.toEqual(customRange);
  });

  it("should return null from getPresetRange when preset is 'custom'", () => {
    const { result } = renderHook(() => useDateRangePresets());

    const range = result.current.getPresetRange("custom");

    expect(range).toBeNull();
  });

  it("should return correct ranges from getPresetRange for each preset", () => {
    const { result } = renderHook(() => useDateRangePresets());

    const todayRange = result.current.getPresetRange("today");
    const weekRange = result.current.getPresetRange("week");
    const monthRange = result.current.getPresetRange("month");

    expect(todayRange).toEqual(getTodayRange());
    expect(weekRange).toEqual(getWeekRange());
    expect(monthRange).toEqual(getMonthRange());
  });

  it("should maintain preset state across multiple renders", () => {
    const { result, rerender } = renderHook(() => useDateRangePresets());

    act(() => {
      result.current.setPreset("week");
    });

    expect(result.current.preset).toBe("week");

    // Rerender the hook
    rerender();

    // Preset should still be 'week'
    expect(result.current.preset).toBe("week");
  });

  it("should handle rapid preset changes correctly", () => {
    const { result: hookResult } = renderHook(() => useDateRangePresets());
    const { result: storeResult } = renderHook(() => useAppointmentFilters());

    act(() => {
      hookResult.current.setPreset("today");
      hookResult.current.setPreset("week");
      hookResult.current.setPreset("month");
    });

    // Final state should be 'month'
    expect(storeResult.current.dateRangePreset).toBe("month");
    expect(storeResult.current.dateRange).toEqual(getMonthRange());
  });
});
