import { Offering } from '../offering';
import { UUID } from '@shared/vo/uuid';
import { OfferingDuration } from '../../vo/offering-duration';
import { InvalidOfferingCapacityException } from '../../exceptions/invalid-offering-capacity';
import { InvalidOfferingDurationException } from '../../exceptions/invalid-offering-duration';

describe('Offering Aggregate', () => {
  let offeringId: UUID;
  let businessId: UUID;
  let validDuration: OfferingDuration;

  beforeEach(() => {
    offeringId = UUID.generate();
    businessId = UUID.generate();
    validDuration = OfferingDuration.fromMinutes(30); // 30 minutes
  });

  describe('create', () => {
    it('should create offering with version 1', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      expect(offering.getVersion().getValue()).toBe(1);
      expect(offering.getId().getValue()).toBe(offeringId.getValue());
      expect(offering.isActiveOffering()).toBe(true);
    });

    it('should create offering with all attributes correctly set', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      expect(offering.getId().getValue()).toBe(offeringId.getValue());
      expect(offering.getBusinessId().getValue()).toBe(businessId.getValue());
      expect(offering.getName()).toBe('Corte de Pelo');
      expect(offering.getDuration().getMinutes()).toBe(30);
      expect(offering.getMaxCapacityPerSlot()).toBe(4);
      expect(offering.getMaxDailyCapacity()).toBe(20);
      expect(offering.isActiveOffering()).toBe(true);
    });

    it('should create offering with null maxDailyCapacity', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        null,
      );

      expect(offering.getMaxDailyCapacity()).toBeNull();
    });

    it('should throw InvalidOfferingCapacityException when maxCapacityPerSlot < 1', () => {
      expect(() => {
        Offering.create(
          offeringId,
          businessId,
          'Corte de Pelo',
          validDuration,
          0,
          20,
        );
      }).toThrow(InvalidOfferingCapacityException);

      expect(() => {
        Offering.create(
          offeringId,
          businessId,
          'Corte de Pelo',
          validDuration,
          0,
          20,
        );
      }).toThrow('maxCapacityPerSlot must be at least 1');
    });

    it('should throw InvalidOfferingCapacityException when maxDailyCapacity < maxCapacityPerSlot', () => {
      expect(() => {
        Offering.create(
          offeringId,
          businessId,
          'Corte de Pelo',
          validDuration,
          10,
          5, // Less than maxCapacityPerSlot
        );
      }).toThrow(InvalidOfferingCapacityException);

      expect(() => {
        Offering.create(
          offeringId,
          businessId,
          'Corte de Pelo',
          validDuration,
          10,
          5,
        );
      }).toThrow('maxDailyCapacity must be greater than or equal to maxCapacityPerSlot');
    });

    it('should throw error when duration is invalid', () => {
      expect(() => {
        OfferingDuration.fromMinutes(20); // Not multiple of 15
      }).toThrow('Duration must be a multiple of 15 minutes');

      expect(() => {
        OfferingDuration.fromMinutes(500); // Exceeds max (480)
      }).toThrow('Duration cannot exceed 480 minutes');

      expect(() => {
        OfferingDuration.fromMinutes(10); // Below minimum
      }).toThrow('Duration must be at least 15 minutes');
    });
  });

  describe('update', () => {
    it('should increment version when updated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      const initialVersion = offering.getVersion().getValue();
      const newDuration = OfferingDuration.fromMinutes(45);

      offering.update('Corte Premium', newDuration, 5, 25);

      expect(offering.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should update all attributes correctly', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      const newDuration = OfferingDuration.fromMinutes(45);
      offering.update('Corte Premium', newDuration, 5, 25);

      expect(offering.getName()).toBe('Corte Premium');
      expect(offering.getDuration().getMinutes()).toBe(45);
      expect(offering.getMaxCapacityPerSlot()).toBe(5);
      expect(offering.getMaxDailyCapacity()).toBe(25);
    });

    it('should preserve id and businessId when updated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      const originalId = offering.getId().getValue();
      const originalBusinessId = offering.getBusinessId().getValue();

      const newDuration = OfferingDuration.fromMinutes(45);
      offering.update('Corte Premium', newDuration, 5, 25);

      expect(offering.getId().getValue()).toBe(originalId);
      expect(offering.getBusinessId().getValue()).toBe(originalBusinessId);
    });

    it('should throw InvalidOfferingCapacityException when maxCapacityPerSlot < 1', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      expect(() => {
        offering.update('Corte Premium', validDuration, 0, 20);
      }).toThrow(InvalidOfferingCapacityException);
    });

    it('should throw InvalidOfferingCapacityException when maxDailyCapacity < maxCapacityPerSlot', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      expect(() => {
        offering.update('Corte Premium', validDuration, 10, 5);
      }).toThrow(InvalidOfferingCapacityException);
    });
  });

  describe('deactivate', () => {
    it('should increment version when deactivated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      const initialVersion = offering.getVersion().getValue();
      offering.deactivate();

      expect(offering.getVersion().getValue()).toBe(initialVersion + 1);
      expect(offering.isActiveOffering()).toBe(false);
    });

    it('should preserve all other attributes when deactivated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      const originalName = offering.getName();
      const originalDuration = offering.getDuration().getMinutes();
      const originalCapacity = offering.getMaxCapacityPerSlot();

      offering.deactivate();

      expect(offering.getName()).toBe(originalName);
      expect(offering.getDuration().getMinutes()).toBe(originalDuration);
      expect(offering.getMaxCapacityPerSlot()).toBe(originalCapacity);
    });
  });

  describe('activate', () => {
    it('should increment version when activated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      offering.deactivate();
      const versionAfterDeactivate = offering.getVersion().getValue();

      offering.activate();

      expect(offering.getVersion().getValue()).toBe(versionAfterDeactivate + 1);
      expect(offering.isActiveOffering()).toBe(true);
    });

    it('should preserve all other attributes when activated', () => {
      const offering = Offering.create(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
      );

      offering.deactivate();

      const originalName = offering.getName();
      const originalDuration = offering.getDuration().getMinutes();
      const originalCapacity = offering.getMaxCapacityPerSlot();

      offering.activate();

      expect(offering.getName()).toBe(originalName);
      expect(offering.getDuration().getMinutes()).toBe(originalDuration);
      expect(offering.getMaxCapacityPerSlot()).toBe(originalCapacity);
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct offering with correct version', () => {
      const offering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
        true,
        5,
      );

      expect(offering.getVersion().getValue()).toBe(5);
      expect(offering.getId().getValue()).toBe(offeringId.getValue());
      expect(offering.getName()).toBe('Corte de Pelo');
      expect(offering.isActiveOffering()).toBe(true);
    });

    it('should reconstruct inactive offering', () => {
      const offering = Offering.fromPersistence(
        offeringId,
        businessId,
        'Corte de Pelo',
        validDuration,
        4,
        20,
        false,
        3,
      );

      expect(offering.isActiveOffering()).toBe(false);
    });
  });
});
