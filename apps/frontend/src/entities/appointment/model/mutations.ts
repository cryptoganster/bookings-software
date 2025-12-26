/**
 * Appointment Mutation Hooks
 *
 * Este módulo define los mutation hooks de TanStack Query
 * para operaciones de escritura en appointments.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "./api";
import { appointmentKeys } from "./queries";

/**
 * Hook: useCancelAppointment
 *
 * Cancela un appointment
 *
 * @example
 * ```tsx
 * const { mutate: cancelAppointment, isPending } = useCancelAppointment();
 *
 * const handleCancel = () => {
 *   cancelAppointment(appointmentId, {
 *     onSuccess: () => {
 *       toast.success('Cita cancelada');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * };
 * ```
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: (_, id) => {
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      // Specifically invalidate the cancelled appointment
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
    },
  });
}
