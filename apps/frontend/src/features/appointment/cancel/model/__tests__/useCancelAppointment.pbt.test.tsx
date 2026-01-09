/**
 * Property-Based Tests for useCancelAppointment Hook
 *
 * Property 14: Optimistic Update Consistency
 * Validates: Requirements 5.4, 10.4
 *
 * Tests that cancelled appointment updates immediately before API response
 */

import { describe, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { fc, test } from "@fast-check/vitest";
import { useCancelAppointment } from "../useCancelAppointment";
import { appointmentsApi } from "@entities/appointment/model/api";
import { appointmentKeys } from "@entities/appointment/model/queries";
import type { AppointmentReadModel } from "@entities/appointment/model/types";

// Mock dependencies
vi.mock("@entities/appointment/model/api");
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
};

// Arbitrary for generating valid appointment data
const appointmentArbitrary = fc.record({
  id: fc.uuid(),
  businessId: fc.uuid(),
  customerId: fc.uuid(),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  customerPhone: fc.string({ minLength: 10, maxLength: 15 }),
  offeringId: fc.uuid(),
  offeringName: fc.string({ minLength: 1, maxLength: 50 }),
  dateTime: fc
    .date({ min: new Date("2024-01-01"), max: new Date("2025-12-31") })
    .filter((d) => !isNaN(d.getTime())) // Filter out invalid dates
    .map((d) => d.toISOString()),
  status: fc.constant("CONFIRMED" as const),
  createdAt: fc
    .date({ min: new Date("2023-01-01"), max: new Date("2024-12-31") })
    .filter((d) => !isNaN(d.getTime())) // Filter out invalid dates
    .map((d) => d.toISOString()),
  cancelledAt: fc.constant(null),
});

