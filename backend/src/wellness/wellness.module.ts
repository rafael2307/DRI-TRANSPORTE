import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WellnessService } from './wellness.service';
import { WellnessController } from './wellness.controller';
import { ConductorProfile } from '../users/entities/conductor-profile.entity';
import { WellnessCheckIn } from './entities/wellness-check-in.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConductorProfile, WellnessCheckIn]),
    AiModule,
    ],
  controllers: [WellnessController],
  providers: [WellnessService],
  exports: [WellnessService],
})
  export class WellnessModule {}
