import { Controller, Post, Body, Delete, Param, UseGuards, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterDto } from '../dtos/register';
import { LoginDto } from '../dtos/login';
import { AddUserRoleDto } from '../dtos/add-user-role';
import { RegisterCommand } from '@auth/app/commands/register';
import { LoginCommand } from '@auth/app/commands/login';
import { AddUserRoleCommand } from '@auth/app/commands/add-user-role';
import { RemoveUserRoleCommand } from '@auth/app/commands/remove-user-role';
import { VerifyEmailCommand } from '@auth/app/commands/verify-email';
import { ActivateUserCommand } from '@auth/app/commands/activate-user';
import { DeactivateUserCommand } from '@auth/app/commands/deactivate-user';
import { UserRole } from '@auth/domain/vo/user-role';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.commandBus.execute(
      new RegisterCommand(
        dto.email,
        dto.password,
        dto.name,
        dto.initialRole ?? UserRole.BUSINESS_OWNER,
      ),
    );
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.commandBus.execute(new LoginCommand(dto.email, dto.password));
    return result;
  }

  /**
   * Add a role to a user
   * Requires authentication (JWT)
   * TODO: Add RolesGuard to restrict to ADMIN only (Phase 14)
   */
  @Post('users/:id/roles')
  @UseGuards(JwtAuthGuard)
  async addRole(@Param('id') userId: string, @Body() dto: AddUserRoleDto) {
    await this.commandBus.execute(new AddUserRoleCommand(userId, dto.role));
    return { message: 'Role added successfully' };
  }

  /**
   * Remove a role from a user
   * Requires authentication (JWT)
   * TODO: Add RolesGuard to restrict to ADMIN only (Phase 14)
   */
  @Delete('users/:id/roles/:role')
  @UseGuards(JwtAuthGuard)
  async removeRole(@Param('id') userId: string, @Param('role') role: UserRole) {
    await this.commandBus.execute(new RemoveUserRoleCommand(userId, role));
    return { message: 'Role removed successfully' };
  }

  /**
   * Verify user email
   * Requires authentication (JWT)
   */
  @Patch('users/:id/verify-email')
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@Param('id') userId: string) {
    await this.commandBus.execute(new VerifyEmailCommand(userId));
    return { message: 'Email verified successfully' };
  }

  /**
   * Activate user account
   * Requires authentication (JWT)
   * TODO: Add RolesGuard to restrict to ADMIN only (Phase 14)
   */
  @Patch('users/:id/activate')
  @UseGuards(JwtAuthGuard)
  async activateUser(@Param('id') userId: string) {
    await this.commandBus.execute(new ActivateUserCommand(userId));
    return { message: 'User activated successfully' };
  }

  /**
   * Deactivate user account
   * Requires authentication (JWT)
   * TODO: Add RolesGuard to restrict to ADMIN only (Phase 14)
   */
  @Patch('users/:id/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateUser(@Param('id') userId: string) {
    await this.commandBus.execute(new DeactivateUserCommand(userId));
    return { message: 'User deactivated successfully' };
  }
}
