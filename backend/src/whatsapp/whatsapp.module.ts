import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { User } from '../users/entities/user.entity';
import { AiModule } from '../ai/ai.module';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsAppSession, User]),
    AiModule,
    TripsModule,
    ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
})
  export class WhatsAppModule {}
