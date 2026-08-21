import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsAppService } from './whatsapp.service';

// Endpoints públicos del webhook de WhatsApp Business (Meta Cloud API). No
// llevan JwtAuthGuard: quien nos llama es Meta, no un usuario de la app. La
// seguridad acá es el token de verificación (handshake GET) y la firma
// X-Hub-Signature-256 (POST), no un JWT — ver WhatsAppService.
@Controller('whatsapp')
  export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

constructor(private readonly whatsappService: WhatsAppService) {}

// Meta llama a esto una sola vez, al configurar el webhook en el panel de
// desarrolladores, para confirmar que el endpoint es nuestro.
@Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
    ) {
    const result = this.whatsappService.verifyWebhookChallenge(mode, token);
    if (result.ok) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Verificación fallida');
    }
  }

@Post('webhook')
  @HttpCode(200)
  async receiveWebhook(@Req() req: Request, @Body() body: any) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (req as any).rawBody as Buffer | undefined;

  if (rawBody && !this.whatsappService.verifySignature(rawBody, signature)) {
    this.logger.warn('Webhook de WhatsApp con firma inválida, se ignora.');
    // Igual respondemos 200: Meta reintenta agresivamente si no le
    // devolvemos 2xx, y no queremos eso para un payload que ya rechazamos.
    return { ok: false };
  }

  await this.whatsappService.handleWebhookPayload(body);
    return { ok: true };
  }
}
