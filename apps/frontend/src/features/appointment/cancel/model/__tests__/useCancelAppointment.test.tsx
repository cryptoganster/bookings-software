import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
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

describe("useCancelAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should perform optimistic update", async () => {
    const mockAppointment: AppointmentReadModel = {
      id: "appointment-1",
      businessId: "business-1",
      customerId: "customer-1",
      customerName: "Juan Pérez",
      customerPhone: "+18095551234",
      offeringId: "offering-1",
      offeringName: "Corte de Pelo",
      dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
      status: "CONFIRMED",
      createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
      cancelledAt: null,
    };

    vi.mocked(appointmentsApi.cancel).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();

    // Set initial data in cache
    queryClient.setQueryData(
      appointmentKeys.detail(mockAppointment.id),
      mockAppointment,
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    // Execute mutation
    result.current.mutate(mockAppointment.id);

    // Verify optimistic update happened immediately
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<AppointmentReadModel>(
        appointmentKeys.detail(mockAppointment.id),
      );
      expect(cachedData?.status).toBe("CANCELLED");
    });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("should rollback on error", async () => {
    const mockAppointment: AppointmentReadModel = {
      id: "appointment-1",
      businessId: "business-1",
      customerId: "customer-1",
      customerName: "Juan Pérez",
      customerPhone: "+18095551234",
      offeringId: "offering-1",
      offeringName: "Corte de Pelo",
      dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
      status: "CONFIRMED",
      createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
      cancelledAt: null,
    };

    const mockError = new Error("Failed to cancel appointment");
    vi.mocked(appointmentsApi.cancel).mockRejectedValue(mockError);

    const { queryClient, wrapper } = createWrapper();

    // Set initial data in cache
    queryClient.setQueryData(
      appointmentKeys.detail(mockAppointment.id),
      mockAppointment,
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    // Execute mutation
    result.current.mutate(mockAppointment.id);

    // Wait for mutation to fail
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Verify rollback happened - data should be back to CONFIRMED
    const cachedData = queryClient.getQueryData<AppointmentReadModel>(
      appointmentKeys.detail(mockAppointment.id),
    );
    expect(cachedData?.status).toBe("CONFIRMED");
  });

  it("should invalidate queries on success", async () => {
    const mockAppointment: AppointmentReadModel = {
      id: "appointment-1",
      businessId: "business-1",
      customerId: "customer-1",
      customerName: "Juan Pérez",
      customerPhone: "+18095551234",
      offeringId: "offering-1",
      offeringName: "Corte de Pelo",
      dateTime: new Date("2024-12-20T10:00:00Z").toISOString(),
      status: "CONFIRMED",
      createdAt: new Date("2024-12-15T10:00:00Z").toISOString(),
      cancelledAt: null,
    };

    vi.mocked(appointmentsApi.cancel).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();

    // Set initial data in cache
    queryClient.setQueryData(
      appointmentKeys.detail(mockAppointment.id),
      mockAppointment,
    );

    // Spy on invalidateQueries
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    // Execute mutation
    result.current.mutate(mockAppointment.id);

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify queries were invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.detail(mockAppointment.id),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.lists(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.upcoming(),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.today(),
    });
  });
});
