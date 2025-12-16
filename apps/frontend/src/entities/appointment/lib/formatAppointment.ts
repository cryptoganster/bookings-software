/**
 * Format Appointment Utility
 *
 * Funciones para formatear datos de citas para presentación
 */

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AppointmentReadModel } from "../model/types";

/**
 * Formatea la fecha y hora de una cita
 *
 * @param dateTime - String ISO 8601 de la fecha/hora
 * @returns Fecha formateada (ej: "Lun 18/12 - 10:30 AM")
 */
export function formatAppointmentDateTime(dateTime: string): string {
  const date = parseISO(dateTime);
  return format(date, "EEE dd/MM - h:mm a", { locale: es });
}

/**
 * Formatea solo la fecha de una cita
 *
 * @param dateTime - String ISO 8601 de la fecha/hora
 * @returns Fecha formateada (ej: "Lunes 18 de Diciembre")
 */
export function formatAppointmentDate(dateTime: string): string {
  const date = parseISO(dateTime);
  return format(date, "EEEE dd 'de' MMMM", { locale: es });
}

/**
 * Formatea solo la hora de una cita
 *
 * @param dateTime - String ISO 8601 de la fecha/hora
 * @returns Hora formateada (ej: "10:30 AM")
 */
export function formatAppointmentTime(dateTime: string): string {
  const date = parseISO(dateTime);
  return format(date, "h:mm a");
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
 * @returns Objeto con todos los campos formateados
 */
export function formatAppointmentSummary(appointment: AppointmentReadModel) {
  return {
    id: appointment.id,
    customerName: formatCustomerName(appointment),
    customerPhone: formatPhoneNumber(appointment.customerPhone),
    offeringName: appointment.offeringName,
    dateTime: formatAppointmentDateTime(appointment.dateTime),
    date: formatAppointmentDate(appointment.dateTime),
    time: formatAppointmentTime(appointment.dateTime),
    status: appointment.status,
  };
}