describe("useCancelAppointment - Property-Based Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Property 14: Optimistic Update Consistency", () => {
    test.prop([appointmentArbitrary])(
      "should update appointment status to CANCELLED immediately before API response",
      async (appointment: AppointmentReadModel) => {
        // Setup: Mock API with delay to simulate network latency
        let apiResolve: (() => void) | null = null;
        const apiPromise = new Promise<void>((resolve) => {
          apiResolve = resolve;
        });

        vi.mocked(appointmentsApi.cancel).mockReturnValue(apiPromise);

        const { queryClient, wrapper } = createWrapper();

        // Set initial data in cache
        queryClient.setQueryData(
          appointmentKeys.detail(appointment.id),
          appointment,
        );

        const { result } = renderHook(() => useCancelAppointment(), {
          wrapper,
        });

        // Execute mutation
        result.current.mutate(appointment.id);

        // Property: Status should be CANCELLED immediately (before API resolves)
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<AppointmentReadModel>(
            appointmentKeys.detail(appointment.id),
          );
          expect(cachedData?.status).toBe("CANCELLED");
        });

        // Verify API hasn't resolved yet
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isPending).toBe(true);

        // Now resolve the API
        apiResolve!();

        // Wait for mutation to complete
        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Property: Status should still be CANCELLED after API resolves
        const finalData = queryClient.getQueryData<AppointmentReadModel>(
          appointmentKeys.detail(appointment.id),
        );
        expect(finalData?.status).toBe("CANCELLED");
      },
    );

    test.prop([appointmentArbitrary])(
      "should preserve all other appointment fields during optimistic update",
      async (appointment: AppointmentReadModel) => {
        // Setup: Mock API with delay
        let apiResolve: (() => void) | null = null;
        const apiPromise = new Promise<void>((resolve) => {
          apiResolve = resolve;
        });

        vi.mocked(appointmentsApi.cancel).mockReturnValue(apiPromise);

        const { queryClient, wrapper } = createWrapper();

        // Set initial data in cache
        queryClient.setQueryData(
          appointmentKeys.detail(appointment.id),
          appointment,
        );

        const { result } = renderHook(() => useCancelAppointment(), {
          wrapper,
        });

        // Execute mutation
        result.current.mutate(appointment.id);

        // Property: All fields except status should remain unchanged
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<AppointmentReadModel>(
            appointmentKeys.detail(appointment.id),
          );

          expect(cachedData?.id).toBe(appointment.id);
          expect(cachedData?.businessId).toBe(appointment.businessId);
          expect(cachedData?.customerId).toBe(appointment.customerId);
          expect(cachedData?.customerName).toBe(appointment.customerName);
          expect(cachedData?.customerPhone).toBe(appointment.customerPhone);
          expect(cachedData?.offeringId).toBe(appointment.offeringId);
          expect(cachedData?.offeringName).toBe(appointment.offeringName);
          expect(cachedData?.dateTime).toBe(appointment.dateTime);
          expect(cachedData?.createdAt).toBe(appointment.createdAt);
          expect(cachedData?.cancelledAt).toBe(appointment.cancelledAt);
          // Only status should change
          expect(cachedData?.status).toBe("CANCELLED");
        });

        // Resolve API
        apiResolve!();

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });
      },
    );

    test.prop([appointmentArbitrary])(
      "should update appointment in list queries optimistically",
      async (appointment: AppointmentReadModel) => {
        // Setup: Mock API with delay
        let apiResolve: (() => void) | null = null;
        const apiPromise = new Promise<void>((resolve) => {
          apiResolve = resolve;
        });

        vi.mocked(appointmentsApi.cancel).mockReturnValue(apiPromise);

        const { queryClient, wrapper } = createWrapper();

        // Set initial data in cache (both detail and list)
        queryClient.setQueryData(
          appointmentKeys.detail(appointment.id),
          appointment,
        );
        queryClient.setQueryData(appointmentKeys.lists(), [appointment]);

        const { result } = renderHook(() => useCancelAppointment(), {
          wrapper,
        });

        // Execute mutation
        result.current.mutate(appointment.id);

        // Property: Appointment in list should also be updated optimistically
        await waitFor(() => {
          const listData = queryClient.getQueryData<AppointmentReadModel[]>(
            appointmentKeys.lists(),
          );
          const updatedAppointment = listData?.find(
            (a) => a.id === appointment.id,
          );
          expect(updatedAppointment?.status).toBe("CANCELLED");
        });

        // Verify API hasn't resolved yet
        expect(result.current.isPending).toBe(true);

        // Resolve API
        apiResolve!();

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });
      },
    );

    test.prop([appointmentArbitrary])(
      "should rollback optimistic update on API error",
      async (appointment: AppointmentReadModel) => {
        // Setup: Mock API to reject with delay
        let apiReject: ((error: Error) => void) | null = null;
        const apiPromise = new Promise<void>((_resolve, reject) => {
          apiReject = reject;
        });

        vi.mocked(appointmentsApi.cancel).mockReturnValue(apiPromise);

        const { queryClient, wrapper } = createWrapper();

        // Set initial data in cache
        queryClient.setQueryData(
          appointmentKeys.detail(appointment.id),
          appointment,
        );

        const { result } = renderHook(() => useCancelAppointment(), {
          wrapper,
        });

        // Execute mutation
        result.current.mutate(appointment.id);

        // Wait for optimistic update
        await waitFor(() => {
          const cachedData = queryClient.getQueryData<AppointmentReadModel>(
            appointmentKeys.detail(appointment.id),
          );
          expect(cachedData?.status).toBe("CANCELLED");
        });

        // Now reject the API
        const mockError = new Error("API Error");
        apiReject!(mockError);

        // Wait for mutation to fail
        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        // Property: Status should be rolled back to original value
        const rolledBackData = queryClient.getQueryData<AppointmentReadModel>(
          appointmentKeys.detail(appointment.id),
        );
        expect(rolledBackData?.status).toBe(appointment.status);
        expect(rolledBackData).toEqual(appointment);
      },
    );
  });
});
