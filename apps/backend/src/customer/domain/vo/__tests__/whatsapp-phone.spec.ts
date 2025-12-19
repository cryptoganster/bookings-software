import { WhatsAppPhone } from '../whatsapp-phone';
import { InvalidWhatsAppPhoneException } from '../../exceptions/invalid-whatsapp-phone';

describe('WhatsAppPhone Value Object', () => {
  describe('Valid E.164 formats', () => {
    it('should accept valid Dominican Republic number', () => {
      const phone = WhatsAppPhone.fromString('+18095551234');
      expect(phone.getValue()).toBe('+18095551234');
    });

    it('should accept valid USA number', () => {
      const phone = WhatsAppPhone.fromString('+12025551234');
      expect(phone.getValue()).toBe('+12025551234');
    });

    it('should accept valid UK number', () => {
      const phone = WhatsAppPhone.fromString('+442071234567');
      expect(phone.getValue()).toBe('+442071234567');
    });

    it('should accept valid China number', () => {
      const phone = WhatsAppPhone.fromString('+861234567890');
      expect(phone.getValue()).toBe('+861234567890');
    });

    it('should accept minimum length number (8 digits total)', () => {
      const phone = WhatsAppPhone.fromString('+12345678');
      expect(phone.getValue()).toBe('+12345678');
    });

    it('should accept maximum length number (15 digits total)', () => {
      const phone = WhatsAppPhone.fromString('+123456789012345');
      expect(phone.getValue()).toBe('+123456789012345');
    });
  });

  describe('Invalid formats', () => {
    it('should reject phone without plus sign', () => {
      expect(() => WhatsAppPhone.fromString('18095551234')).toThrow(InvalidWhatsAppPhoneException);
      expect(() => WhatsAppPhone.fromString('18095551234')).toThrow(
        'Invalid WhatsApp phone format',
      );
    });

    it('should reject phone with spaces', () => {
      expect(() => WhatsAppPhone.fromString('+1 809 555 1234')).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it('should reject phone with dashes', () => {
      expect(() => WhatsAppPhone.fromString('+1-809-555-1234')).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it('should reject phone with parentheses', () => {
      expect(() => WhatsAppPhone.fromString('+1(809)5551234')).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it('should reject empty string', () => {
      expect(() => WhatsAppPhone.fromString('')).toThrow(InvalidWhatsAppPhoneException);
      expect(() => WhatsAppPhone.fromString('')).toThrow('WhatsApp phone cannot be empty');
    });

    it('should reject phone starting with +0', () => {
      expect(() => WhatsAppPhone.fromString('+0123456789')).toThrow(InvalidWhatsAppPhoneException);
    });

    it('should reject phone with letters', () => {
      expect(() => WhatsAppPhone.fromString('+1809ABC1234')).toThrow(InvalidWhatsAppPhoneException);
    });

    it('should reject phone too short (less than 8 digits)', () => {
      expect(() => WhatsAppPhone.fromString('+123456')).toThrow(InvalidWhatsAppPhoneException);
    });

    it('should reject phone too long (more than 15 digits)', () => {
      expect(() => WhatsAppPhone.fromString('+1234567890123456')).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it('should reject phone with only plus sign', () => {
      expect(() => WhatsAppPhone.fromString('+')).toThrow(InvalidWhatsAppPhoneException);
    });
  });

  describe('Equality', () => {
    it('should be equal when values are the same', () => {
      const phone1 = WhatsAppPhone.fromString('+18095551234');
      const phone2 = WhatsAppPhone.fromString('+18095551234');
      expect(phone1.equals(phone2)).toBe(true);
    });

    it('should not be equal when values differ', () => {
      const phone1 = WhatsAppPhone.fromString('+18095551234');
      const phone2 = WhatsAppPhone.fromString('+18095555678');
      expect(phone1.equals(phone2)).toBe(false);
    });

    it('should not be equal to null', () => {
      const phone = WhatsAppPhone.fromString('+18095551234');
      expect(phone.equals(null as any)).toBe(false);
    });

    it('should not be equal to undefined', () => {
      const phone = WhatsAppPhone.fromString('+18095551234');
      expect(phone.equals(undefined as any)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should create new instance instead of modifying existing one', () => {
      const phone1 = WhatsAppPhone.fromString('+18095551234');
      const phone2 = WhatsAppPhone.fromString('+18095555678');

      // Both instances should maintain their own values
      expect(phone1.getValue()).toBe('+18095551234');
      expect(phone2.getValue()).toBe('+18095555678');

      // They should not be equal
      expect(phone1.equals(phone2)).toBe(false);
    });
  });
});
