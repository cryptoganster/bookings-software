/**
 * useCancelAppointment Hook
 *
 * Hook de mutación para cancelar una cita con optimistic updates.
 *
 * Características:
 * - Optimistic update: actualiza UI inmediatamente
 * - Rollback automático en caso de error
 * - Invalidación de queries relacionadas en éxito
 * - Notificaciones de éxito/error
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { appointmentsApi } from "@entities/appointment/model/api";
import { appointmentKeys } from "@entities/appointment/model/queries";
import type { AppointmentReadModel } from "@entities/appointment/model/types";

/**
 * Hook para cancelar una cita
 *
 * Implementa optimistic update pattern:
 * 1. Guarda snapshot del estado actual
 * 2. Actualiza UI optimísticamente (marca como CANCELLED)
 * 3. Ejecuta la mutación en el servidor
 * 4. Si falla, hace rollback al snapshot
 * 5. Si tiene éxito, invalida queries relacionadas
 *
 * @example
 * ```tsx
 * const { mutate: cancelAppointment, isPending } = useCancelAppointment();
 *
 * const handleCancel = () => {
 *   cancelAppointment(appointmentId);
 * };
 * ```
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) =>
      appointmentsApi.cancel(appointmentId),

    // onMutate se ejecuta ANTES de la mutación
    // Aquí hacemos el optimistic update
    onMutate: async (appointmentId: string) => {
      // 1. Cancelar queries en progreso para evitar que sobrescriban nuestro optimistic update
      await queryClient.cancelQueries({
        queryKey: appointmentKeys.detail(appointmentId),
      });

      // 2. Guardar snapshot del estado actual (para rollback si falla)
      const previousAppointment =
        queryClient.getQueryData<AppointmentReadModel>(
          appointmentKeys.detail(appointmentId),
        );

      // 3. Optimistic update: actualizar la cita a CANCELLED
      if (previousAppointment) {
        queryClient.setQueryData<AppointmentReadModel>(
          appointmentKeys.detail(appointmentId),
          {
            ...previousAppointment,
            status: "CANCELLED",
          },
        );
      }

      // 4. También actualizar en listas (si la cita está en alguna lista cacheada)
      queryClient.setQueriesData<AppointmentReadModel[]>(
        { queryKey: appointmentKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((appointment) =>
            appointment.id === appointmentId
              ? { ...appointment, status: "CANCELLED" as const }
              : appointment,
          );
        },
      );

      // Retornar contexto para usar en onError (rollback)
      return { previousAppointment };
    },

    // onError se ejecuta si la mutación falla
    // Aquí hacemos rollback del optimistic update
    onError: (error, appointmentId, context) => {
      // Rollback: restaurar snapshot anterior
      if (context?.previousAppointment) {
        queryClient.setQueryData(
          appointmentKeys.detail(appointmentId),
          context.previousAppointment,
        );
      }

      // Mostrar notificación de error
      notifications.show({
        title: "Error al cancelar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cancelar la cita. Por favor intenta de nuevo.",
        color: "red",
      });
    },

    // onSuccess se ejecuta si la mutación tiene éxito
    onSuccess: () => {
      // Mostrar notificación de éxito
      notifications.show({
        title: "Cita cancelada",
        message: "La cita ha sido cancelada exitosamente.",
        color: "green",
      });
    },

    // onSettled se ejecuta siempre (éxito o error)
    // Aquí invalidamos queries para refetch desde el servidor
    onSettled: (_data, _error, appointmentId) => {
      // Invalidar query del detalle para refetch
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(appointmentId),
      });

      // Invalidar todas las listas para refetch
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.lists(),
      });

      // Invalidar upcoming appointments (dashboard)
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.upcoming(),
      });

      // Invalidar today appointments (dashboard)
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.today(),
      });
    },
  });
}
