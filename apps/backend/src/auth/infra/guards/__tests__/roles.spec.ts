import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles';
import { UserRole } from '@auth/domain/vo/user-role';
import { ROLES_KEY } from '@auth/presentation/decorators/roles';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ userId: '123', roles: [UserRole.CUSTOMER] });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        userId: '123',
        roles: [UserRole.ADMIN, UserRole.BUSINESS_OWNER],
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has at least one of the required roles', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN, UserRole.BUSINESS_OWNER]);
      const context = createMockExecutionContext({
        userId: '123',
        roles: [UserRole.BUSINESS_OWNER],
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        userId: '123',
        roles: [UserRole.CUSTOMER],
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should deny access when user has no roles', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        userId: '123',
        roles: [],
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should deny access when user object is missing', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(null);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should deny access when user.roles is undefined', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        userId: '123',
        roles: undefined,
      });

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(false);
    });

    it('should use correct metadata key', () => {
      // Arrange
      const getAllAndOverrideSpy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext({ userId: '123', roles: [] });

      // Act
      guard.canActivate(context);

      // Assert
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});
