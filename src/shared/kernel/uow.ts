export interface IUnitOfWork {
  /**
   * Inicia una transacción y ejecuta la función dentro de ella
   * @param work Función a ejecutar dentro de la transacción
   * @param options Opciones de transacción (isolation level, etc.)
   */
  transaction<T>(work: () => Promise<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Obtiene el query runner actual (para uso avanzado)
   */
  getQueryRunner(): unknown;
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}
