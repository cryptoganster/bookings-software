import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Convierte una fecha UTC a una zona horaria específica
 * @param date - Fecha en UTC (Date, string ISO, o timestamp)
 * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
 * @returns Fecha en la zona horaria especificada
 */
export function convertToTimezone(
  date: Date | string | number,
  timezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return toZonedTime(dateObj, timezone);
}

/**
 * Convierte una fecha de una zona horaria específica a UTC
 * @param date - Fecha en zona horaria local (Date, string ISO, o timestamp)
 * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
 * @returns Fecha en UTC
 */
export function convertFromTimezone(
  date: Date | string | number,
  timezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return fromZonedTime(dateObj, timezone);
}

/**
 * Formatea una fecha en una zona horaria específica
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
 * @param formatStr - Formato deseado (default: 'yyyy-MM-dd HH:mm:ss zzz')
 * @returns Fecha formateada en la zona horaria especificada
 */
export function formatInTimezone(
  date: Date | string | number,
  timezone: string,
  formatStr: string = 'yyyy-MM-dd HH:mm:ss zzz'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(dateObj, formatStr, { timeZone: timezone });
}

/**
 * Obtiene la zona horaria del navegador del usuario
 * @returns Zona horaria IANA del navegador
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Obtiene el offset de una zona horaria en minutos
 * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
 * @param date - Fecha para calcular el offset (default: ahora)
 * @returns Offset en minutos
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date()
): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
}

/**
 * Verifica si una fecha está en horario de verano (DST)
 * @param date - Fecha a verificar (Date, string ISO, o timestamp)
 * @param timezone - Zona horaria IANA (ej: 'America/Santo_Domingo')
 * @returns true si está en horario de verano
 */
export function isDaylightSavingTime(
  date: Date | string | number,
  timezone: string
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  // Obtener offset en enero (invierno) y julio (verano)
  const january = new Date(dateObj.getFullYear(), 0, 1);
  const july = new Date(dateObj.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffset(timezone, january);
  const julOffset = getTimezoneOffset(timezone, july);
  const currentOffset = getTimezoneOffset(timezone, dateObj);
  
  // Si el offset actual es diferente al de invierno, está en DST
  return Math.max(janOffset, julOffset) === currentOffset;
}

/**
 * Convierte una fecha del servidor (UTC) a la zona horaria del usuario
 * @param serverDate - Fecha del servidor en UTC (Date, string ISO, o timestamp)
 * @returns Fecha en la zona horaria del usuario
 */
export function serverToUserTimezone(
  serverDate: Date | string | number
): Date {
  const userTimezone = getUserTimezone();
  return convertToTimezone(serverDate, userTimezone);
}

/**
 * Convierte una fecha de la zona horaria del usuario a UTC para enviar al servidor
 * @param userDate - Fecha en zona horaria del usuario (Date, string ISO, o timestamp)
 * @returns Fecha en UTC
 */
export function userToServerTimezone(
  userDate: Date | string | number
): Date {
  const userTimezone = getUserTimezone();
  return convertFromTimezone(userDate, userTimezone);
}
