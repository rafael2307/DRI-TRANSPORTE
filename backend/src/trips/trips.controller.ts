import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripStatus } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post('request')
  async requestTrip(@Body() data: any) {
    const mockPassenger = { id: data.passengerId } as User;
    return this.tripsService.requestTrip(mockPassenger, data);
  }

  @Post(':id/accept')
  async acceptTrip(
    @Param('id') id: string,
    @Body() data: { driverId: string },
  ) {
    const mockDriver = { id: data.driverId } as User;
    return this.tripsService.acceptTrip(mockDriver, id);
  }

  @Get(':id')
  async getTrip(@Param('id') id: string) {
    return this.tripsService.getTrip(id);
  }

  @Patch(':id/arrived')
  async driverArrived(@Param('id') id: string) {
    return this.tripsService.driverArrived(id);
  }

  @Patch(':id/start')
  async startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

  @Patch(':id/complete')
  async completeTrip(@Param('id') id: string) {
    return this.tripsService.completeTrip(id);
  }

  @Patch(':id/cancel')
  async cancelTrip(@Param('id') id: string) {
    return this.tripsService.cancelTrip(id);
  }
}
