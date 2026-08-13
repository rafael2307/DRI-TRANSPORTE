import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService, RegisterDto, UserRole } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    return this.authService.register(registrationData);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    return req.user;
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Req() req) {}

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req) {
    return req.user;
  }

  @Get('tiktok')
  @UseGuards(AuthGuard('tiktok'))
  async tiktokAuth(@Req() req) {}

  @Get('tiktok/callback')
  @UseGuards(AuthGuard('tiktok'))
  async tiktokAuthRedirect(@Req() req) {
    return req.user;
  }

  @Get('kwai')
  @UseGuards(AuthGuard('kwai'))
  async kwaiAuth(@Req() req) {}

  @Get('kwai/callback')
  @UseGuards(AuthGuard('kwai'))
  async kwaiAuthRedirect(@Req() req) {
    return req.user;
  }

  @Post('social')
  async socialLogin(
    @Body()
    socialData: {
      provider: string;
      providerId: string;
      email?: string;
      name: string;
      role?: UserRole;
    },
  ) {
    return this.authService.socialLogin(socialData);
  }

  @Post('send-otp')
  async sendOtp(@Body() data: { phone: string; role: UserRole }) {
    return this.authService.sendOtp(data.phone, data.role);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() data: { phone: string; code: string; role: UserRole },
  ) {
    return this.authService.verifyOtp(data.phone, data.code, data.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('refresh')
  async refresh(@Req() req, @Body('refresh_token') refreshToken: string) {
    const userId = req.user.sub;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('fcm-token')
  async updateFcmToken(@Req() req, @Body('token') token: string) {
    const userId = req.user.sub;
    return this.authService.updateFcmToken(userId, token);
  }
}
