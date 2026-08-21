import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripStatus } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AiService } from '../ai/ai.service';

// Nota: el flujo real de viajes hoy corre por el WebSocket gateway
// (location.gateway.ts), que todavía confía en el passengerId/driverId que
// manda el cliente. Este controller REST no está siendo llamado por las apps
// (usan sockets), pero lo protegemos igual por si se usa desde un panel admin
// u otro cliente futuro.
@Controller('trips')
  export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly aiService: AiService,
    ) {}

@UseGuards(JwtAuthGuard)
  @Post('request')
  async requestTrip(@CurrentUser() currentUser: JwtUser, @Body() data: any) {
    const passenger = { id: currentUser.sub } as User;
    return this.tripsService.requestTrip(passenger, data);
  }

@UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async acceptTrip(
    @CurrentUser() currentUser: JwtUser,
    @Param('id') id: string,
    ) {
    const driver = { id: currentUser.sub } as User;
    return this.tripsService.acceptTrip(driver, id);
  }

@UseGuards(JwtAuthGuard)
  @Get(':id')
  async getTrip(@Param('id') id: string) {
    return this.tripsService.getTrip(id);
  }

@UseGuards(JwtAuthGuard)
  @Patch(':id/arrived')
  async driverArrived(@Param('id') id: string) {
    return this.tripsService.driverArrived(id);
  }

@UseGuards(JwtAuthGuard)
  @Patch(':id/start')
  async startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

@UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  async completeTrip(@Param('id') id: string) {
    return this.tripsService.completeTrip(id);
  }

@UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelTrip(@Param('id') id: string) {
    return this.tripsService.cancelTrip(id);
  }

// Recapitulación conversacional del viaje para mostrarle al pasajero al
// terminar, en vez de solo el prompt de calificación en estrellas (ver
// ASISTENTE_IA_PLUS.md). No depende del opt-in del chat del asistente:
// es un resumen de un viaje que ya terminó, no una conversación en vivo.
@UseGuards(JwtAuthGuard)
  @Get(':id/summary')
  async getTripSummary(@Param('id') id: string) {
    const trip = await this.tripsService.getTrip(id);
    const summary = await this.aiService.generateTripSummary({
      pickupLocationName: trip.pickupLocationName,
      destinationName: trip.destinationName,
      fare: trip.fare,
      serviceType: trip.serviceType,
    });
    return { summary };
  }
}
