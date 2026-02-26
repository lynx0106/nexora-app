import { Body, Controller, Post, Res, Get, UseGuards, Req, Ip, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthThrottleGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful - sets httpOnly cookie' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    try {
      const result = await this.authService.login(dto);
      
      // Set HTTP-only cookie with JWT
      const isProduction = process.env.NODE_ENV === 'production';
      // Use 'none' for cross-domain in production (frontend on Vercel, backend on Railway)
      // Requires secure: true when using sameSite: 'none'
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: true, // Always HTTPS in production
        sameSite: 'none', // Allow cross-domain requests (Vercel → Railway)
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      // Also set a non-httpOnly cookie for client-side "is logged in" checks
      res.cookie('is_authenticated', 'true', {
        httpOnly: false,
        secure: true,
        sameSite: 'none', // Allow cross-domain
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      this.logger.log(`Successful login for user: ${result.user.email} from IP: ${ip}`);

      // Return user data (without token in body for security)
      return { 
        user: result.user,
        message: 'Login successful' 
      };
    } catch (error) {
      this.logger.warn(`Failed login attempt for email: ${dto.email} from IP: ${ip}`);
      throw error;
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful - cookies cleared' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear cookies with same options used when setting them
    const clearOptions = {
      path: '/',
      secure: true,
      sameSite: 'none' as const,
    };
    res.clearCookie('access_token', clearOptions);
    res.clearCookie('is_authenticated', clearOptions);
    res.clearCookie('refresh_token', clearOptions);

    this.logger.log('User logged out');
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
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}
