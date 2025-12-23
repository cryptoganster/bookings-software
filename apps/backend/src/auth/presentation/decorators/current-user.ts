import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@auth/domain/vo/user-role';

export interface UserPayload {
  userId: string;
  email: string;
  roles?: UserRole[]; // Optional: roles from JWT
  businessId?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
