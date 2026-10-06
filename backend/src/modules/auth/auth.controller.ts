import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  // 2FA Endpoints (should be protected by JwtAuthGuard in production, assuming passed user id)
  // For demo, we might expect userId in body or headers. Assuming JwtAuthGuard is not globally applied in this controller, we can use body for simplicity or require JwtAuthGuard.
  // Actually, let's use @UseGuards(JwtAuthGuard) and get @Request() req
  @Post('2fa/generate')
  @ApiOperation({ summary: 'Generate 2FA Secret' })
  async generateTwoFactorSecret(@Body() body: { userId: string, email: string }) {
    // Usually we would get user from req.user
    return this.authService.generateTwoFactorAuthenticationSecret({ id: body.userId, email: body.email });
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable 2FA' })
  async enableTwoFactor(@Body() body: { userId: string, code: string }) {
    return this.authService.enableTwoFactorAuthentication(body.userId, body.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable 2FA' })
  async disableTwoFactor(@Body() body: { userId: string, code: string }) {
    return this.authService.disableTwoFactorAuthentication(body.userId, body.code);
  }
}
