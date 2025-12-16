import { Offering } from '@offering/domain/aggregates/offering';
import { UUID } from '@shared/vo/uuid';

export interface IOfferingWriteRepository {
  save(offering: Offering): Promise<void>;
  findById(id: UUID): Promise<Offering | null>;
  findByBusinessIdAndName(businessId: UUID, name: string): Promise<Offering | null>;
}
