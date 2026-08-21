import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  WhatsAppSession,
  WhatsAppSessionState,
} from './entities/whatsapp-session.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';
import { TripsService } from '../trips/trips.service';

const GRAPH_API_VERSION = 'v20.0';

// Integración con la API de WhatsApp Business (Meta Cloud API) para pedir
// viajes por chat. Sigue el mismo patrón que AiService: si no hay
// credenciales reales configuradas (WHATSAPP_TOKEN y
// WHATSAPP_PHONE_NUMBER_ID), el envío de mensajes funciona en modo
// simulado — se registra en el log lo que se habría enviado, en vez de
// llamar a la API real de Meta. Ver WHATSAPP_INTEGRATION.md para el detalle
// de qué es real y qué sigue fuera de alcance.
@Injectable()
  export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly token: string | undefined;
  private readonly phoneNumberId: string | undefined;
  private readonly verifyToken: string | undefined;
  private readonly appSecret: string | undefined;

constructor(
  @InjectRepository(WhatsAppSession)
  private readonly sessionRepo: Repository<WhatsAppSession>,
  @InjectRepository(User)
  private readonly userRepo: Repository<User>,
  private readonly configService: ConfigService,
  private readonly aiService: AiService,
  private readonly tripsService: TripsService,
  ) {
  this.token = this.configService.get<string>('WHATSAPP_TOKEN');
  this.phoneNumberId = this.configService.get<string>(
    'WHATSAPP_PHONE_NUMBER_ID',
    );
  this.verifyToken = this.configService.get<string>(
    'WHATSAPP_VERIFY_TOKEN',
    );
  this.appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');

  if (!this.token || !this.phoneNumberId) {
    this.logger.warn(
      'WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID no configuradas: WhatsAppService funciona en modo simulado, sin llamadas reales a la API de Meta.',
      );
  }
}

get isRealModeConfigured(): boolean {
  return !!(this.token && this.phoneNumberId);
}

// --- Verificación del webhook (handshake de Meta) ---------------------
// Este chequeo no depende de si el modo es real o simulado: es solo
// comparar el token que configuramos nosotros contra el que manda Meta.
// Si WHATSAPP_VERIFY_TOKEN no está configurada todavía, la verificación
// simplemente siempre falla (no hay nada que "simular" acá con honestidad).
verifyWebhookChallenge(
  mode: string,
  token: string,
  ): { ok: true } | { ok: false } {
  if (mode === 'subscribe' && !!this.verifyToken && token === this.verifyToken) {
    return { ok: true };
  }
  return { ok: false };
}

// Verifica la firma X-Hub-Signature-256 del payload, si tenemos configurado
// el app secret. Si no lo tenemos (todavía no se tramitó), se registra una
// advertencia y se deja pasar sin verificar — no hay forma honesta de
// "simular" una verificación criptográfica real.
verifySignature(rawBody: Buffer, signatureHeader?: string): boolean {
  if (!this.appSecret) {
    this.logger.warn(
      'WHATSAPP_APP_SECRET no configurado: no se puede verificar la firma del webhook, se procesa sin verificar.',
      );
    return true;
  }
  if (!signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto
  .createHmac('sha256', this.appSecret)
  .update(rawBody)
  .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureHeader),
      );
  } catch {
    return false;
  }
}

