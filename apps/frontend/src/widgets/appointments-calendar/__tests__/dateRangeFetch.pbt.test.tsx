/**
 * Property-Based Tests: Date Range Fetch Optimization
 *
 * Property 22: Date Range Fetch Optimization
 * Validates: Requirements 10.2
 *
 * Test that for any week W, API fetches only [W.start - 7 days, W.end + 7 days]
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, vi, beforeEach } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { addDays, startOfWeek, endOfWeek, startOfDay } from "date-fns";
import { useWeekAppointments } from "../model/useWeekAppointments";
import { apiClient } from "@shared/api/client";
import type { ReactNode } from "react";

// Mock apiClient
vi.mock("@shared/api/client");

describe("Property 22: Date Range Fetch Optimization", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test.prop(
    [
      fc.date({
        min: new Date(2024, 0, 1),
        max: new Date(2025, 11, 31),
      }),
    ],
    {
      numRuns: 100,
      verbose: true,
    },
  )(
    "should fetch appointments only for [weekStart - 7 days, weekEnd + 7 days]",
    async (randomDate) => {
      // Skip invalid dates
      if (isNaN(randomDate.getTime())) {
        return;
      }

      // Arrange: Calculate expected date range
      const weekStart = startOfWeek(randomDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(randomDate, { weekStartsOn: 1 });
      const expectedStartDate = startOfDay(addDays(weekStart, -7));
      const expectedEndDate = addDays(weekEnd, 7); // Keep end of day

      // Mock API response
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [],
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      // Act: Render hook with the random date's week
      const { result } = renderHook(
        () => useWeekAppointments([weekStart, weekEnd]),
        { wrapper },
      );

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: Verify API was called with correct date range
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: expectedStartDate.toISOString(),
            endDate: expectedEndDate.toISOString(),
          }),
        }),
      );

      // Verify the date range is exactly 21 days (7 before + 7 week + 7 after)
      const callParams = vi.mocked(apiClient.get).mock.calls[0][1]?.params;
      if (callParams?.startDate && callParams?.endDate) {
        const fetchedStart = new Date(callParams.startDate);
        const fetchedEnd = new Date(callParams.endDate);
        const daysDifference = Math.round(
          (fetchedEnd.getTime() - fetchedStart.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        // Should be approximately 21 days (7 + 7 + 7)
        expect(daysDifference).toBeGreaterThanOrEqual(20);
        expect(daysDifference).toBeLessThanOrEqual(22);
      }
    },
  );
});
