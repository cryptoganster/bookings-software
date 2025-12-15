/**
 * Application Constants
 * Centralized definition of application-wide constants
 */

/**
 * Time constants
 */
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Query stale times (for TanStack Query)
 */
export const STALE_TIME = {
  SHORT: 1 * TIME.MINUTE,
  MEDIUM: 5 * TIME.MINUTE,
  LONG: 15 * TIME.MINUTE,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Appointment status labels
 */
export const APPOINTMENT_STATUS_LABELS = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
} as const;

/**
 * Appointment status colors (for Mantine)
 */
export const APPOINTMENT_STATUS_COLORS = {
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'gray',
} as const;

/**
 * Days of week
 */
export const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
 * Date format patterns
 */
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'EEEE, dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
} as const;

/**
 * Notification durations (in milliseconds)
 */
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  THEME: 'theme-preference',
  LANGUAGE: 'language-preference',
} as const;

/**
 * API retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Form validation rules
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_DURATION_MINUTES: 15,
  MAX_DURATION_MINUTES: 480,
} as const;
