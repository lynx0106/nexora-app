/**
 * User object attached to Express Request by JWT strategy.
 * Matches the return of JwtStrategy.validate()
 */
export interface AuthUser {
  userId: string;
  email: string;
  tenantId?: string;
  role?: string;
}
