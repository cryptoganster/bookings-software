/**
 * AppointmentBadge Component
 * 
 * Badge para mostrar el estado de una cita con color apropiado
 */

import { Badge } from '@mantine/core';
import type { AppointmentStatus } from '../model/types';
import { getStatusColor, getStatusLabel } from '../lib/getStatusColor';

interface AppointmentBadgeProps {
  status: AppointmentStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'filled' | 'light' | 'outline' | 'dot';
}

/**
 * Badge que muestra el estado de una cita
 * 
 * @example
 * ```tsx
 * <AppointmentBadge status="CONFIRMED" />
 * <AppointmentBadge status="CANCELLED" variant="light" />
 * ```
 */
export function AppointmentBadge({ 
  status, 
  size = 'sm',
  variant = 'light' 
}: AppointmentBadgeProps) {
  return (
    <Badge 
      color={getStatusColor(status)} 
      size={size}
      variant={variant}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}
