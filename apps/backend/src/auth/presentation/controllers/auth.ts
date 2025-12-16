import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { RegisterDto } from '../dtos/register';
import { LoginDto } from '../dtos/login';
import { RegisterCommand } from '@auth/app/commands/register';
import { LoginCommand } from '@auth/app/commands/login';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.commandBus.execute(
      new RegisterCommand(dto.email, dto.password, dto.name),
    );
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.commandBus.execute(new LoginCommand(dto.email, dto.password));
    return result;
  }
}
