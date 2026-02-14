import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          console.log('No Authorization header found');
          return null;
        }
        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
          console.log('Invalid Authorization header scheme');
          return null;
        }
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-me',
    });
  }

  validate(payload: JwtPayload) {
    console.log('JWT Payload:', payload);
    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
