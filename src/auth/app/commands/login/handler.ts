import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginCommand } from './command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginCommand): Promise<{ accessToken: string }> {
    // Buscar usuario por email (usando WRITE repository porque necesitamos el aggregate completo para validar password)
    const user = await this.userWriteRepository.findByEmail(command.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validar password (requiere el aggregate completo con el método validatePassword)
    const isPasswordValid = await user.validatePassword(command.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generar JWT token
    const payload = {
      sub: user.getId().getValue(),
      email: user.getEmail().getValue(),
      businessId: user.getBusinessId()?.getValue(),
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
