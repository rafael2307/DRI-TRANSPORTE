import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from './location.service';
import { TripsService } from '../trips/trips.service';
import { Logger, Inject, forwardRef, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { WellnessService } from '../wellness/wellness.service';
import { PassengerAssistantService } from '../passenger-assistant/passenger-assistant.service';
import { TripStatus } from '../trips/entities/trip.entity';
import { OFERTA } from '../trips/trips.service';

// Tiempo de búsqueda antes de ofrecerle al pasajero subir la oferta
export const ESPERA_BUSQUEDA_MS = { URBAN: 45_000, INTERMUNICIPAL: 90_000 };

interface AuthedSocket extends Socket {
  data: { user?: { sub: string; username: string; role: string } };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
  export class LocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

private readonly logger = new Logger(LocationGateway.name);

// Un temporizador por solicitud abierta: si nadie la toma a tiempo, se le
// abre al pasajero el menú para subir la oferta (evento noDriverFound).
private searchTimers = new Map<string, NodeJS.Timeout>();

private clearSearchTimer(tripId: string) {
  const t = this.searchTimers.get(tripId);
  if (t) clearTimeout(t);
  this.searchTimers.delete(tripId);
}

private armSearchTimeout(trip: any, client: Socket) {
  this.clearSearchTimer(trip.id);
  const ms = ESPERA_BUSQUEDA_MS[trip.serviceType] || ESPERA_BUSQUEDA_MS.URBAN;
  this.searchTimers.set(
    trip.id,
    setTimeout(async () => {
      this.searchTimers.delete(trip.id);
      try {
        const t = await this.tripsService.findOne(trip.id);
        if (!t || t.status !== TripStatus.REQUESTED) return;
        const base = Number(t.baseFare ?? t.fare);
        client.emit('noDriverFound', {
          tripId: t.id,
          baseFare: base,
          currentFare: Number(t.offeredFare ?? base),
          maxFare: Math.round(base * (1 + OFERTA.maxSubida)),
          raisesLeft: Math.max(0, OFERTA.maxSubidas - (t.raises || 0)),
        });
      } catch (e) {
        this.logger.warn(`No se pudo revisar la solicitud ${trip.id}: ${e?.message}`);
      }
    }, ms),
  );
}

// Envía la solicitud (o la oferta subida) a los conductores cercanos
private async notifyDrivers(trip: any, passengerSocketId: string, raised: number) {
  const nearbyDrivers = await this.locationService.findNearbyDrivers(
    Number(trip.pickupLat),
    Number(trip.pickupLng),
    5,
    trip.serviceType,
  );
  const payload = {
    tripId: trip.id,
    pickup: { lat: Number(trip.pickupLat), lng: Number(trip.pickupLng), name: trip.pickupLocationName },
    destination: { lat: Number(trip.destinationLat), lng: Number(trip.destinationLng), name: trip.destinationName },
    fare: Number(trip.offeredFare ?? trip.fare),
    baseFare: Number(trip.baseFare ?? trip.fare),
    distanceKm: Number(trip.distanceKm || 0),
    seats: trip.seats || 1,
    serviceType: trip.serviceType,
    raised,
    passengerSocketId,
  };
  for (const driver of nearbyDrivers as any[]) {
    const socketId = await this.locationService.getSocketByUserId(driver[0]);
    if (socketId) {
      this.server.to(socketId).emit(raised ? 'tripOfferRaised' : 'newTripRequest', payload);
    }
  }
  return (nearbyDrivers as any[]).length;
}

constructor(
  private readonly locationService: LocationService,
  @Inject(forwardRef(() => TripsService))
  private readonly tripsService: TripsService,
  private readonly aiService: AiService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly wellnessService: WellnessService,
  private readonly passengerAssistantService: PassengerAssistantService,
  ) {}

// Los guards de Nest solo interceptan @SubscribeMessage, no los hooks de
// ciclo de vida (OnGatewayConnection). Por eso validamos el JWT a mano acá:
// si no viene un token válido, el socket se rechaza antes de registrar nada.
async handleConnection(client: AuthedSocket) {
  try {
    const token =
      (client.handshake.auth?.token as string) ||
      (client.handshake.headers?.authorization as string)?.replace(
        'Bearer ',
        '',
        );

  if (!token) {
    this.logger.warn(`Socket ${client.id} rechazado: sin token`);
    client.emit('unauthorized', { message: 'No token provided' });
    client.disconnect(true);
    return;
  }

  const payload = await this.jwtService.verifyAsync(token, {
    secret: this.configService.get<string>('JWT_SECRET') || 'secret',
  });

  client.data.user = payload;
    await this.locationService.registerSocket(payload.sub, client.id);
    this.logger.log(`User ${payload.sub} connected as ${client.id}`);
  } catch (err) {
    this.logger.warn(`Socket ${client.id} rechazado: token inválido`);
    client.emit('unauthorized', { message: 'Invalid or expired token' });
    client.disconnect(true);
  }
}

async handleDisconnect(client: AuthedSocket) {
  const userId = client.data?.user?.sub;
  if (userId) {
    await this.locationService.removeSocket(userId);
    this.logger.log(`User ${userId} disconnected`);
  } else {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
}

// Verifica que quien llama sea el conductor o el pasajero del viaje.
// Evita que cualquier socket autenticado pueda mover el estado de un viaje
// ajeno solo con adivinar/tener el tripId.
private async assertTripParty(
  tripId: string,
  userId: string,
  role: 'driver' | 'passenger' | 'either',
  ) {
  const trip = await this.tripsService.getTrip(tripId);
  const isDriver = trip.driver?.id === userId;
  const isPassenger = trip.passenger?.id === userId;

  const authorized =
    role === 'driver'
  ? isDriver
    : role === 'passenger'
  ? isPassenger
    : isDriver || isPassenger;

  if (!authorized) {
    throw new Error('No autorizado para este viaje');
  }
  return trip;
}

// client.data.user es opcional en el tipo porque handleConnection lo llena
// de forma asíncrona; los handlers con @UseGuards(WsJwtGuard) solo se
// ejecutan si ya está autenticado, así que acá lo garantizamos en runtime
// y evitamos repetir el chequeo en cada handler.
private getUser(client: AuthedSocket) {
  const user = client.data.user;
  if (!user) {
    throw new WsException('No autenticado');
  }
  return user;
}

@UseGuards(WsJwtGuard)
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    data: {
      lat: number;
      lng: number;
      serviceType?: string;
    },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'driver') return;

  await this.locationService.updateDriverLocation(
    user.sub,
    data.lat,
    data.lng,
    data.serviceType,
    );

  this.server.emit('driverLocationUpdated', {
    driverId: user.sub,
    lat: data.lat,
    lng: data.lng,
  });

  // Chequeo de bienestar: no hace nada a menos que el conductor haya
  // dado consentimiento explícito y ya haya pasado el intervalo mínimo
  // desde el último chequeo (ver WellnessService).
  const checkIn = await this.wellnessService.maybeTriggerCheckIn(user.sub);
    if (checkIn) {
      client.emit('wellnessCheckIn', checkIn);
    }
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('wellnessCheckInResponse')
  async handleWellnessCheckInResponse(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { checkInId: string; response: string },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'driver') return;

  const checkIn = await this.wellnessService.recordResponse(
    data.checkInId,
    data.response,
    );
    client.emit('wellnessCheckInAck', { checkInId: checkIn.id });
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('findDrivers')
  async handleFindDrivers(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { lat: number; lng: number; serviceType?: string },
    ) {
    const driversResults = await this.locationService.findNearbyDrivers(
      data.lat,
      data.lng,
      5,
      data.serviceType,
      );

  const formattedDrivers = driversResults.map((result: any) => ({
    driverId: result[0],
    distance: result[1],
    coords: {
      lng: parseFloat(result[2][0]),
      lat: parseFloat(result[2][1]),
    },
  }));

  client.emit('nearbyDrivers', formattedDrivers);
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('requestTrip')
  async handleTripRequest(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    data: {
      pickup: { lat: number; lng: number; name: string };
      destination: { lat: number; lng: number; name: string };
      routeName?: string;
      serviceType?: string;
      seats?: number;
      van?: boolean;
    },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'passenger') {
      throw new Error('Solo un pasajero puede solicitar un viaje');
    }
    const passengerId = user.sub;

  // 1. Persist trip to Database via TripsService
  const trip = await this.tripsService.requestTrip(
    { id: passengerId } as any,
    {
      pickupName: data.pickup.name,
      lat1: data.pickup.lat,
      lng1: data.pickup.lng,
      destName: data.destination.name,
      lat2: data.destination.lat,
      lng2: data.destination.lng,
      routeName: data.routeName,
      serviceType: data.serviceType,
      seats: data.seats,
      van: data.van,
    },
    );

  // 2. Confirmarle al pasajero el precio cotizado (es el que se cobra)
  client.emit('tripRequested', {
    tripId: trip.id,
    fare: Number(trip.fare),
    baseFare: Number(trip.baseFare),
    distanceKm: Number(trip.distanceKm || 0),
    serviceType: trip.serviceType,
  });

  // 3. Avisar a los conductores cercanos y arrancar la cuenta regresiva
  const notified = await this.notifyDrivers(trip, client.id, 0);
  this.armSearchTimeout(trip, client);

  this.logger.log(`Trip ${trip.id} requested. Notified ${notified} potential drivers.`);
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('acceptTrip')
  async handleAcceptTrip(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody()
    data: { tripId: string; passengerSocketId: string },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'driver') {
      throw new Error('Solo un conductor puede aceptar un viaje');
    }
    const driverId = user.sub;

  // 1. Update Trip in DB (falla si otro conductor ya la tomó)
  let trip: any;
  try {
    trip = await this.tripsService.acceptTrip({ id: driverId } as any, data.tripId);
  } catch (e) {
    client.emit('tripUnavailable', { tripId: data.tripId, message: e?.message || 'Viaje no disponible' });
    return;
  }
  this.clearSearchTimer(data.tripId);

  // 2. Join both to a Trip Room
  client.join(`trip_${data.tripId}`);
    const passengerSocket = this.server.sockets.sockets.get(
      data.passengerSocketId,
      );
    if (passengerSocket) {
      passengerSocket.join(`trip_${data.tripId}`);
    }

  // 3. Notify passenger
  this.server.to(data.passengerSocketId).emit('tripAccepted', {
    driverId,
    tripId: data.tripId,
    fare: Number(trip?.fare ?? 0),
  });

  this.logger.log(
    `Trip ${data.tripId} accepted by driver ${driverId}. Room created.`,
    );
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('driverArrived')
  async handleDriverArrived(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string },
    ) {
    await this.assertTripParty(data.tripId, this.getUser(client).sub, 'driver');
    await this.tripsService.driverArrived(data.tripId);
    this.server
    .to(`trip_${data.tripId}`)
    .emit('driverArrived', { tripId: data.tripId });
    this.logger.log(`Driver arrived for trip ${data.tripId}.`);
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('startTrip')
  async handleStartTrip(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string },
    ) {
    await this.assertTripParty(data.tripId, this.getUser(client).sub, 'driver');
    await this.tripsService.startTrip(data.tripId);
    this.server
    .to(`trip_${data.tripId}`)
    .emit('tripStarted', { tripId: data.tripId });
    this.logger.log(`Trip ${data.tripId} started.`);
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('completeTrip')
  async handleCompleteTrip(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string },
    ) {
    await this.assertTripParty(data.tripId, this.getUser(client).sub, 'driver');
    await this.tripsService.completeTrip(data.tripId);
    this.server
    .to(`trip_${data.tripId}`)
    .emit('tripCompleted', { tripId: data.tripId });
    this.logger.log(`Trip ${data.tripId} completed.`);
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('cancelTrip')
  async handleCancelTrip(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string; reason?: string },
    ) {
    await this.assertTripParty(data.tripId, this.getUser(client).sub, 'either');
    this.clearSearchTimer(data.tripId);
    await this.tripsService.cancelTrip(data.tripId);
    client.emit('tripCancelled', { tripId: data.tripId, reason: data.reason });
    this.server
    .to(`trip_${data.tripId}`)
    .emit('tripCancelled', { tripId: data.tripId, reason: data.reason });
    this.logger.log(`Trip ${data.tripId} cancelled.`);
  }

// El pasajero sube la oferta cuando nadie ha tomado la solicitud
@UseGuards(WsJwtGuard)
  @SubscribeMessage('raiseOffer')
  async handleRaiseOffer(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string; offeredFare: number },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'passenger') return;
    try {
      const trip = await this.tripsService.raiseOffer(data.tripId, user.sub, data.offeredFare);
      client.emit('offerRaised', {
        tripId: trip.id,
        fare: Number(trip.offeredFare),
        raisesLeft: Math.max(0, OFERTA.maxSubidas - trip.raises),
      });
      await this.notifyDrivers(trip, client.id, trip.raises);
      this.armSearchTimeout(trip, client);
    } catch (e) {
      client.emit('raiseOfferError', { tripId: data.tripId, message: e?.message || 'No se pudo subir la oferta' });
    }
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string; message: string },
    ) {
    const senderId = this.getUser(client).sub;
    await this.assertTripParty(data.tripId, senderId, 'either');

  // AI Enhancement: Simulated Translation
  const translatedContent = await this.aiService.translateMessage(
    data.message,
    );

  this.server.to(`trip_${data.tripId}`).emit('newMessage', {
    tripId: data.tripId,
    senderId,
    message: data.message, // Original
    translated: translatedContent, // Enhanced content
    timestamp: new Date().toISOString(),
  });
    this.logger.log(
      `Message from ${senderId} in trip ${data.tripId}: ${data.message} (AI Trans: ${translatedContent})`,
      );
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('sosAlert')
  async handleSosAlert(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { tripId: string; lat: number; lng: number },
    ) {
    const user = this.getUser(client);
    const trip = await this.assertTripParty(data.tripId, user.sub, 'passenger');

  const alert = await this.passengerAssistantService.triggerSos({
    tripId: data.tripId,
    passengerId: user.sub,
    driverFcmToken: trip.driver?.fcmToken,
    lat: data.lat,
    lng: data.lng,
  });

  // Se avisa a todos en la sala del viaje (conductor y pasajero). El
  // conductor además recibe una notificación push si tiene token FCM
  // registrado (ver PassengerAssistantService.triggerSos) — no hay
  // integración con servicios de emergencia externos, ver nota de alcance
  // en el PR.
  this.server.to(`trip_${data.tripId}`).emit('sosAlertTriggered', {
    tripId: data.tripId,
    alertId: alert.id,
    lat: data.lat,
    lng: data.lng,
  });

  this.logger.warn(
    `SOS del pasajero ${user.sub} en viaje ${data.tripId} propagado a la sala del viaje.`,
    );
  }

@UseGuards(WsJwtGuard)
  @SubscribeMessage('assistantChatMessage')
  async handleAssistantChatMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { message: string },
    ) {
    const user = this.getUser(client);
    if (user.role !== 'passenger') return;

  // El chat solo responde si el pasajero activó el asistente en sus
  // preferencias (ver PassengerAssistantService.chat) — si no, el service
  // lanza y acá se lo devolvemos al cliente como un evento de error, no
  // como una excepción de socket sin manejar.
  try {
    const { reply } = await this.passengerAssistantService.chat(
      user.sub,
      data.message,
      );
    client.emit('assistantChatReply', { reply });
  } catch (error) {
    client.emit('assistantChatError', {
      message: error?.message || 'No se pudo procesar el mensaje',
    });
  }
  }
}
