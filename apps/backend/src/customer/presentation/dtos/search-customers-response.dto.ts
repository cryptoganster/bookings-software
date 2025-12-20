import { CustomerReadModel } from '@packages/shared-types';

export class SearchCustomersResponseDto {
  customers!: CustomerReadModel[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}
