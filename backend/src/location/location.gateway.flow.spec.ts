import { LocationGateway, ESPERA_BUSQUEDA_MS } from './location.gateway';
import { TripStatus } from '../trips/entities/trip.entity';

// Prueba del flujo por sockets con temporizadores simulados
describe('LocationGateway – búsqueda, subir oferta y aceptación', () => {
  jest.useFakeTimers();
  let trip: any;
  const emitted: Array<[string, string, any]> = [];
  const mkClient = (id: string, role: string, sub: string) => ({
    id,
    data: { user: { sub, role, username: sub } },
    join: jest.fn(),
    emit: (ev: string, p: any) => emitted.push([id, ev, p]),
  });
  const server: any = {
    to: (room: string) => ({
      emit: (ev: string, p: any) => emitted.push([room, ev, p]),
    }),
    emit: jest.fn(),
    sockets: { sockets: new Map() },
  };
  const tripsService: any = {
    requestTrip: jest.fn(async () => trip),
    findOne: jest.fn(async () => trip),
    raiseOffer: jest.fn(async (_id, _p, v) => {
      trip = { ...trip, offeredFare: v, fare: v, raises: trip.raises + 1 };
      return trip;
    }),
    acceptTrip: jest.fn(async () => {
      if (trip.status !== TripStatus.REQUESTED)
        throw new Error('Este viaje ya fue tomado o cancelado');
      trip = { ...trip, status: TripStatus.ACCEPTED };
      return trip;
    }),
  };
  const locationService: any = {
    findNearbyDrivers: jest.fn(async () => [['D1'], ['D2']]),
    getSocketByUserId: jest.fn(async (u) => 'sock-' + u),
  };
  const gw = new LocationGateway(
    locationService,
    tripsService,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  (gw as any).server = server;

  beforeEach(() => {
    emitted.length = 0;
    trip = {
      id: 'T1',
      status: TripStatus.REQUESTED,
      serviceType: 'URBAN',
      fare: 10000,
      baseFare: 10000,
      offeredFare: 10000,
      raises: 0,
      pickupLat: 10.47,
      pickupLng: -73.25,
      pickupLocationName: 'Mi ubicación',
      destinationLat: 10.46,
      destinationLng: -73.25,
      destinationName: 'Centro',
      distanceKm: 1.5,
    };
  });

  const pedir = (c: any) =>
    gw.handleTripRequest(c, {
      pickup: { lat: 10.47, lng: -73.25, name: 'Mi ubicación' },
      destination: { lat: 10.46, lng: -73.25, name: 'Centro' },
      serviceType: 'URBAN',
    });
  const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  };

  it('confirma el precio al pasajero y avisa a los conductores cercanos', async () => {
    const p = mkClient('pax', 'passenger', 'P1');
    await pedir(p);
    expect(
      emitted.find((e) => e[0] === 'pax' && e[1] === 'tripRequested')![2].fare,
    ).toBe(10000);
    expect(
      emitted.filter((e) => e[1] === 'newTripRequest').map((e) => e[0]),
    ).toEqual(['sock-D1', 'sock-D2']);
  });

  it('si nadie lo toma en 45 s, abre el menú de subir oferta (una sola vez)', async () => {
    const p = mkClient('pax', 'passenger', 'P1');
    await pedir(p);
    jest.advanceTimersByTime(ESPERA_BUSQUEDA_MS.URBAN - 1000);
    await flush();
    expect(emitted.some((e) => e[1] === 'noDriverFound')).toBe(false);
    jest.advanceTimersByTime(1000);
    await flush();
    const nd = emitted.filter((e) => e[1] === 'noDriverFound');
    expect(nd).toHaveLength(1);
    expect(nd[0][2]).toMatchObject({
      tripId: 'T1',
      baseFare: 10000,
      currentFare: 10000,
      maxFare: 15000,
      raisesLeft: 3,
    });
  });

  it('subir oferta reenvía a conductores con la etiqueta y reinicia la cuenta', async () => {
    const p = mkClient('pax', 'passenger', 'P1');
    await pedir(p);
    jest.advanceTimersByTime(ESPERA_BUSQUEDA_MS.URBAN);
    await flush();
    emitted.length = 0;
    await gw.handleRaiseOffer(p as any, { tripId: 'T1', offeredFare: 11000 });
    expect(emitted.find((e) => e[1] === 'offerRaised')![2]).toMatchObject({
      fare: 11000,
      raisesLeft: 2,
    });
    const r = emitted.filter((e) => e[1] === 'tripOfferRaised');
    expect(r).toHaveLength(2);
    expect(r[0][2]).toMatchObject({ fare: 11000, baseFare: 10000, raised: 1 });
    jest.advanceTimersByTime(ESPERA_BUSQUEDA_MS.URBAN);
    await flush();
    expect(emitted.filter((e) => e[1] === 'noDriverFound')).toHaveLength(1);
  });

  it('al aceptar se limpia la cuenta regresiva y el pasajero recibe el precio final', async () => {
    const p = mkClient('pax', 'passenger', 'P1');
    const d = mkClient('drv', 'driver', 'D1');
    await pedir(p);
    await gw.handleAcceptTrip(d as any, {
      tripId: 'T1',
      passengerSocketId: 'pax',
    });
    expect(
      emitted.find((e) => e[0] === 'pax' && e[1] === 'tripAccepted')![2],
    ).toMatchObject({ tripId: 'T1', fare: 10000 });
    jest.advanceTimersByTime(ESPERA_BUSQUEDA_MS.URBAN * 2);
    await flush();
    expect(emitted.some((e) => e[1] === 'noDriverFound')).toBe(false);
    // un segundo conductor ya no puede tomarlo
    const d2 = mkClient('drv2', 'driver', 'D2');
    await gw.handleAcceptTrip(d2 as any, {
      tripId: 'T1',
      passengerSocketId: 'pax',
    });
    expect(
      emitted.find((e) => e[0] === 'drv2' && e[1] === 'tripUnavailable'),
    ).toBeTruthy();
  });
});
