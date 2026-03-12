import {
  Body,
  Controller,
  Post,
  Res,
  Get,
  UseGuards,
  Req,
  Ip,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthThrottleGuard } from '../common/guards/auth-throttle.guard';
import { StructuredLogger } from '../common/logger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new StructuredLogger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 intentos por hora para registro
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthThrottleGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful - sets httpOnly cookie and returns token',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    try {
      const result = await this.authService.login(dto);

      // Create refresh token and store in database
      const deviceInfo = req.headers['user-agent'] || 'Unknown';
      const refreshToken = await this.authService.createRefreshToken(
        result.user.id,
        deviceInfo,
        ip,
      );

      // Set HTTP-only cookie with JWT (for same-domain deployments)
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      // Set HTTP-only refresh token cookie
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      // Also set a non-httpOnly cookie for client-side "is logged in" checks
      res.cookie('is_authenticated', 'true', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      this.logger.log(
        `Successful login for user: ${result.user.email} from IP: ${ip}`,
      );

      // Return token in body for cross-domain deployments (cookies blocked by browser)
      return {
        user: result.user,
        accessToken: result.accessToken,
        message: 'Login successful',
      };
    } catch (error) {
      this.logger.warn(
        `Failed login attempt for email: ${dto.email} from IP: ${ip}`,
      );
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful - cookies cleared and tokens revoked',
  })
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    // Get refresh token from cookie and revoke it in database
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        await this.authService.revokeRefreshToken(refreshToken);
        this.logger.log('Refresh token revoked successfully');
      } catch (error) {
        this.logger.error('Error revoking refresh token:', error);
      }
    }

    // Get user from request and revoke all their tokens
    const user = (req as any).user;
    if (user?.userId) {
      await this.authService.revokeAllUserRefreshTokens(user.userId);
    }

    // Clear cookies with same options used when setting them
    const clearOptions = {
      path: '/',
      secure: true,
      sameSite: 'none' as const,
    };
    res.clearCookie('access_token', clearOptions);
    res.clearCookie('is_authenticated', clearOptions);
    res.clearCookie('refresh_token', clearOptions);

    this.logger.log('User logged out - all tokens invalidated');
    return { message: 'Logout successful' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Returns current user data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) {
      return { user: null };
    }

    // Fetch fresh user data from database
    const userData = await this.authService.getUserById(user.userId);
    return { user: userData };
  }

  @Post('password-reset/request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 intentos por hora
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}
