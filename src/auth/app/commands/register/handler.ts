import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterCommand } from './command';
import { IUserWriteRepository } from '@auth/domain/interfaces/repositories/user-write';
import { IUserReadRepository } from '@auth/domain/interfaces/repositories/user-read';
import { User } from '@auth/domain/aggregates/user';
import { UUID } from '@shared/vo/uuid';
import { Email } from '@auth/domain/vo/email';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    @Inject('IUserWriteRepository')
    private readonly userWriteRepository: IUserWriteRepository,
    @Inject('IUserReadRepository')
    private readonly userReadRepository: IUserReadRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: RegisterCommand): Promise<{ userId: string; accessToken: string }> {
    // Verificar si el usuario ya existe (usando READ repository)
    const existingUser = await this.userReadRepository.findByEmail(command.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Crear nuevo usuario
    const userId = UUID.generate();
    const email = Email.fromString(command.email);
    const user = await User.create(userId, email, command.password, command.name);

    // Guardar usuario (usando WRITE repository)
    await this.userWriteRepository.save(user);

    // Generar JWT token
    const payload = {
      sub: userId.getValue(),
      email: email.getValue(),
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      userId: userId.getValue(),
      accessToken,
    };
  }
}
