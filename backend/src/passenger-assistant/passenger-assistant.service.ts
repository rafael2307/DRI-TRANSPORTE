import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SosAlert, SosAlertStatus } from './entities/sos-alert.entity';
import { AiService } from '../ai/ai.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
  export class PassengerAssistantService {
  private readonly logger = new Logger(PassengerAssistantService.name);

constructor(
  @InjectRepository(User)
  private readonly userRepo: Repository<User>,
  @InjectRepository(SosAlert)
  private readonly sosAlertRepo: Repository<SosAlert>,
  private readonly aiService: AiService,
  private readonly notificationsService: NotificationsService,
  ) {}

// El pasajero tiene que activar el asistente conversacional explícitamente
// (opt-in). Nada de chat pasa si esto está en false. La alerta SOS, en
// cambio, no depende de este consentimiento: es una función de seguridad
// siempre disponible, no una conversación con la IA.
async getPreferences(userId: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }
  return {
    enabled: user.assistantChatEnabled,
    enabledAt: user.assistantChatEnabledAt,
  };
}

async setPreferences(userId: string, enabled: boolean) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }
  user.assistantChatEnabled = enabled;
  user.assistantChatEnabledAt = enabled ? new Date() : null;
  await this.userRepo.save(user);
  return {
    enabled: user.assistantChatEnabled,
    enabledAt: user.assistantChatEnabledAt,
  };
}

// El chat solo responde si el pasajero dio su consentimiento. El gateway
// (o el controller REST) ya validó que quien llama es parte del viaje;
// acá solo validamos el consentimiento antes de gastar una llamada a la IA.
async chat(userId: string, message: string): Promise<{ reply: string }> {
  const preferences = await this.getPreferences(userId);
  if (!preferences.enabled) {
    throw new ForbiddenException(
      'El pasajero no ha activado el asistente conversacional',
      );
  }
  const reply = await this.aiService.chatWithPassenger(message);
  return { reply };
}

// Crea el registro auditable de la alerta y, si el conductor tiene un
// token FCM registrado, le manda una notificación push. No hay ninguna
// integración con servicios de emergencia reales (911, líneas de
// seguridad, SMS a contactos) — eso queda fuera de alcance por ahora y
// requeriría una decisión explícita de producto y un proveedor externo,
// ver nota de alcance en el PR. Quien llama (el gateway) ya validó que el
// pasajero es parte del viaje antes de invocar esto.
async triggerSos(params: {
  tripId: string;
  passengerId: string;
  driverFcmToken?: string | null;
  lat: number;
  lng: number;
}): Promise<SosAlert> {
  const alert = this.sosAlertRepo.create({
    trip: { id: params.tripId } as any,
    passenger: { id: params.passengerId } as User,
    lat: params.lat,
    lng: params.lng,
    status: SosAlertStatus.ACTIVE,
    driverNotified: false,
  });

  if (params.driverFcmToken) {
    try {
      await this.notificationsService.sendPushNotification(
        params.driverFcmToken,
        'Alerta de emergencia',
        'Tu pasajero activó una alerta SOS. Revisa la app inmediatamente.',
        { tripId: params.tripId, type: 'SOS' },
        );
      alert.driverNotified = true;
    } catch (error) {
      this.logger.error(
        `No se pudo notificar al conductor de la alerta SOS del viaje ${params.tripId}: ${error}`,
        );
    }
  }

  await this.sosAlertRepo.save(alert);

  this.logger.warn(
    `ALERTA SOS: pasajero ${params.passengerId} en viaje ${params.tripId}, ubicación (${params.lat}, ${params.lng}).`,
    );

  return alert;
}
}
