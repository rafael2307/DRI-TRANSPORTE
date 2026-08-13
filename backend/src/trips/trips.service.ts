import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus, ServiceType } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from '../payments/payments.service';
import { LocationService } from '../location/location.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => LocationService))
    private locationService: LocationService,
  ) {}

  async requestTrip(
    passenger: User,
    data: {
      pickupName: string;
      lat1: number;
      lng1: number;
      destName: string;
      lat2: number;
      lng2: number;
      routeName?: string;
      serviceType?: string;
    },
  ) {
    const pricing = await this.paymentsService.getRoutePrice(
      data.routeName || 'default',
      data.serviceType,
    );

    const trip = this.tripRepo.create({
      passenger,
      pickupLocationName: data.pickupName,
      pickupLat: data.lat1,
      pickupLng: data.lng1,
      destinationName: data.destName,
      destinationLat: data.lat2,
      destinationLng: data.lng2,
      fare: pricing.price,
      isFree: pricing.isFree,
      status: TripStatus.REQUESTED,
      serviceType: (data.serviceType as any) || ServiceType.URBAN,
    });

    return this.tripRepo.save(trip);
  }

  async acceptTrip(driver: User, tripId: string) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['passenger'],
    });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.driver = driver;
    trip.status = TripStatus.ACCEPTED;
    return this.tripRepo.save(trip);
  }

  async updateTripStatus(tripId: string, status: TripStatus) {
    return this.tripRepo.update(tripId, { status });
  }

  async driverArrived(tripId: string) {
    return this.updateTripStatus(tripId, TripStatus.ARRIVED);
  }

  async startTrip(tripId: string) {
    return this.updateTripStatus(tripId, TripStatus.IN_PROGRESS);
  }

  async completeTrip(tripId: string) {
    return this.updateTripStatus(tripId, TripStatus.COMPLETED);
  }

  async cancelTrip(tripId: string) {
    return this.updateTripStatus(tripId, TripStatus.CANCELLED);
  }

  async getTrip(tripId: string) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['passenger', 'driver'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }
}
