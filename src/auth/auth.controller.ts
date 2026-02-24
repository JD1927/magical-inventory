import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Registration ─────────────────────────────────────────────

  @Get('generate-registration-options')
  async generateRegistrationOptions(@Query('email') email: string) {
    return this.authService.generateRegistrationOpts(email);
  }

  @Post('verify-registration')
  async verifyRegistration(
    @Body('email') email: string,
    @Body('credential') credential: any,
  ) {
    return this.authService.verifyRegistration(email, credential);
  }

  // ─── Authentication ───────────────────────────────────────────

  @Get('generate-authentication-options')
  async generateAuthenticationOptions(@Query('email') email: string) {
    return this.authService.generateAuthenticationOpts(email);
  }

  @Post('verify-authentication')
  async verifyAuthentication(
    @Body('email') email: string,
    @Body('credential') credential: any,
  ) {
    return this.authService.verifyAuthentication(email, credential);
  }
}
