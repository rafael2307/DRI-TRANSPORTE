import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from './location.service';
import { TripsService } from '../trips/trips.service';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TripStatus } from '../trips/entities/trip.entity';
import { AiService } from '../ai/ai.service';

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

  constructor(
    private readonly locationService: LocationService,
    @Inject(forwardRef(() => TripsService))
    private readonly tripsService: TripsService,
    private readonly aiService: AiService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      await this.locationService.registerSocket(userId, client.id);
      this.logger.log(`User ${userId} connected as ${client.id}`);
    } else {
      this.logger.log(`Anonymous client connected: ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      await this.locationService.removeSocket(userId);
      this.logger.log(`User ${userId} disconnected`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      driverId: string;
      lat: number;
      lng: number;
      role: string;
      serviceType?: string;
    },
  ) {
    if (data.role === 'driver') {
      await this.locationService.updateDriverLocation(
        data.driverId,
        data.lat,
        data.lng,
        data.serviceType,
      );

      // Broadcast to nearby passengers or a general updates channel
      this.server.emit('driverLocationUpdated', {
        driverId: data.driverId,
        lat: data.lat,
        lng: data.lng,
      });
    }
  }

  @SubscribeMessage('findDrivers')
  async handleFindDrivers(
    @ConnectedSocket() client: Socket,
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

  @SubscribeMessage('requestTrip')
  async handleTripRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      passengerId: string;
      pickup: { lat: number; lng: number; name: string };
      destination: { lat: number; lng: number; name: string };
      routeName?: string;
      serviceType?: string;
    },
  ) {
    // 1. Persist trip to Database via TripsService
    // Note: we need to pass a partial User object or look it up.
    // For simplicity in this step, assume passengerId is valid.
    const trip = await this.tripsService.requestTrip(
      { id: data.passengerId } as any,
      {
        pickupName: data.pickup.name,
        lat1: data.pickup.lat,
        lng1: data.pickup.lng,
        destName: data.destination.name,
        lat2: data.destination.lat,
        lng2: data.destination.lng,
        routeName: data.routeName,
        serviceType: data.serviceType,
      },
    );

    // 2. Find nearby drivers for this specific service type
    const nearbyDrivers = await this.locationService.findNearbyDrivers(
      data.pickup.lat,
      data.pickup.lng,
      5,
      data.serviceType,
    );

    // 3. Notify drivers via their Socket IDs
    for (const driver of nearbyDrivers as any[]) {
      const driverId = driver[0];
      const socketId = await this.locationService.getSocketByUserId(driverId);

      if (socketId) {
        this.server.to(socketId).emit('newTripRequest', {
          tripId: trip.id,
          pickup: data.pickup,
          destination: data.destination,
          fare: trip.fare,
          passengerSocketId: client.id,
        });
      }
    }

    this.logger.log(
      `Trip ${trip.id} requested. Notified ${nearbyDrivers.length} potential drivers.`,
    );
  }

  @SubscribeMessage('acceptTrip')
  async handleAcceptTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { tripId: string; passengerSocketId: string; driverId: string },
  ) {
    // 1. Update Trip in DB
    await this.tripsService.acceptTrip(
      { id: data.driverId } as any,
      data.tripId,
    );

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
      driverId: data.driverId,
      tripId: data.tripId,
    });

    this.logger.log(
      `Trip ${data.tripId} accepted by driver ${data.driverId}. Room created.`,
    );
  }

  @SubscribeMessage('driverArrived')
  async handleDriverArrived(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    await this.tripsService.driverArrived(data.tripId);
    this.server
      .to(`trip_${data.tripId}`)
      .emit('driverArrived', { tripId: data.tripId });
    this.logger.log(`Driver arrived for trip ${data.tripId}.`);
  }

  @SubscribeMessage('startTrip')
  async handleStartTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    await this.tripsService.startTrip(data.tripId);
    this.server
      .to(`trip_${data.tripId}`)
      .emit('tripStarted', { tripId: data.tripId });
    this.logger.log(`Trip ${data.tripId} started.`);
  }

  @SubscribeMessage('completeTrip')
  async handleCompleteTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string },
  ) {
    await this.tripsService.completeTrip(data.tripId);
    this.server
      .to(`trip_${data.tripId}`)
      .emit('tripCompleted', { tripId: data.tripId });
    this.logger.log(`Trip ${data.tripId} completed.`);
  }

  @SubscribeMessage('cancelTrip')
  async handleCancelTrip(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; reason?: string },
  ) {
    await this.tripsService.cancelTrip(data.tripId);
    this.server
      .to(`trip_${data.tripId}`)
      .emit('tripCancelled', { tripId: data.tripId, reason: data.reason });
    this.logger.log(`Trip ${data.tripId} cancelled.`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tripId: string; senderId: string; message: string },
  ) {
    // AI Enhancement: Simulated Translation
    const translatedContent = await this.aiService.translateMessage(
      data.message,
    );

    this.server.to(`trip_${data.tripId}`).emit('newMessage', {
      tripId: data.tripId,
      senderId: data.senderId,
      message: data.message, // Original
      translated: translatedContent, // Enhanced content
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `Message from ${data.senderId} in trip ${data.tripId}: ${data.message} (AI Trans: ${translatedContent})`,
    );
  }
}
