import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { getJwtSecret } from '../config/runtime.config';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

/**
 * Extract JWT from cookie or Authorization header
 * Priority: Cookie (httpOnly) > Authorization header
 */
const extractJwtFromRequest = (req: Request): string | null => {
  // 1. Try to get from httpOnly cookie first (secure)
  if (req.cookies?.access_token) {
    return req.cookies.access_token;
  }

  // 2. Fallback to Authorization header (for backward compatibility)
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
