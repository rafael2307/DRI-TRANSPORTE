# Especificación · Nuevo flujo de solicitud de servicio (Taxi y Viaje)

Aplica a `app-pasajero` (MapScreen), `app-conductor` (MapScreen) y `backend` (trips + location.gateway).
Taxi = `ServiceType.URBAN` · Viaje = `ServiceType.INTERMUNICIPAL`. El flujo es el mismo; cambian precios, tiempos y topes.

> Estado (16-oct-2026): **implementado** en la rama `feature/flujo-recogida-destino-oferta` — backend (cotización, subir oferta, temporizador de búsqueda), app del pasajero (pantallas del flujo) y app del conductor (etiqueta de oferta subida + ruta GPS). Pruebas: backend 83 (jest), flujo del pasajero y navegación del conductor (`npm run test:flow`), y ambas apps compilan para Android (`expo export`).

---

## 1. Flujo del pasajero (pantallas)

| # | Estado UI | Pregunta / acción | Salida |
|---|-----------|-------------------|--------|
| 1 | `PICKUP` | **"¿Dónde te recogemos?"** — mapa con pin movible, botón "Usar mi ubicación", buscador. Confirmar. | `pickup {lat,lng,address}` |
| 2 | `DESTINATION` | **"¿Para dónde vas?"** — Taxi: buscador/pin libre. Viaje: lista de municipios (ver §3). Confirmar. | `destination {lat,lng,address,name}` |
| 3 | `QUOTE` | Tarjeta con el **precio del servicio**, distancia y tiempo. Botones **Aceptar y pedir** / Cambiar destino. | `fare` |
| 4 | `SEARCHING` | "Buscando conductor…" con cuenta regresiva (Taxi 45 s · Viaje 90 s). Botón Cancelar. | — |
| 5 | `RAISE_OFFER` | Si nadie acepta: se abre un **menú inferior** "Nadie lo tomó todavía. ¿Subes la oferta?" con stepper `− / +` de 10 % del precio base (tope +50 %), botón **Enviar nueva oferta** y **Seguir esperando** / **Cancelar**. | `offeredFare` |
| 6 | `ACCEPTED` | Conductor, vehículo, placa, ETA. | — |
| 7 | `IN_PROGRESS` → `COMPLETED` | Como hoy. | — |

Reglas de la oferta:
- Incrementos de 10 % sobre `baseFare`, redondeados a $500 (Taxi) o $1.000 (Viaje). Máximo `baseFare × 1.5`.
- Nunca se permite bajar de `baseFare`.
- Cada subida reinicia la cuenta regresiva y se re-emite a conductores cercanos (evento `tripOfferRaised`).
- Máximo 3 subidas por solicitud; después solo "Seguir esperando" o "Cancelar".
- El precio mostrado en cada paso es exactamente el que se cobra (sin sorpresas al final).

## 2. Flujo del conductor

1. Llega `newTripRequest` con `pickup`, `destination`, `fare`, `distanceKm` y, si aplica, la etiqueta **"Oferta subida +X %"**.
2. Tarjeta "¡Nuevo viaje!" → **Rechazar / Aceptar** (como hoy).
3. Al aceptar se abre un menú de dos opciones: **"Ir al pasajero con ruta GPS"** (abre Google Maps / Waze con el punto de recogida) y **"Sin ruta"**. Tras "Iniciar viaje", el mismo menú ofrece la ruta hacia el destino.
4. Deep links (sin SDK ni claves):
   - Google Maps: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=driving`
   - Waze: `https://waze.com/ul?ll={lat},{lng}&navigate=yes`
   - Se usa `Linking.openURL`; la app recuerda la preferencia del conductor (`AsyncStorage: navApp`).

## 3. Precios (tarifas REALES, iguales a las de los bots de WhatsApp)

El precio sale **siempre del backend** (`POST /trips/quote`, código en `backend/src/trips/pricing/`). La app solo lo muestra.

