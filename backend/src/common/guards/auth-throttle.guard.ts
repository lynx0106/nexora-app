import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Extended ThrottlerGuard that provides specific rate limiting for auth endpoints
 * Tracks failed login attempts and implements progressive delays
 */
@Injectable()
export class AuthThrottleGuard extends ThrottlerGuard {
  // Track failed attempts per IP
  private failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
  
  // Maximum failed attempts before temporary block
  private readonly maxFailedAttempts = 5;
  
  // Block duration in milliseconds (15 minutes)
  private readonly blockDuration = 15 * 60 * 1000;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const ip = this.getClientIp(req);
    
    // Check if IP is currently blocked due to failed attempts
    const blockStatus = this.isBlocked(ip);
    if (blockStatus.blocked) {
      res.header('Retry-After', Math.ceil(blockStatus.retryAfter / 1000).toString());
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many failed attempts. Please try again after ${Math.ceil(blockStatus.retryAfter / 1000 / 60)} minutes.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Call parent method for standard rate limiting
    const allowed = await super.canActivate(context);
    
    if (!allowed) {
      // Track this as a failed attempt
      this.trackFailedAttempt(ip);
    }
    
    return allowed;
  }

  /**
   * Check if an IP is currently blocked
   */
  private isBlocked(ip: string): { blocked: boolean; retryAfter: number } {
    const attempt = this.failedAttempts.get(ip);
    if (!attempt) {
      return { blocked: false, retryAfter: 0 };
    }

    if (attempt.count >= this.maxFailedAttempts) {
      const timeSinceLastAttempt = Date.now() - attempt.lastAttempt;
      if (timeSinceLastAttempt < this.blockDuration) {
        return { 
          blocked: true, 
          retryAfter: this.blockDuration - timeSinceLastAttempt 
        };
      } else {
        // Block expired, reset counter
        this.failedAttempts.delete(ip);
        return { blocked: false, retryAfter: 0 };
      }
    }

    return { blocked: false, retryAfter: 0 };
  }

  /**
   * Track a failed login attempt
   */
  private trackFailedAttempt(ip: string): void {
    const existing = this.failedAttempts.get(ip);
    if (existing) {
      existing.count++;
      existing.lastAttempt = Date.now();
    } else {
      this.failedAttempts.set(ip, { count: 1, lastAttempt: Date.now() });
    }
  }

  /**
   * Reset failed attempts for an IP (call this on successful login)
   */
  resetFailedAttempts(ip: string): void {
    this.failedAttempts.delete(ip);
  }

  /**
   * Get client IP from request
   */
  private getClientIp(req: any): string {
    // Try to get IP from various headers (useful when behind proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return realIp;
    }
    
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}

/**
 * Decorator to apply strict rate limiting to auth endpoints
 * Usage: @UseGuards(AuthThrottleGuard)
 */
export function UseAuthThrottle() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // This is a marker decorator - the actual guard is applied via @UseGuards
    return descriptor;
  };
}
