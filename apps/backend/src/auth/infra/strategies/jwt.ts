import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@auth/domain/vo/user-role';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  roles: UserRole[];
  businessId?: string; // ← Added: Optional businessId
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email || !payload.roles) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      businessId: payload.businessId, // ← Added: Pass through businessId if present
    };
  }
}
