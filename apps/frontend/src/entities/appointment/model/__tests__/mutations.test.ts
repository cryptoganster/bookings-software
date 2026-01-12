/**
 * Tests for Appointment Mutations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCancelAppointment } from "../mutations";
import { appointmentsApi } from "../api";
import { appointmentKeys } from "../queries";
import { createElement } from "react";

vi.mock("../api");

describe("useCancelAppointment", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  it("should cancel appointment successfully", async () => {
    vi.mocked(appointmentsApi.cancel).mockResolvedValue();

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    result.current.mutate("apt-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(appointmentsApi.cancel).toHaveBeenCalledWith("apt-1");
  });

  it("should invalidate appointment queries on success", async () => {
    vi.mocked(appointmentsApi.cancel).mockResolvedValue();

    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    result.current.mutate("apt-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.all,
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: appointmentKeys.detail("apt-1"),
    });
  });

  it("should handle cancellation error", async () => {
    const error = new Error("Cancellation failed");
    vi.mocked(appointmentsApi.cancel).mockRejectedValue(error);

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    result.current.mutate("apt-1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it("should track loading state", async () => {
    vi.mocked(appointmentsApi.cancel).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    expect(result.current.isPending).toBe(false);

    result.current.mutate("apt-1");

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it("should support onSuccess callback", async () => {
    vi.mocked(appointmentsApi.cancel).mockResolvedValue();

    const onSuccess = vi.fn();

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    result.current.mutate("apt-1", { onSuccess });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should support onError callback", async () => {
    const error = new Error("Cancellation failed");
    vi.mocked(appointmentsApi.cancel).mockRejectedValue(error);

    const onError = vi.fn();

    const { result } = renderHook(() => useCancelAppointment(), { wrapper });

    result.current.mutate("apt-1", { onError });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // TanStack Query v5 passes additional context as 4th parameter
    expect(onError).toHaveBeenCalledWith(
      error,
      "apt-1",
      undefined,
      expect.any(Object),
    );
  });
});
