import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Formatea una fecha en formato legible
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @param formatStr - Formato deseado (default: 'dd/MM/yyyy')
 * @returns Fecha formateada como string
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = "dd/MM/yyyy",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Formatea una hora en formato legible
 * @param date - Fecha/hora a formatear (Date, string ISO, o timestamp)
 * @param formatStr - Formato deseado (default: 'HH:mm')
 * @returns Hora formateada como string
 */
export function formatTime(
  date: Date | string | number,
  formatStr: string = "HH:mm",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Formatea fecha y hora juntas
 * @param date - Fecha/hora a formatear (Date, string ISO, o timestamp)
 * @param formatStr - Formato deseado (default: 'dd/MM/yyyy HH:mm')
 * @returns Fecha y hora formateadas como string
 */
export function formatDateTime(
  date: Date | string | number,
  formatStr: string = "dd/MM/yyyy HH:mm",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Formatea una fecha en formato relativo (ej: "hace 2 horas", "en 3 días")
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Fecha en formato relativo
 */
export function formatRelativeDate(date: Date | string | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  const now = new Date();
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffInMinutes) < 1) {
    return "ahora";
  }

  if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0
      ? `en ${diffInMinutes} minuto${diffInMinutes !== 1 ? "s" : ""}`
      : `hace ${Math.abs(diffInMinutes)} minuto${Math.abs(diffInMinutes) !== 1 ? "s" : ""}`;
  }

  if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0
      ? `en ${diffInHours} hora${diffInHours !== 1 ? "s" : ""}`
      : `hace ${Math.abs(diffInHours)} hora${Math.abs(diffInHours) !== 1 ? "s" : ""}`;
  }

  return diffInDays > 0
    ? `en ${diffInDays} día${diffInDays !== 1 ? "s" : ""}`
    : `hace ${Math.abs(diffInDays)} día${Math.abs(diffInDays) !== 1 ? "s" : ""}`;
}

/**
 * Formatea una fecha en formato de día de la semana
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Día de la semana (ej: "Lunes", "Martes")
 */
export function formatDayOfWeek(date: Date | string | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, "EEEE", { locale: es });
}

/**
 * Formatea una fecha en formato de mes y año
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @returns Mes y año (ej: "Diciembre 2024")
 */
export function formatMonthYear(date: Date | string | number): string {
  const dateObj = typeof date === "string" ? parseISO(date) : new Date(date);
  return format(dateObj, "MMMM yyyy", { locale: es });
}
