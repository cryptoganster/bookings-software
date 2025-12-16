/**
 * User Entity Query Keys
 *
 * Define las query keys para TanStack Query relacionadas con usuarios.
 * Sigue el patrón de query keys jerárquico para facilitar la invalidación.
 */

/**
 * Query keys para el entity User
 *
 * Estructura jerárquica:
 * - userKeys.all: ['users'] - Invalida todas las queries de usuarios
 * - userKeys.details(): ['users', 'detail'] - Invalida todos los detalles de usuarios
 * - userKeys.detail(id): ['users', 'detail', id] - Invalida un usuario específico
 *
 * Ejemplo de uso:
 * ```typescript
 * // En un query hook
 * useQuery({
 *   queryKey: userKeys.detail(userId),
 *   queryFn: () => userApi.getById(userId)
 * })
 *
 * // Para invalidar
 * queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
 * queryClient.invalidateQueries({ queryKey: userKeys.all }) // Invalida todo
 * ```
 */
export const userKeys = {
  /**
   * Base key para todas las queries de usuarios
   */
  all: ["users"] as const,

  /**
   * Key para queries de detalles de usuarios
   */
  details: () => [...userKeys.all, "detail"] as const,

  /**
   * Key para query de un usuario específico
   * @param id - ID del usuario
   */
  detail: (id: string) => [...userKeys.details(), id] as const,

  /**
   * Key para query del usuario actual (autenticado)
   */
  current: () => [...userKeys.all, "current"] as const,
} as const;
