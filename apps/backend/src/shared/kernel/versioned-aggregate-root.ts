import { AggregateRoot } from '@nestjs/cqrs';
import { AggregateVersion } from '@shared/vo/aggregate-version';

/**
 * Extiende AggregateRoot de NestJS CQRS agregando versioning para Optimistic Locking
 */
export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;
  private loadedVersion: AggregateVersion; // Versión cuando se cargó desde BD

  constructor() {
    super();
    this.version = new AggregateVersion(0);
    this.loadedVersion = new AggregateVersion(0);
    // autoCommit = true para publicar eventos automáticamente
    this.autoCommit = true;
  }

  getVersion(): AggregateVersion {
    return this.version;
  }

  /**
   * Retorna la versión que tenía el aggregate cuando fue cargado desde BD.
   * Esta es la versión que debe usarse en el WHERE del UPDATE para optimistic locking.
   */
  getLoadedVersion(): AggregateVersion {
    return this.loadedVersion;
  }

  protected incrementVersion(): void {
    this.version = this.version.increment();
  }

  /**
   * Reconstruye el aggregate con una versión específica (útil para hidratar desde BD)
   */
  protected setVersion(version: number): void {
    this.version = new AggregateVersion(version);
    this.loadedVersion = new AggregateVersion(version); // Guardar versión cargada
  }
}
