import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassengerAssistantService } from './passenger-assistant.service';
import { PassengerAssistantController } from './passenger-assistant.controller';
import { User } from '../users/entities/user.entity';
import { SosAlert } from './entities/sos-alert.entity';
import { AiModule } from '../ai/ai.module';

// NotificationsService viene de NotificationsModule, que es @Global() (ver
// notifications.module.ts) — no hace falta importarlo acá explícitamente.
@Module({
  imports: [TypeOrmModule.forFeature([User, SosAlert]), AiModule],
  controllers: [PassengerAssistantController],
  providers: [PassengerAssistantService],
  exports: [PassengerAssistantService],
})
  export class PassengerAssistantModule {}