**Taxi (URBAN), Valledupar**
```
fare = redondear500( max(10.000, 6.000 + max(0, km − 3) × 1.200) + (noche ? 1.500 : 0) )
noche = 21:00 a 05:00 hora de Colombia · aeropuerto Alfonso López = $15.000 fijos (sin recargo)
km = distancia en línea recta × 1,25
```
Ejemplos: 2 km $10.000 · 8 km $12.000 · 12 km $17.000 · 2 km de noche $11.500.

**Viaje (INTERMUNICIPAL)**: precio fijo **por puesto** desde Valledupar (el regreso cuesta igual), tabla `RUTAS_VIAJES`; vans de 8/12 puestos 20 % menos. Ejemplos: La Paz $10.000 · San Juan del Cesar $20.000 · Fonseca $30.000 · Curumaní $55.000 · Riohacha $65.000 · Bosconia $80.000. Una ruta configurada en el panel admin (`PaymentConfig`) tiene prioridad. `GET /trips/routes` da la lista para la app.

Se eliminó el urbano fijo de $8.500 de la app y el arreglo de municipios de Cundinamarca.

## 4. Máquina de estados

```
(none) → PICKUP → DESTINATION → QUOTE → SEARCHING ─┬─(acepta conductor)→ ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
                                                    ├─(timeout)→ RAISE_OFFER ─(envía oferta)→ SEARCHING
                                                    └─(cancela)→ CANCELLED
```

Backend: `TripStatus` ya cubre `REQUESTED … CANCELLED`. Se agregan columnas, no estados nuevos:

```ts
// trip.entity.ts
@Column({ type: 'int', nullable: true }) baseFare: number;      // precio cotizado
@Column({ type: 'int', nullable: true }) offeredFare: number;   // precio vigente (≥ baseFare)
@Column({ type: 'smallint', default: 0 }) raises: number;       // subidas usadas (máx. 3)
@Column({ type: 'varchar', nullable: true }) destinationName: string;
```

## 5. Eventos de socket

| Evento | Dirección | Payload |
|---|---|---|
| `requestTrip` | pasajero → servidor | `{pickup, destination, routeName, serviceType}` (sin cambios; el servidor calcula `fare`) |
| `newTripRequest` | servidor → conductores | `{tripId, pickup, destination, fare, distanceKm, raised, passengerSocketId}` |
| `raiseOffer` | pasajero → servidor | `{tripId, offeredFare}` |
| `tripOfferRaised` | servidor → conductores | `{tripId, fare, raised}` |
| `noDriverFound` | servidor → pasajero | `{tripId, baseFare, maxFare, raisesLeft}` (abre `RAISE_OFFER`) |
| `tripAccepted` | servidor → pasajero | sin cambios + `fare` final |

## 6. Código para pegar

### 6.1 `backend/src/trips/trips.service.ts`

```ts
const STEP = 0.10, MAX_UP = 0.50, MAX_RAISES = 3;
const rounding = (t: ServiceType) => (t === ServiceType.URBAN ? 500 : 1000);
const roundTo = (n: number, s: number) => Math.round(n / s) * s;

async raiseOffer(tripId: string, passengerId: string, offeredFare: number) {
  const trip = await this.tripRepo.findOneOrFail({ where: { id: tripId } });
  if (trip.passengerId !== passengerId) throw new ForbiddenException();
  if (trip.status !== TripStatus.REQUESTED) throw new BadRequestException('La solicitud ya no está abierta');
  if (trip.raises >= MAX_RAISES) throw new BadRequestException('Llegaste al máximo de subidas');

  const step = rounding(trip.serviceType);
  const max = roundTo(trip.baseFare * (1 + MAX_UP), step);
  const fare = Math.min(roundTo(offeredFare, step), max);
  if (fare <= trip.offeredFare) throw new BadRequestException('La oferta debe ser mayor a la actual');

  trip.offeredFare = fare;
  trip.raises += 1;
  return this.tripRepo.save(trip);
}
```

### 6.2 `backend/src/location/location.gateway.ts`