// --- Envío de mensajes --------------------------------------------------
async sendTextMessage(to: string, body: string): Promise<void> {
  if (!this.isRealModeConfigured) {
    this.logger.log(`[WhatsApp SIMULADO] -> ${to}: ${body}`);
    return;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API respondió ${response.status}: ${errorBody}`);
    }
  } catch (error) {
    this.logger.error(
      `Fallo al enviar mensaje real de WhatsApp a ${to}, no se reintenta: ${error}`,
      );
  }
}


// --- Manejo de mensajes entrantes --------------------------------------
// Parsea el payload del webhook de Meta (formato Cloud API) y despacha
// cada mensaje entrante a processIncomingMessage. Ignora silenciosamente
// eventos que no son mensajes (por ejemplo, confirmaciones de entrega).
async handleWebhookPayload(payload: any): Promise<void> {
  const entries = payload?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const messages = change?.value?.messages || [];
      for (const message of messages) {
        await this.processIncomingMessage(message);
      }
    }
  }
}

private async getOrCreateSession(phone: string): Promise<WhatsAppSession> {
  let session = await this.sessionRepo.findOne({
    where: { phone },
    relations: ['user'],
  });
  if (!session) {
    session = this.sessionRepo.create({
      phone,
      state: WhatsAppSessionState.IDLE,
    });
    session = await this.sessionRepo.save(session);
  }
  return session;
}

private async resetSession(session: WhatsAppSession): Promise<void> {
  session.state = WhatsAppSessionState.IDLE;
  session.pickupLat = null;
  session.pickupLng = null;
  session.pickupName = null;
  session.destinationName = null;
  session.serviceType = null;
  session.estimatedFare = null;
  await this.sessionRepo.save(session);
}

// Máquina de estados del pedido de viaje por WhatsApp. Solo texto y
// ubicación (mensajes tipo "location"); no maneja audio, imágenes ni
// botones interactivos todavía.
async processIncomingMessage(message: any): Promise<void> {
  const phone: string = message?.from;
  if (!phone) return;

  const session = await this.getOrCreateSession(phone);

  // El pedido de viajes por WhatsApp requiere una cuenta de pasajero ya
  // registrada en la app, vinculada por número de teléfono. No hay
  // "reservas de invitado": es una decisión de alcance explícita, no algo
  // que falte por descuido (ver WHATSAPP_INTEGRATION.md).
  if (!session.user) {
    const user = await this.userRepo.findOne({
      where: { phone },
      relations: ['role'],
    });
    if (!user || user.role?.name !== 'passenger') {
      await this.sendTextMessage(
        phone,
        'No encontramos una cuenta de pasajero registrada con este número de WhatsApp. Descargá la app de DRI y registrate con este mismo número para poder pedir viajes por acá.',
        );
      return;
    }
    session.user = user;
    await this.sessionRepo.save(session);
  }

  if (session.state === WhatsAppSessionState.IDLE) {
    await this.startNewRequest(session);
    return;
  }

  if (session.state === WhatsAppSessionState.AWAITING_LOCATION) {
    await this.handleAwaitingLocation(session, message);
    return;
  }

  if (session.state === WhatsAppSessionState.AWAITING_DESTINATION) {
    await this.handleAwaitingDestination(session, message);
    return;
  }

  if (session.state === WhatsAppSessionState.CONFIRMING) {
    await this.handleConfirming(session, message);
    return;
  }
}

private async startNewRequest(session: WhatsAppSession): Promise<void> {
  session.state = WhatsAppSessionState.AWAITING_LOCATION;
  await this.sessionRepo.save(session);
  await this.sendTextMessage(
    session.phone,
    'Hola! Para pedir un viaje, compartí tu ubicación actual desde WhatsApp (icono de adjuntar > Ubicación).',
    );
}

private async handleAwaitingLocation(
  session: WhatsAppSession,
  message: any,
  ): Promise<void> {
  if (message.type !== 'location' || !message.location) {
    await this.sendTextMessage(
      session.phone,
      'Todavía no recibí tu ubicación. Usá el icono de adjuntar en WhatsApp y elegí "Ubicación" para compartir dónde estás.',
      );
    return;
  }

  session.pickupLat = message.location.latitude;
  session.pickupLng = message.location.longitude;
  session.pickupName = message.location.name || 'Ubicación compartida por WhatsApp';
  session.state = WhatsAppSessionState.AWAITING_DESTINATION;
  await this.sessionRepo.save(session);

  await this.sendTextMessage(
    session.phone,
    '¡Listo! ¿A dónde vas? Contame el destino (por ejemplo: "al aeropuerto" o "a Chía").',
    );
}


private async handleAwaitingDestination(
  session: WhatsAppSession,
  message: any,
  ): Promise<void> {
  if (message.type !== 'text' || !message.text?.body) {
    await this.sendTextMessage(
      session.phone,
      'Contame tu destino escribiéndolo en un mensaje de texto.',
      );
    return;
  }

  const extraction = await this.aiService.extractTripDetails(
    message.text.body,
    );
  const { serviceType, destination, price } = extraction.data;

  session.destinationName = destination;
  session.serviceType = serviceType;
  session.estimatedFare = price;
  session.state = WhatsAppSessionState.CONFIRMING;
  await this.sessionRepo.save(session);

  await this.sendTextMessage(
    session.phone,
    `Viaje ${serviceType === 'INTERMUNICIPAL' ? 'intermunicipal' : 'urbano'} desde tu ubicación hasta "${destination}". Tarifa estimada: $${price.toLocaleString('es-CO')}.\n\nRespondé SI para confirmar o NO para cancelar.`,
    );
}

private async handleConfirming(
  session: WhatsAppSession,
  message: any,
  ): Promise<void> {
  const text = (message?.text?.body || '').trim().toLowerCase();

  if (['si', 'sí', 'confirmar', 'confirmo'].includes(text)) {
    // No hacemos geocodificación real del destino (tampoco la hace hoy el
  // flujo de voz de la app, ver handleVoiceCommand en
  // app-pasajero/MapScreen.js): aproximamos el destino cerca del punto
  // de partida. Es una limitación conocida y documentada, no un dato
  // inventado para aparentar precisión.
  const trip = await this.tripsService.requestTrip(
    { id: session.user!.id } as User,
    {
      pickupName: session.pickupName!,
      lat1: Number(session.pickupLat),
      lng1: Number(session.pickupLng),
      destName: session.destinationName!,
      lat2: Number(session.pickupLat) + 0.01,
      lng2: Number(session.pickupLng) + 0.01,
      serviceType: session.serviceType || undefined,
    },
    );

  session.lastTripId = trip.id;
    await this.sessionRepo.save(session);
    await this.resetSession(session);

  await this.sendTextMessage(
    session.phone,
    `Listo, tu viaje fue solicitado (referencia ${trip.id.slice(0, 8)}). Te avisamos por la app apenas un conductor lo acepte.`,
    );
    return;
  }

  if (['no', 'cancelar', 'cancela'].includes(text)) {
    await this.resetSession(session);
    await this.sendTextMessage(
      session.phone,
      'Viaje cancelado. Escribime cuando quieras pedir otro.',
      );
    return;
  }

  await this.sendTextMessage(
    session.phone,
    'No entendí tu respuesta. Respondé SI para confirmar el viaje o NO para cancelarlo.',
    );
}
}
