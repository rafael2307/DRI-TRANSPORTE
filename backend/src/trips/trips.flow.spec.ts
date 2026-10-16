import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip, TripStatus, ServiceType } from './entities/trip.entity';
import { PaymentsService } from '../payments/payments.service';
import { LocationService } from '../location/location.service';

// Flujo: recogida → destino → precio → (nadie lo toma) subir oferta → conductor acepta
describe('TripsService – flujo recogida/destino/oferta', () => {
  let service: TripsService;
  const store: Record<string, any> = {};
  const repo = {
    create: jest.fn((x) => ({ id: 'T1', ...x })),
    save: jest.fn(async (x) => {
      store[x.id] = { ...x };
      return store[x.id];
    }),
    findOne: jest.fn(async ({ where }) =>
      store[where.id] ? { ...store[where.id] } : null,
    ),
    update: jest.fn(),
  };
  const payments = {
    getRoutePrice: jest.fn(async () => ({
      price: 5000,
      isFree: false,
      configured: false,
    })),
  };

  beforeEach(async () => {
    Object.keys(store).forEach((k) => delete store[k]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: getRepositoryToken(Trip), useValue: repo },
        { provide: PaymentsService, useValue: payments },
        { provide: LocationService, useValue: {} },
      ],
    }).compile();
    service = module.get(TripsService);
  });

  const pedirTaxi = () =>
    service.requestTrip({ id: 'P1' } as any, {
      pickupName: 'Mi ubicación',
      lat1: 10.473,
      lng1: -73.25,
      destName: 'Centro',
      lat2: 10.4631,
      lng2: -73.2532,
      serviceType: 'URBAN',
    });

  it('cotiza Taxi con la tarifa real (mínimo $10.000) y guarda precio base = vigente', async () => {
    const t = await pedirTaxi();
    expect(t.fare).toBe(10000);
    expect(t.baseFare).toBe(10000);
    expect(t.offeredFare).toBe(10000);
    expect(t.status).toBe(TripStatus.REQUESTED);
  });

  it('cotiza Viajes por puesto con la ruta real', async () => {
    const q = await service.quote({
      pickup: { lat: 10.4631, lng: -73.2532 },
      destination: { lat: 11.538, lng: -72.917, name: 'Riohacha' },
      serviceType: ServiceType.INTERMUNICIPAL,
      seats: 2,
    });
    expect(q.fare).toBe(130000);
    expect(q.maxFare).toBe(195000);
  });

  it('rechaza un Viaje a una ruta sin tarifa', async () => {
    await expect(
      service.quote({
        pickup: { lat: 10.4631, lng: -73.2532 },
        destination: { lat: 4.6, lng: -74.08, name: 'Bogotá' },
        serviceType: ServiceType.INTERMUNICIPAL,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no deja pedir sin recogida y destino confirmados', async () => {
    await expect(
      service.requestTrip({ id: 'P1' } as any, {
        pickupName: 'x',
        lat1: 10.47,
        lng1: -73.25,
        destName: '',
        lat2: undefined as any,
        lng2: undefined as any,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('subir oferta: solo hacia arriba, redondeada a $500, tope +50 %, máximo 3 veces', async () => {
    await pedirTaxi();
    let t = await service.raiseOffer('T1', 'P1', 11000);
    expect(t.offeredFare).toBe(11000);
    expect(t.raises).toBe(1);
    await expect(service.raiseOffer('T1', 'P1', 10500)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    t = await service.raiseOffer('T1', 'P1', 99999); // se limita al tope
    expect(t.offeredFare).toBe(15000);
    await expect(service.raiseOffer('T1', 'P1', 16000)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    store.T1.offeredFare = 12000; // forzamos un caso con margen para probar el máximo de subidas
    await service.raiseOffer('T1', 'P1', 13000);
    await expect(service.raiseOffer('T1', 'P1', 14000)).rejects.toThrow(
      'máximo de subidas',
    );
  });

  it('otro pasajero no puede subir la oferta de un viaje ajeno', async () => {
    await pedirTaxi();
    await expect(
      service.raiseOffer('T1', 'OTRO', 12000),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el conductor acepta con el precio vigente y nadie más puede tomarlo', async () => {
    await pedirTaxi();
    await service.raiseOffer('T1', 'P1', 12000);
    const t = await service.acceptTrip({ id: 'D1' } as any, 'T1');
    expect(t.status).toBe(TripStatus.ACCEPTED);
    expect(t.fare).toBe(12000);
    await expect(
      service.acceptTrip({ id: 'D2' } as any, 'T1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.raiseOffer('T1', 'P1', 13000)).rejects.toThrow(
      'ya no está abierta',
    );
  });
});
