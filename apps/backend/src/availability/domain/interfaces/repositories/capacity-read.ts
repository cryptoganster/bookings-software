import { CapacityReadModel } from '@availability/domain/read-models/capacity';

export interface ICapacityReadRepository {
  findByOfferingAndDateRange(
    offeringId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CapacityReadModel[]>;

  findByOfferingAndDate(offeringId: string, date: Date): Promise<CapacityReadModel | null>;
}
