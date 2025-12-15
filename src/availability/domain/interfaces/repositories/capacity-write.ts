export interface ICapacityWriteRepository {
  findByOfferingAndDate(offeringId: string, date: Date): Promise<any>;
  save(capacity: any): Promise<void>;
}
