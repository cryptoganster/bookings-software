import { AggregateRoot } from '@nestjs/cqrs';
import { AggregateVersion } from '@shared/vo/aggregate-version';

/**
 * Extiende AggregateRoot de NestJS CQRS agregando versioning para Optimistic Locking
 */
export abstract class VersionedAggregateRoot extends AggregateRoot {
  protected version: AggregateVersion;

  constructor() {
    super();
    this.version = new AggregateVersion(0);
    // autoCommit = true para publicar eventos automáticamente
    this.autoCommit = true;
  }

  getVersion(): AggregateVersion {
    return this.version;
  }

  protected incrementVersion(): void {
    this.version = this.version.increment();
  }

  /**
   * Reconstruye el aggregate con una versión específica (útil para hidratar desde BD)
   */
  protected setVersion(version: number): void {
    this.version = new AggregateVersion(version);
  }
}
