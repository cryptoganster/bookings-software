/**
 * Property-Based Tests: Navigation Cache Utilization
 *
 * Property 23: Navigation Cache Utilization
 * Validates: Requirements 10.3
 *
 * Test that navigating W → W+1 → W uses cached data for second W visit
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, expect, vi, beforeEach } from "vitest";
import { fc, test } from "@fast-check/vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { useWeekAppointments } from "../model/useWeekAppointments";
import { apiClient } from "@shared/api/client";
import type { ReactNode } from "react";

// Mock apiClient
vi.mock("@shared/api/client");

describe("Property 23: Navigation Cache Utilization", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Configure QueryClient with same caching settings as production
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 30000, // 30 seconds - same as production
          gcTime: 300000, // 5 minutes - same as production
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
    "should use cached data when navigating back to previously visited week",
    async (randomDate) => {
      // Skip invalid dates
      if (isNaN(randomDate.getTime())) {
        return;
      }

      // Arrange: Calculate week W and week W+1
      const weekWStart = startOfWeek(randomDate, { weekStartsOn: 1 });
      const weekWEnd = endOfWeek(randomDate, { weekStartsOn: 1 });
      const weekW: [Date, Date] = [weekWStart, weekWEnd];

      const weekW1Start = addWeeks(weekWStart, 1);
      const weekW1End = addWeeks(weekWEnd, 1);
      const weekW1: [Date, Date] = [weekW1Start, weekW1End];

      // Mock API response
      const mockResponse = {
        data: [],
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act 1: Navigate to week W (initial render)
      const { result, rerender } = renderHook(
        ({ weekRange }: { weekRange: [Date, Date] }) =>
          useWeekAppointments(weekRange),
        {
          wrapper,
          initialProps: { weekRange: weekW },
        },
      );

      // Wait for initial query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: API should be called for week W
      expect(apiClient.get).toHaveBeenCalledTimes(1);

      // Act 2: Navigate to week W+1
      rerender({ weekRange: weekW1 });

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: API should be called for week W+1
      expect(apiClient.get).toHaveBeenCalledTimes(2);
      const secondCallCount = vi.mocked(apiClient.get).mock.calls.length;

      // Act 3: Navigate back to week W
      rerender({ weekRange: weekW });

      // Wait for query to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Assert: API should NOT be called again (uses cached data)
      // The call count should remain the same as after step 2
      const thirdCallCount = vi.mocked(apiClient.get).mock.calls.length;
      expect(thirdCallCount).toBe(secondCallCount);

      // Verify that data is still available (from cache)
      expect(result.current.data).toBeDefined();
      expect(result.current.appointmentsByDay).toBeDefined();

      // Verify the query is not in loading state (immediate cache hit)
      expect(result.current.isLoading).toBe(false);
    },
  );
});
