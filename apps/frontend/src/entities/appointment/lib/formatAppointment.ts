/**
 * Format Appointment Utility
 *
 * Funciones para formatear datos de citas para presentación
 * Todas las fechas se formatean en la zona horaria del negocio
 */

import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { AppointmentReadModel } from "../model/types";

/**
 * Formatea la fecha y hora de una cita en la zona horaria del negocio
 *
 * @param dateTime - String ISO 8601 de la fecha/hora (UTC)
 * @param timezone - IANA timezone del negocio (ej: "America/Santo_Domingo")
 * @returns Fecha formateada (ej: "Lun 18/12 - 10:30 AM")
 */
export function formatAppointmentDateTime(
  dateTime: string,
  timezone?: string,
): string {
  if (!timezone) {
    // Fallback to local timezone if business timezone not available
    const date = parseISO(dateTime);
    return format(date, "EEE dd/MM - h:mm a", { locale: es });
  }

  try {
    return formatInTimeZone(dateTime, timezone, "EEE dd/MM - h:mm a", {
      locale: es,
    });
  } catch {
    // Fallback to local timezone if timezone is invalid
    const date = parseISO(dateTime);
    return format(date, "EEE dd/MM - h:mm a", { locale: es });
  }
}

/**
 * Formatea solo la fecha de una cita en la zona horaria del negocio
 *
 * @param dateTime - String ISO 8601 de la fecha/hora (UTC)
 * @param timezone - IANA timezone del negocio (ej: "America/Santo_Domingo")
 * @returns Fecha formateada (ej: "Lunes 18 de Diciembre")
 */
export function formatAppointmentDate(
  dateTime: string,
  timezone?: string,
): string {
  if (!timezone) {
    // Fallback to local timezone if business timezone not available
    const date = parseISO(dateTime);
    return format(date, "EEEE dd 'de' MMMM", { locale: es });
  }

  try {
    return formatInTimeZone(dateTime, timezone, "EEEE dd 'de' MMMM", {
      locale: es,
    });
  } catch {
    // Fallback to local timezone if timezone is invalid
    const date = parseISO(dateTime);
    return format(date, "EEEE dd 'de' MMMM", { locale: es });
  }
}

/**
 * Formatea solo la hora de una cita en la zona horaria del negocio
 *
 * @param dateTime - String ISO 8601 de la fecha/hora (UTC)
 * @param timezone - IANA timezone del negocio (ej: "America/Santo_Domingo")
 * @returns Hora formateada (ej: "10:30 AM")
 */
export function formatAppointmentTime(
  dateTime: string,
  timezone?: string,
): string {
  if (!timezone) {
    // Fallback to local timezone if business timezone not available
    const date = parseISO(dateTime);
    return format(date, "h:mm a");
  }

  try {
    return formatInTimeZone(dateTime, timezone, "h:mm a");
  } catch {
    // Fallback to local timezone if timezone is invalid
    const date = parseISO(dateTime);
    return format(date, "h:mm a");
  }
}

/**
 * Formatea el nombre del cliente, manejando casos donde es null
 *
 * @param appointment - Cita con información del cliente
 * @returns Nombre del cliente o teléfono si no hay nombre
 */
export function formatCustomerName(appointment: AppointmentReadModel): string {
  return appointment.customerName || appointment.customerPhone;
}

/**
 * Formatea el teléfono del cliente en formato legible
 *
 * @param phone - Número de teléfono (ej: "+18095551234")
 * @returns Teléfono formateado (ej: "+1 809-555-1234")
 */
export function formatPhoneNumber(phone: string): string {
  // Asume formato +1XXXXXXXXXX
  if (phone.startsWith("+1") && phone.length === 12) {
    return `+1 ${phone.slice(2, 5)}-${phone.slice(5, 8)}-${phone.slice(8)}`;
  }
  return phone;
}

/**
 * Genera un resumen completo de la cita para mostrar
 *
 * @param appointment - Cita a formatear
 * @param timezone - IANA timezone del negocio (opcional)
 * @returns Objeto con todos los campos formateados
 */
export function formatAppointmentSummary(
  appointment: AppointmentReadModel,
  timezone?: string,
) {
  return {
    id: appointment.id,
    customerName: formatCustomerName(appointment),
    customerPhone: formatPhoneNumber(appointment.customerPhone),
    offeringName: appointment.offeringName,
    dateTime: formatAppointmentDateTime(appointment.dateTime, timezone),
    date: formatAppointmentDate(appointment.dateTime, timezone),
    time: formatAppointmentTime(appointment.dateTime, timezone),
    status: appointment.status,
  };
}
