import { OfferingReadModel } from '@offering/domain/read-models/offering';

export interface IOfferingReadRepository {
  findById(id: string): Promise<OfferingReadModel | null>;
  findByBusinessId(businessId: string): Promise<OfferingReadModel[]>;
  findActiveByBusinessId(businessId: string): Promise<OfferingReadModel[]>;
}
