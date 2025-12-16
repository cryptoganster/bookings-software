/**
 * Get Status Color Utility
 * 
 * Retorna el color de Mantine apropiado para cada estado de cita
 */

import type { AppointmentStatus } from '../model/types';

/**
 * Mapea el status de una cita a un color de Mantine
 * 
 * @param status - Estado de la cita
 * @returns Color de Mantine para usar en Badge, Text, etc.
 */
export function getStatusColor(status: AppointmentStatus): string {
  const colorMap: Record<AppointmentStatus, string> = {
    CONFIRMED: 'green',
    CANCELLED: 'red',
    COMPLETED: 'blue',
  };

  return colorMap[status];
}

/**
 * Obtiene el label en español para un status
 * 
 * @param status - Estado de la cita
 * @returns Label en español
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labelMap: Record<AppointmentStatus, string> = {
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
  };

  return labelMap[status];
}
