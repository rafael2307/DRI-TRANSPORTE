import { Module, forwardRef } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';
import { TripsModule } from '../trips/trips.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [forwardRef(() => TripsModule), AiModule],
  providers: [LocationService, LocationGateway],
  exports: [LocationService],
})
export class LocationModule {}
