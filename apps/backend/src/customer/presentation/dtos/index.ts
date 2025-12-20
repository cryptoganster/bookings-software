/**
 * Customer BC - DTOs Barrel Export
 *
 * Centralized export point for all DTOs used in the Customer BC presentation layer.
 * This allows clean imports like: import { SearchCustomersDto } from '@customer/presentation/dtos';
 */

// Request DTOs
export { SearchCustomersDto } from './search-customer';
export { MergeCustomersDto } from './merge-customer';
export { DetectDuplicatesDto } from './detect-duplicates';

// Response DTOs
export {
  MessageResponseDto,
  SearchCustomersResponseDto,
  CustomerStatsResponseDto,
  DuplicatePairsResponseDto,
} from './response-types';
