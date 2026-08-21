import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConductorProfile } from '../users/entities/conductor-profile.entity';
import {
  WellnessCheckIn,
  WellnessTrigger,
} from './entities/wellness-check-in.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';

// Cada cuánto se le manda al conductor un chequeo programado durante un
// viaje activo, y el tiempo mínimo entre dos chequeos (para no ser
// invasivos). Ambos son deliberadamente generosos para la primera versión.
const SCHEDULED_INTERVAL_MS = 45 * 60 * 1000;
const MIN_GAP_BETWEEN_CHECK_INS_MS = 15 * 60 * 1000;

@Injectable()
  export class WellnessService {
  private readonly logger = new Logger(WellnessService.name);
  private readonly LAST_CHECK_IN_KEY_PREFIX = 'wellness:lastcheckin';

constructor(
  @InjectRepository(ConductorProfile)
  private readonly profileRepo: Repository<ConductorProfile>,
  @InjectRepository(WellnessCheckIn)
  private readonly checkInRepo: Repository<WellnessCheckIn>,
  @InjectRedis() private readonly redis: Redis,
  private readonly aiService: AiService,
  ) {}

// El conductor tiene que activar esto explícitamente (opt-in). Nada de
// lo demás en este servicio hace nada si esto está en false.
async setConsent(driverId: string, enabled: boolean) {
  const profile = await this.profileRepo.findOne({
    where: { user: { id: driverId } },
  });
  if (!profile) {
    throw new NotFoundException('Perfil de conductor no encontrado');
  }
  profile.wellnessCheckInsEnabled = enabled;
  profile.wellnessConsentAt = enabled ? new Date() : null;
  await this.profileRepo.save(profile);
  return {
    enabled: profile.wellnessCheckInsEnabled,
    consentedAt: profile.wellnessConsentAt,
  };
}

async getConsent(driverId: string) {
  const profile = await this.profileRepo.findOne({
    where: { user: { id: driverId } },
  });
  return {
    enabled: profile?.wellnessCheckInsEnabled ?? false,
    consentedAt: profile?.wellnessConsentAt ?? null,
  };
}

// Se llama cada vez que llega un ping de ubicación de un conductor en
// viaje activo. Si el conductor dio consentimiento y ya pasó el
// intervalo mínimo desde el último chequeo, crea uno nuevo y devuelve el
// mensaje para mandarle por el chat. Si no corresponde, devuelve null.
async maybeTriggerCheckIn(driverId: string): Promise<{
  checkInId: string;
  message: string;
} | null> {
  const consent = await this.getConsent(driverId);
  if (!consent.enabled) return null;

  const key = `${this.LAST_CHECK_IN_KEY_PREFIX}:${driverId}`;
  const lastAtRaw = await this.redis.get(key);
  const lastAtMs = lastAtRaw ? parseInt(lastAtRaw, 10) : 0;
  const now = Date.now();

  if (now - lastAtMs < SCHEDULED_INTERVAL_MS) return null;
  if (lastAtMs !== 0 && now - lastAtMs < MIN_GAP_BETWEEN_CHECK_INS_MS) {
    return null;
  }

  const message = await this.aiService.getWellnessCheckInPrompt(
    WellnessTrigger.SCHEDULED,
    );

  const checkIn = this.checkInRepo.create({
    driver: { id: driverId } as User,
    trigger: WellnessTrigger.SCHEDULED,
    promptMessage: message,
  });
  await this.checkInRepo.save(checkIn);
  await this.redis.set(key, String(now), 'EX', 60 * 60 * 6);

  this.logger.log(`Chequeo de bienestar enviado a conductor ${driverId}`);

  return { checkInId: checkIn.id, message };
}

// Guarda la respuesta del conductor a un chequeo y le pide a la IA que
// evalúe (sin diagnosticar nada médico) si el texto sugiere que el
// conductor necesita una pausa o ayuda, solo para dejarlo marcado en el
// registro auditable — nunca dispara ninguna acción automática por sí solo.
async recordResponse(checkInId: string, response: string) {
  const checkIn = await this.checkInRepo.findOne({
    where: { id: checkInId },
  });
  if (!checkIn) {
    throw new NotFoundException('Chequeo de bienestar no encontrado');
  }

  const assessment = await this.aiService.assessWellnessResponse(response);

  checkIn.response = response;
  checkIn.respondedAt = new Date();
  checkIn.flagged = assessment.flagged;
  await this.checkInRepo.save(checkIn);

  if (assessment.flagged) {
    this.logger.warn(
      `Chequeo ${checkInId} marcado para revisión (respuesta del conductor sugiere que podría necesitar una pausa).`,
      );
  }

  return checkIn;
}
}