```ts
private searchTimers = new Map<string, NodeJS.Timeout>();

private armSearchTimeout(trip: Trip, client: Socket) {
  clearTimeout(this.searchTimers.get(trip.id));
  const ms = trip.serviceType === ServiceType.URBAN ? 45_000 : 90_000;
  this.searchTimers.set(trip.id, setTimeout(async () => {
    const t = await this.tripsService.findOne(trip.id);
    if (t.status !== TripStatus.REQUESTED) return;
    client.emit('noDriverFound', {
      tripId: t.id, baseFare: t.baseFare, currentFare: t.offeredFare,
      maxFare: Math.round(t.baseFare * 1.5), raisesLeft: 3 - t.raises,
    });
  }, ms));
}

// dentro de requestTrip, tras crear el viaje:
this.armSearchTimeout(trip, client);

@SubscribeMessage('raiseOffer')
async handleRaiseOffer(@ConnectedSocket() client: Socket, @MessageBody() d: { tripId: string; offeredFare: number }) {
  const trip = await this.tripsService.raiseOffer(d.tripId, client.data.userId, d.offeredFare);
  this.server.to('drivers').emit('tripOfferRaised', { tripId: trip.id, fare: trip.offeredFare, raised: trip.raises });
  this.armSearchTimeout(trip, client);
}

// en acceptTrip y cancelTrip: clearTimeout(this.searchTimers.get(tripId)); this.searchTimers.delete(tripId);
```

### 6.3 `app-pasajero/src/screens/MapScreen.js` (esqueleto)

```js
const [step, setStep] = useState('PICKUP'); // PICKUP|DESTINATION|QUOTE|SEARCHING|RAISE_OFFER|ACCEPTED
const [offer, setOffer] = useState(null);    // {base, current, max, raisesLeft}

const TITLES = { PICKUP: '¿Dónde te recogemos?', DESTINATION: '¿Para dónde vas?' };

socketService.on('noDriverFound', (d) => { setOffer({ base: d.baseFare, current: d.currentFare, max: d.maxFare, raisesLeft: d.raisesLeft }); setStep('RAISE_OFFER'); });

const bump = (dir) => setOffer(o => {
  const s = serviceType === 'URBAN' ? 500 : 1000;
  const next = Math.round((o.current + dir * o.base * 0.10) / s) * s;
  return { ...o, current: Math.min(o.max, Math.max(o.current, next)) }; // nunca baja
});

const sendOffer = () => { socketService.emit('raiseOffer', { tripId, offeredFare: offer.current }); setStep('SEARCHING'); };
```

Eliminar el arreglo `MUNICIPALITIES` de Cundinamarca y cargar destinos de `GET /routes?serviceType=INTERMUNICIPAL` (tabla `PaymentConfig`), de modo que los precios se editen desde el panel admin sin publicar la app.

### 6.4 `app-conductor/src/screens/MapScreen.js`

```js
import { Linking } from 'react-native';
const openRoute = (lat, lng, app = 'google') => Linking.openURL(
  app === 'waze' ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
                 : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);

// tras aceptar: Alert / bottom sheet con "Ir al pasajero con ruta GPS" → openRoute(pickup.lat, pickup.lng)
// tras "Iniciar viaje": ofrecer "Ruta al destino" → openRoute(destination.lat, destination.lng)
```

## 7. Criterios de aceptación

1. No se puede pedir sin recogida y destino confirmados.
2. El precio de la cotización = precio cobrado (salvo subida explícita del pasajero).
3. Sin conductor tras el tiempo límite, el menú de oferta aparece una sola vez por ciclo.
4. La oferta nunca baja del precio base ni pasa de +50 %; máximo 3 subidas.
5. El conductor ve la etiqueta de oferta subida y puede abrir la ruta GPS en ambos tramos.
6. Los timers se limpian al aceptar o cancelar (sin fugas ni avisos duplicados).
7. Taxi y Viaje usan el mismo código; solo cambian tarifa, tiempos y redondeo.

## 8. Dependencias abiertas

- Acceso de escritura al repositorio para subir la rama.
- Tarifas reales de Cesar y La Guajira (las de este documento son de referencia).
- La orden por WhatsApp vive en `feature/whatsapp-integration`, aún sin fusionar; el QR de los stickers depende de ella para cerrar el ciclo.
