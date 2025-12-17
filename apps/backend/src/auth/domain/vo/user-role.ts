/**
 * UserRole Enum
 *
 * Define los roles disponibles para usuarios en el sistema.
 * Un User puede tener múltiples roles simultáneamente (marketplace).
 *
 * @requirements 1.1, 5.1
 */
export enum UserRole {
  /**
   * Dueño de negocio - puede administrar negocios, offerings, horarios
   */
  BUSINESS_OWNER = 'BUSINESS_OWNER',

  /**
   * Cliente - puede agendar citas, ver historial
   */
  CUSTOMER = 'CUSTOMER',

  /**
   * Administrador del sistema - acceso completo
   */
  ADMIN = 'ADMIN',
}

/**
 * Array de todos los roles válidos para validación
 */
export const ALL_USER_ROLES: UserRole[] = Object.values(UserRole);

/**
 * Verifica si un string es un UserRole válido
 */
export function isValidUserRole(value: string): value is UserRole {
  return ALL_USER_ROLES.includes(value as UserRole);
}
