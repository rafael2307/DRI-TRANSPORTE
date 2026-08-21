import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { WellnessService } from './wellness.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

// Endpoints para que el propio conductor active/desactive los chequeos de
// bienestar y consulte el estado de su consentimiento. No hay ningún
// endpoint para que un admin los active en nombre del conductor: tiene que
// ser una decisión del conductor mismo.
@Controller('conductor/wellness-consent')
  export class WellnessController {
  constructor(private readonly wellnessService: WellnessService) {}

@UseGuards(JwtAuthGuard)
  @Get()
  async getConsent(@CurrentUser() currentUser: JwtUser) {
    return this.wellnessService.getConsent(currentUser.sub);
  }

@UseGuards(JwtAuthGuard)
  @Patch()
  async setConsent(
    @CurrentUser() currentUser: JwtUser,
    @Body() body: { enabled: boolean },
    ) {
    return this.wellnessService.setConsent(currentUser.sub, !!body.enabled);
  }
}
