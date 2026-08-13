import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripsService } from './trips.service';
import { PaymentsModule } from '../payments/payments.module';
import { LocationModule } from '../location/location.module';
import { TripsController } from './trips.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip]),
    PaymentsModule,
    forwardRef(() => LocationModule),
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
