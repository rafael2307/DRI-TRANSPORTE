import {
  TARIFA_TAXI,
  TARIFA_VIAJES,
  RUTAS_VIAJES,
  AEROPUERTO_VUP,
} from './tarifas';

export type ServiceKind = 'URBAN' | 'INTERMUNICIPAL';
export interface Punto {
  lat: number;
  lng: number;
  name?: string;
}

export const roundTo = (n: number, step: number) => Math.round(n / step) * step;

export function haversineKm(a: Punto, b: Punto): number {
  const R = 6371,
    d2r = Math.PI / 180;
  const dLa = (b.lat - a.lat) * d2r,
    dLo = (b.lng - a.lng) * d2r;
  const x =
    Math.sin(dLa / 2) ** 2 +
    Math.cos(a.lat * d2r) * Math.cos(b.lat * d2r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Distancia aproximada por calle/carretera: línea recta × 1,25. */
export function roadKm(a: Punto, b: Punto): number {
  return Math.round(haversineKm(a, b) * 1.25 * 100) / 100;
}

/** Hora de Colombia (UTC-5, sin horario de verano). */
export function horaColombia(fecha: Date): number {
  return new Date(fecha.getTime() - 5 * 3600_000).getUTCHours();
}

export function esNoche(fecha: Date): boolean {
  const h = horaColombia(fecha);
  return h >= 21 || h < 5;
}

const sinTildes = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export function esAeropuerto(dest: Punto): boolean {
  if (/aeropuerto|airport/.test(sinTildes(dest.name || ''))) return true;
  if (typeof dest.lat !== 'number' || typeof dest.lng !== 'number')
    return false;
  return haversineKm(dest, AEROPUERTO_VUP) <= AEROPUERTO_VUP.radioKm;
}

/** Tarifa de taxi: igual a la del bot de WhatsApp. */
export function tarifaTaxi(km: number, fecha: Date, destino?: Punto): number {
  const t = TARIFA_TAXI;
  if (destino && esAeropuerto(destino)) return t.aeropuerto;
  const extra = Math.max(0, km - t.kmIncluidos) * t.valorKm;
  const noche = esNoche(fecha) ? t.recargoNocturno : 0;
  return roundTo(Math.max(t.minimo, t.base + extra) + noche, t.redondeo);
}

/** Precio por puesto de un viaje desde Valledupar, o null si la ruta no existe. */
export function precioRutaViajes(destino: string): number | null {
  const n = sinTildes(destino);
  const k = Object.keys(RUTAS_VIAJES).find((r) => sinTildes(r) === n);
  return k ? RUTAS_VIAJES[k] : null;
}

export function tarifaViaje(
  precioPuesto: number,
  puestos = 1,
  van = false,
): number {
  const p = van
    ? roundTo(precioPuesto * TARIFA_VIAJES.descuentoVan, TARIFA_VIAJES.redondeo)
    : precioPuesto;
  return p * Math.max(1, Math.floor(puestos));
}

/** Lo mínimo que el pasajero puede ofrecer (regla del bot). */
export function ofertaMinima(tarifa: number, tipo: ServiceKind): number {
  if (tipo !== 'URBAN') return tarifa;
  return Math.min(
    tarifa,
    Math.max(TARIFA_TAXI.ofertaMinima, roundTo(tarifa * 0.7, 500)),
  );
}

export const redondeoOferta = (tipo: ServiceKind) =>
  tipo === 'URBAN' ? 500 : 1000;
