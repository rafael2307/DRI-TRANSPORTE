import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { PassengerAssistantService } from './passenger-assistant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

// Endpoints para que el propio pasajero active/desactive el asistente
// conversacional y lo use por REST (además del chat en vivo por socket
// dentro de un viaje activo, ver assistantChatMessage en location.gateway.ts).
// Igual que con el consentimiento de bienestar del conductor: no hay
// endpoint para que un admin active esto en nombre del pasajero.
@Controller('pasajero')
  export class PassengerAssistantController {
  constructor(
    private readonly passengerAssistantService: PassengerAssistantService,
    ) {}

@UseGuards(JwtAuthGuard)
  @Get('assistant-preferences')
  async getPreferences(@CurrentUser() currentUser: JwtUser) {
    return this.passengerAssistantService.getPreferences(currentUser.sub);
  }

@UseGuards(JwtAuthGuard)
  @Patch('assistant-preferences')
  async setPreferences(
    @CurrentUser() currentUser: JwtUser,
    @Body() body: { enabled: boolean },
    ) {
    return this.passengerAssistantService.setPreferences(
      currentUser.sub,
      !!body.enabled,
      );
  }

// Respaldo REST del chat, por si el cliente no tiene el socket disponible
// en ese momento. La app en la práctica usa el evento de socket
// assistantChatMessage, que reutiliza este mismo service.
@UseGuards(JwtAuthGuard)
  @Post('assistant-chat')
  async chat(
    @CurrentUser() currentUser: JwtUser,
    @Body() body: { message: string },
    ) {
    return this.passengerAssistantService.chat(currentUser.sub, body.message);
  }
}
