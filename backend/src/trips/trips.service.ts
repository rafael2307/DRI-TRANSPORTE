import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus, ServiceType } from './entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from '../payments/payments.service';
import { LocationService } from '../location/location.service';
import {
  roadKm,
  tarifaTaxi,
  precioRutaViajes,
  tarifaViaje,
  roundTo,
  redondeoOferta,
  ServiceKind,
} from './pricing/fare';

// Reglas de la subida de oferta (ver docs/ESPECIFICACION_FLUJO_SOLICITUD.md)
export const OFERTA = { paso: 0.1, maxSubida: 0.5, maxSubidas: 3 };

export interface QuoteInput {
  pickup: { lat: number; lng: number; name?: string };
  destination: { lat: number; lng: number; name?: string };
  serviceType?: string;
  routeName?: string;
  seats?: number;
  van?: boolean;
  at?: Date;
}

export interface Quote {
  serviceType: ServiceKind;
  fare: number;
  distanceKm: number;
  isFree: boolean;
  seats: number;
  maxFare: number;
}

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
    private paymentsService: PaymentsService,
    @Inject(forwardRef(() => LocationService))
    private locationService: LocationService,
  ) {}

  /**
   * Cotiza un servicio con las tarifas reales. Lo que se cotiza es lo que se cobra
   * (salvo que el pasajero suba la oferta).
   */
  async quote(data: QuoteInput): Promise<Quote> {
    const tipo: ServiceKind =
      data.serviceType === ServiceType.INTERMUNICIPAL
        ? 'INTERMUNICIPAL'
        : 'URBAN';
    const km = roadKm(data.pickup, data.destination);
    const seats =
      tipo === 'URBAN' ? 1 : Math.max(1, Math.floor(data.seats || 1));
    const ruta = data.routeName || data.destination?.name || '';

    // Una ruta configurada en el panel admin (PaymentConfig) tiene prioridad.
    let configurado: { price: number; isFree: boolean } | null = null;
    if (ruta && ruta !== 'default') {
      const r = await this.paymentsService.getRoutePrice(ruta, tipo);
      if (r && (r as any).configured) configurado = r;
    }

    let fare: number;
    if (configurado) {
      fare = configurado.isFree
        ? 0
        : tipo === 'URBAN'
          ? configurado.price
          : tarifaViaje(configurado.price, seats, !!data.van);
    } else if (tipo === 'URBAN') {
      fare = tarifaTaxi(km, data.at || new Date(), data.destination);
    } else {
      const porPuesto = precioRutaViajes(ruta);
      if (!porPuesto) {
        throw new BadRequestException(
          `No hay tarifa para la ruta "${ruta}". Escoge un municipio de la lista.`,
        );
      }
      fare = tarifaViaje(porPuesto, seats, !!data.van);
    }

    const paso = redondeoOferta(tipo);
    return {
      serviceType: tipo,
      fare,
      distanceKm: km,
      isFree: !!configurado?.isFree,
      seats,
      maxFare: roundTo(fare * (1 + OFERTA.maxSubida), paso),
    };
  }

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
      seats?: number;
      van?: boolean;
    },
  ) {
    if (
      [data.lat1, data.lng1, data.lat2, data.lng2].some(
        (v) => typeof v !== 'number' || isNaN(v),
      )
    ) {
      throw new BadRequestException('Falta confirmar la recogida o el destino');
    }
    const q = await this.quote({
      pickup: { lat: data.lat1, lng: data.lng1, name: data.pickupName },
      destination: { lat: data.lat2, lng: data.lng2, name: data.destName },
      serviceType: data.serviceType,
      routeName: data.routeName,
      seats: data.seats,
      van: data.van,
    });

    const trip = this.tripRepo.create({
      passenger,
      pickupLocationName: data.pickupName,
      pickupLat: data.lat1,
      pickupLng: data.lng1,
      destinationName: data.destName,
      destinationLat: data.lat2,
      destinationLng: data.lng2,
      fare: q.fare,
      baseFare: q.fare,
      offeredFare: q.fare,
      raises: 0,
      distanceKm: q.distanceKm,
      seats: q.seats,
      isFree: q.isFree,
      status: TripStatus.REQUESTED,
      serviceType: q.serviceType as ServiceType,
    });

    return this.tripRepo.save(trip);
  }

  /**
   * El pasajero sube su oferta cuando nadie ha tomado la solicitud.
   * Nunca baja del precio base, tope +50 %, máximo 3 subidas.
   */
  async raiseOffer(tripId: string, passengerId: string, offeredFare: number) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['passenger'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.passenger?.id !== passengerId) throw new ForbiddenException();
    if (trip.status !== TripStatus.REQUESTED) {
      throw new BadRequestException('La solicitud ya no está abierta');
    }
    if ((trip.raises || 0) >= OFERTA.maxSubidas) {
      throw new BadRequestException('Llegaste al máximo de subidas');
    }
    const base = Number(trip.baseFare ?? trip.fare);
    const actual = Number(trip.offeredFare ?? base);
    const paso = redondeoOferta(trip.serviceType as ServiceKind);
    const max = roundTo(base * (1 + OFERTA.maxSubida), paso);
    const nuevo = Math.min(roundTo(Number(offeredFare), paso), max);
    if (!(nuevo > actual)) {
      throw new BadRequestException('La oferta debe ser mayor a la actual');
    }
    trip.offeredFare = nuevo;
    trip.fare = nuevo;
    trip.raises = (trip.raises || 0) + 1;
    return this.tripRepo.save(trip);
  }

  async acceptTrip(driver: User, tripId: string) {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId },
      relations: ['passenger'],
    });
    if (!trip) throw new NotFoundException('Trip not found');
    // Evita que dos conductores se queden con la misma solicitud
    if (trip.status !== TripStatus.REQUESTED) {
      throw new BadRequestException('Este viaje ya fue tomado o cancelado');
    }

    trip.driver = driver;
    trip.status = TripStatus.ACCEPTED;
    trip.fare = Number(trip.offeredFare ?? trip.fare);
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

  async findOne(tripId: string) {
    return this.tripRepo.findOne({ where: { id: tripId } });
  }
}
