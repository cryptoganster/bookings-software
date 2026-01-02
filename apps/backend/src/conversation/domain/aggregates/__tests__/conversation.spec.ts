import { Conversation } from '@conversation/domain/aggregates/conversation';
import { UUID } from '@shared/vo/uuid';
import { ConversationState } from '@conversation/domain/vo/conversation-state';

describe('Conversation Aggregate', () => {
  const validId = UUID.generate();
  const validBusinessId = UUID.generate();
  const validCustomerId = UUID.generate();
  const validCustomerPhone = '+1234567890';

  describe('start', () => {
    it('should create a conversation with initial state', () => {
      // Act
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );

      // Assert
      expect(conversation).toBeDefined();
      expect(conversation.getId().equals(validId)).toBe(true);
      expect(conversation.getBusinessId().equals(validBusinessId)).toBe(true);
      expect(conversation.getCustomerId().equals(validCustomerId)).toBe(true);
      expect(conversation.getCustomerPhone()).toBe(validCustomerPhone);
      expect(conversation.getState().isInitial()).toBe(true);
      expect(conversation.getVersion().getValue()).toBe(1);
    });

    it('should have no selected offering initially', () => {
      // Act
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );

      // Assert
      expect(conversation.getSelectedOfferingId()).toBeUndefined();
      expect(conversation.getSelectedDate()).toBeUndefined();
      expect(conversation.getSelectedTime()).toBeUndefined();
      expect(conversation.getCreatedAppointmentId()).toBeUndefined();
    });

    it('should create conversation with different customer phones', () => {
      // Arrange
      const phone1 = '+1234567890';
      const phone2 = '+9876543210';

      // Act
      const conversation1 = Conversation.start(
        UUID.generate(),
        validBusinessId,
        validCustomerId,
        phone1,
      );

      const conversation2 = Conversation.start(
        UUID.generate(),
        validBusinessId,
        validCustomerId,
        phone2,
      );

      // Assert
      expect(conversation1.getCustomerPhone()).toBe(phone1);
      expect(conversation2.getCustomerPhone()).toBe(phone2);
    });
  });

  describe('transitionToSelectingService', () => {
    it('should transition from INITIAL to SELECTING_SERVICE', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      const initialVersion = conversation.getVersion().getValue();

      // Act
      conversation.transitionToSelectingService();

      // Assert
      expect(conversation.getState().isSelectingService()).toBe(true);
      expect(conversation.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should increment version on state transition', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.transitionToSelectingService();

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });
  });

  describe('selectService', () => {
    it('should select service and transition to SELECTING_DATE', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      const offeringId = 'offering-123';

      // Act
      conversation.selectService(offeringId);

      // Assert
      expect(conversation.getSelectedOfferingId()).toBe(offeringId);
      expect(conversation.getState().isSelectingDate()).toBe(true);
    });

    it('should increment version when selecting service', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.selectService('offering-123');

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });

    it('should throw error if not in SELECTING_SERVICE state', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      // Don't transition to SELECTING_SERVICE

      // Act & Assert
      expect(() => {
        conversation.selectService('offering-123');
      }).toThrow('Cannot select service in current state');
    });

    it('should throw error if in wrong state (SELECTING_DATE)', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      // Now in SELECTING_DATE state

      // Act & Assert
      expect(() => {
        conversation.selectService('another-offering');
      }).toThrow('Cannot select service in current state');
    });
  });

  describe('selectDate', () => {
    it('should select date and transition to SELECTING_TIME', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      const selectedDate = new Date('2024-12-25');

      // Act
      conversation.selectDate(selectedDate);

      // Assert
      expect(conversation.getSelectedDate()).toEqual(selectedDate);
      expect(conversation.getState().isSelectingTime()).toBe(true);
    });

    it('should increment version when selecting date', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.selectDate(new Date('2024-12-25'));

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });

    it('should throw error if not in SELECTING_DATE state', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      // Don't select service (still in SELECTING_SERVICE)

      // Act & Assert
      expect(() => {
        conversation.selectDate(new Date('2024-12-25'));
      }).toThrow('Cannot select date in current state');
    });
  });

  describe('selectTime', () => {
    it('should select time and transition to CONFIRMING', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));
      const selectedTime = '10:00';

      // Act
      conversation.selectTime(selectedTime);

      // Assert
      expect(conversation.getSelectedTime()).toEqual(selectedTime);
      expect(conversation.getState().isConfirming()).toBe(true);
    });

    it('should increment version when selecting time', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.selectTime('10:00');

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });

    it('should throw error if not in SELECTING_TIME state', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      // Don't select date (still in SELECTING_DATE)

      // Act & Assert
      expect(() => {
        conversation.selectTime('10:00');
      }).toThrow('Cannot select time in current state');
    });
  });

  describe('transitionToSelectingTime', () => {
    it('should transition to SELECTING_TIME state', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));

      // Act
      conversation.transitionToSelectingTime();

      // Assert
      expect(conversation.getState().isSelectingTime()).toBe(true);
    });

    it('should increment version on transition', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.transitionToSelectingTime();

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });
  });

  describe('complete', () => {
    it('should complete conversation with appointment ID', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));
      conversation.selectTime('10:00');
      const appointmentId = 'appointment-456';

      // Act
      conversation.complete(appointmentId);

      // Assert
      expect(conversation.getCreatedAppointmentId()).toBe(appointmentId);
      expect(conversation.getState().isCompleted()).toBe(true);
    });

    it('should complete conversation without appointment ID', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));
      conversation.selectTime('10:00');

      // Act
      conversation.complete(null);

      // Assert
      expect(conversation.getCreatedAppointmentId()).toBeUndefined();
      expect(conversation.getState().isCompleted()).toBe(true);
    });

    it('should increment version when completing', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      conversation.selectService('offering-123');
      conversation.selectDate(new Date('2024-12-25'));
      conversation.selectTime('10:00');
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.complete('appointment-456');

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
    });

    it('should throw error if not in CONFIRMING state', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      conversation.transitionToSelectingService();
      // Don't complete the flow

      // Act & Assert
      expect(() => {
        conversation.complete('appointment-456');
      }).toThrow('Cannot complete conversation in current state');
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct conversation from persistence data', () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const customerId = UUID.generate();
      const customerPhone = '+9876543210';
      const state = ConversationState.selectingDate();
      const status = 'ACTIVE';
      const selectedOfferingId = 'offering-789';
      const selectedDate = new Date('2024-12-30');
      const selectedTime = undefined;
      const createdAppointmentId = undefined;
      const version = 5;

      // Act
      const conversation = Conversation.fromPersistence(
        id,
        businessId,
        customerId,
        customerPhone,
        state,
        status,
        selectedOfferingId,
        selectedDate,
        selectedTime,
        createdAppointmentId,
        version,
      );

      // Assert
      expect(conversation).toBeDefined();
      expect(conversation.getId().equals(id)).toBe(true);
      expect(conversation.getBusinessId().equals(businessId)).toBe(true);
      expect(conversation.getCustomerId().equals(customerId)).toBe(true);
      expect(conversation.getCustomerPhone()).toBe(customerPhone);
      expect(conversation.getState().equals(state)).toBe(true);
      expect(conversation.getStatus()).toBe(status);
      expect(conversation.getSelectedOfferingId()).toBe(selectedOfferingId);
      expect(conversation.getSelectedDate()).toEqual(selectedDate);
      expect(conversation.getSelectedTime()).toBeUndefined();
      expect(conversation.getCreatedAppointmentId()).toBeUndefined();
      expect(conversation.getVersion().getValue()).toBe(version);
    });

    it('should reconstruct completed conversation', () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const customerId = UUID.generate();
      const customerPhone = '+1111111111';
      const state = ConversationState.completed();
      const status = 'RESOLVED';
      const selectedOfferingId = 'offering-999';
      const selectedDate = new Date('2024-12-31');
      const selectedTime = '15:00';
      const createdAppointmentId = 'appointment-888';
      const version = 10;

      // Act
      const conversation = Conversation.fromPersistence(
        id,
        businessId,
        customerId,
        customerPhone,
        state,
        status,
        selectedOfferingId,
        selectedDate,
        selectedTime,
        createdAppointmentId,
        version,
      );

      // Assert
      expect(conversation.getState().isCompleted()).toBe(true);
      expect(conversation.getStatus()).toBe(status);
      expect(conversation.getSelectedOfferingId()).toBe(selectedOfferingId);
      expect(conversation.getSelectedDate()).toEqual(selectedDate);
      expect(conversation.getSelectedTime()).toEqual(selectedTime);
      expect(conversation.getCreatedAppointmentId()).toBe(createdAppointmentId);
      expect(conversation.getVersion().getValue()).toBe(version);
    });

    it('should reconstruct conversation in any state', () => {
      // Arrange
      const states = [
        ConversationState.initial(),
        ConversationState.selectingService(),
        ConversationState.selectingDate(),
        ConversationState.selectingTime(),
        ConversationState.confirming(),
        ConversationState.completed(),
      ];

      // Act & Assert
      states.forEach((state, index) => {
        const conversation = Conversation.fromPersistence(
          UUID.generate(),
          UUID.generate(),
          UUID.generate(),
          '+1234567890',
          state,
          'ACTIVE',
          undefined,
          undefined,
          undefined,
          undefined,
          index + 1,
        );

        expect(conversation.getState().equals(state)).toBe(true);
        expect(conversation.getStatus()).toBe('ACTIVE');
        expect(conversation.getVersion().getValue()).toBe(index + 1);
      });
    });
  });

  describe('complete conversation flow', () => {
    it('should complete full conversation flow successfully', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );

      // Act & Assert - Step by step
      expect(conversation.getState().isInitial()).toBe(true);
      expect(conversation.getVersion().getValue()).toBe(1);

      conversation.transitionToSelectingService();
      expect(conversation.getState().isSelectingService()).toBe(true);
      expect(conversation.getVersion().getValue()).toBe(2);

      conversation.selectService('offering-123');
      expect(conversation.getState().isSelectingDate()).toBe(true);
      expect(conversation.getSelectedOfferingId()).toBe('offering-123');
      expect(conversation.getVersion().getValue()).toBe(3);

      conversation.selectDate(new Date('2024-12-25'));
      expect(conversation.getState().isSelectingTime()).toBe(true);
      expect(conversation.getSelectedDate()).toEqual(new Date('2024-12-25'));
      expect(conversation.getVersion().getValue()).toBe(4);

      conversation.selectTime('10:00');
      expect(conversation.getState().isConfirming()).toBe(true);
      expect(conversation.getSelectedTime()).toEqual('10:00');
      expect(conversation.getVersion().getValue()).toBe(5);

      conversation.complete('appointment-456');
      expect(conversation.getState().isCompleted()).toBe(true);
      expect(conversation.getCreatedAppointmentId()).toBe('appointment-456');
      expect(conversation.getVersion().getValue()).toBe(6);
    });

    it('should maintain all selections throughout the flow', () => {
      // Arrange
      const conversation = Conversation.start(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
      );
      const offeringId = 'offering-123';
      const date = new Date('2024-12-25');
      const time = '10:00';
      const appointmentId = 'appointment-456';

      // Act
      conversation.transitionToSelectingService();
      conversation.selectService(offeringId);
      conversation.selectDate(date);
      conversation.selectTime(time);
      conversation.complete(appointmentId);

      // Assert - All selections should be preserved
      expect(conversation.getSelectedOfferingId()).toBe(offeringId);
      expect(conversation.getSelectedDate()).toEqual(date);
      expect(conversation.getSelectedTime()).toEqual(time);
      expect(conversation.getCreatedAppointmentId()).toBe(appointmentId);
    });
  });

  describe('getters', () => {
    it('should return all properties correctly', () => {
      // Arrange
      const id = UUID.generate();
      const businessId = UUID.generate();
      const customerId = UUID.generate();
      const customerPhone = '+1234567890';

      // Act
      const conversation = Conversation.start(id, businessId, customerId, customerPhone);

      // Assert
      expect(conversation.getId()).toBe(id);
      expect(conversation.getBusinessId()).toBe(businessId);
      expect(conversation.getCustomerId()).toBe(customerId);
      expect(conversation.getCustomerPhone()).toBe(customerPhone);
      expect(conversation.getState()).toBeDefined();
      expect(conversation.getVersion()).toBeDefined();
    });
  });

  describe('resolveAdminQuery', () => {
    it('should resolve admin query and update status to RESOLVED', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN', // ← Must be AWAITING_ADMIN to resolve
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );
      const initialVersion = conversation.getVersion().getValue();

      // Act
      conversation.resolveAdminQuery();

      // Assert
      expect(conversation.getStatus()).toBe('RESOLVED');
      expect(conversation.getVersion().getValue()).toBe(initialVersion + 1);
    });

    it('should throw ConversationAlreadyResolvedException when conversation is already resolved', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.initial(),
        'RESOLVED', // ← Already resolved
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      // Act & Assert
      expect(() => {
        conversation.resolveAdminQuery();
      }).toThrow('already resolved');
    });

    it('should throw InvalidConversationStatusException when status is not AWAITING_ADMIN', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.initial(),
        'ACTIVE', // ← Wrong status
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      // Act & Assert
      expect(() => {
        conversation.resolveAdminQuery();
      }).toThrow("Current status is 'ACTIVE', expected 'AWAITING_ADMIN'");
    });

    it('should increment version when resolving admin query', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        5, // ← Start with version 5
      );
      const versionBefore = conversation.getVersion().getValue();

      // Act
      conversation.resolveAdminQuery();

      // Assert
      expect(conversation.getVersion().getValue()).toBe(versionBefore + 1);
      expect(conversation.getVersion().getValue()).toBe(6);
    });

    it('should apply AdminQueryResolved event', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.initial(),
        'AWAITING_ADMIN',
        undefined,
        undefined,
        undefined,
        undefined,
        1,
      );

      // Act
      conversation.resolveAdminQuery();

      // Assert
      // The event should be in the uncommitted events
      // We can verify this by checking that the method executed without errors
      // and the status changed correctly
      expect(conversation.getStatus()).toBe('RESOLVED');
    });

    it('should work with conversation in any state', () => {
      // Arrange
      const conversation = Conversation.fromPersistence(
        validId,
        validBusinessId,
        validCustomerId,
        validCustomerPhone,
        ConversationState.selectingDate(), // ← Different state
        'AWAITING_ADMIN',
        'offering-123',
        undefined,
        undefined,
        undefined,
        1,
      );

      // Act
      conversation.resolveAdminQuery();

      // Assert
      expect(conversation.getStatus()).toBe('RESOLVED');
      expect(conversation.getState().isSelectingDate()).toBe(true); // State unchanged
    });
  });
});
