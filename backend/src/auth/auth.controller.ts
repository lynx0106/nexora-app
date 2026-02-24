import { Body, Controller, Post, Res, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto para registro
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto para login
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful - sets httpOnly cookie' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    
    // Set HTTP-only cookie with JWT
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      secure: isProduction, // Only HTTPS in production
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Also set a non-httpOnly cookie for client-side "is logged in" checks
    res.cookie('is_authenticated', 'true', {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Return user data (without token in body for security)
    return { 
      user: result.user,
      message: 'Login successful' 
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful - cookies cleared' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('is_authenticated', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

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
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 intentos por minuto para solicitud de reset
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto para confirmación de reset
  @ApiOperation({ summary: 'Confirm password reset with token' })
  @ApiResponse({ status: 200, description: 'Password successfully reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}
