/**
 * Appointment Entity - Public API
 * 
 * Este módulo expone la API pública de la entidad Appointment.
 * Siguiendo el patrón Public API de Feature-Sliced Design.
 */

export type {
  AppointmentReadModel,
  AppointmentFilters,
  AppointmentFiltersApi,
  AppointmentStatus,
} from './model/types';

export {
  appointmentKeys,
  useAppointments,
  useAppointment,
  useUpcomingAppointments,
  useTodayAppointments,
} from './model/queries';

export { appointmentsApi } from './model/api';
