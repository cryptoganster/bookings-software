/**
 * Appointments Calendar Widget - Public API
 *
 * Exports components, hooks, and types for the appointments calendar widget
 */

// Main Component
export { AppointmentsCalendar } from "./ui/AppointmentsCalendar";

// UI Components
export { WeekView } from "./ui/WeekView";
export { DayColumn } from "./ui/DayColumn";
export { AppointmentSlot } from "./ui/AppointmentSlot";

// Model
export { useWeekAppointments } from "./model/useWeekAppointments";
export { useCalendarNavigation } from "./model/useCalendarNavigation";
export type {
  ViewMode,
  WeekRange,
  DayAppointments,
  CalendarFilters,
} from "./model/types";
