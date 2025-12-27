/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please use the new test helpers from '@test-utils/helpers' instead:
 *
 * Migration guide:
 * - Import from: import { TestOfferingHelper } from '@test-utils/helpers';
 * - Use: const helper = new TestOfferingHelper(dataSource);
 * - Methods: helper.createOffering(), helper.createMultipleOfferings()
 *
 * See: apps/backend/src/test-utils/helpers/offering.ts (to be created)
 */

import { DataSource } from 'typeorm';
import { OfferingModel } from '@offering/infra/persistence/models/offering';
import { UUID } from '@shared/vo/uuid';

/**
 * Helper to create an active offering for E2E tests
 * @deprecated Use TestOfferingHelper from '@test-utils/helpers' instead
 */
export async function createActiveOffering(
  dataSource: DataSource,
  businessId: string,
  offeringId?: string,
  name: string = 'Corte de Pelo',
  duration: number = 30,
  maxCapacityPerSlot: number = 5,
): Promise<OfferingModel> {
  const offering = new OfferingModel();
  offering.id = offeringId || UUID.generate().getValue();
  offering.businessId = businessId;
  offering.name = name;
  offering.duration = duration;
  offering.maxCapacityPerSlot = maxCapacityPerSlot;
  offering.maxDailyCapacity = null;
  offering.isActive = true;

  await dataSource.getRepository(OfferingModel).save(offering);

  return offering;
}

/**
 * Helper to create multiple offerings for E2E tests
 * @deprecated Use TestOfferingHelper from '@test-utils/helpers' instead
 */
export async function createMultipleOfferings(
  dataSource: DataSource,
  businessId: string,
  count: number = 3,
): Promise<OfferingModel[]> {
  const offerings: OfferingModel[] = [];
  const names = ['Corte de Pelo', 'Lavado', 'Tinte', 'Manicure', 'Pedicure'];

  for (let i = 0; i < count; i++) {
    const offering = await createActiveOffering(
      dataSource,
      businessId,
      undefined,
      names[i] || `Servicio ${i + 1}`,
      30 + i * 15,
      5,
    );
    offerings.push(offering);
  }

  return offerings;
}
