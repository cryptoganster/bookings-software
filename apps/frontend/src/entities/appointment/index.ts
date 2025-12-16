/**
 * Appointment Entity - Public API
 *
 * Exporta componentes, hooks y utilidades de la entidad Appointment
 */

// UI Components
export { AppointmentCard } from "./ui/AppointmentCard";
export { AppointmentBadge } from "./ui/AppointmentBadge";

// Model
export type {
  AppointmentReadModel,
  AppointmentFilters,
  AppointmentStatus,
} from "./model/types";
export { appointmentKeys } from "./model/queries";
export { useAppointments, useAppointment } from "./model/queries";
export { appointmentsApi } from "./model/api";

// Utilities
export {
  formatAppointmentDateTime,
  formatAppointmentDate,
  formatAppointmentTime,
  formatCustomerName,
  formatPhoneNumber,
  formatAppointmentSummary,
} from "./lib/formatAppointment";
export { getStatusColor, getStatusLabel } from "./lib/getStatusColor";
