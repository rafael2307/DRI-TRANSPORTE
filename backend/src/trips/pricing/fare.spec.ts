import {
  tarifaTaxi,
  precioRutaViajes,
  tarifaViaje,
  ofertaMinima,
  esNoche,
  esAeropuerto,
  roadKm,
} from './fare';

// 1 p. m. y 10 p. m. hora de Colombia (UTC-5)
const DIA = new Date('2026-10-16T18:00:00Z');
const NOCHE = new Date('2026-10-17T03:00:00Z');

describe('Tarifas reales de Taxi (iguales al bot de WhatsApp)', () => {
  it('servicio mínimo de $10.000 en recorridos cortos', () => {
    expect(tarifaTaxi(0.8, DIA)).toBe(10000);
    expect(tarifaTaxi(3, DIA)).toBe(10000);
    expect(tarifaTaxi(6.3, DIA)).toBe(10000);
  });
  it('después de 3 km cobra $1.200 por km, redondeado a $500', () => {
    expect(tarifaTaxi(8, DIA)).toBe(12000);
    expect(tarifaTaxi(12, DIA)).toBe(17000);
  });
  it('recargo nocturno de $1.500 de 9 p. m. a 5 a. m.', () => {
    expect(esNoche(NOCHE)).toBe(true);
    expect(esNoche(DIA)).toBe(false);
    expect(tarifaTaxi(2, NOCHE)).toBe(11500);
    expect(tarifaTaxi(8, NOCHE)).toBe(13500);
  });
  it('aeropuerto: $15.000 fijos, de día y de noche', () => {
    expect(
      tarifaTaxi(9, DIA, {
        lat: 10.47,
        lng: -73.25,
        name: 'Aeropuerto Alfonso López',
      }),
    ).toBe(15000);
    expect(
      tarifaTaxi(9, NOCHE, { lat: 10.4372, lng: -73.249, name: 'Cl. 44' }),
    ).toBe(15000);
    expect(esAeropuerto({ lat: 10.455, lng: -73.249, name: 'Cra 19' })).toBe(
      false,
    );
  });
  it('oferta mínima del pasajero: $8.000, o 70 % en servicios largos', () => {
    expect(ofertaMinima(10000, 'URBAN')).toBe(8000);
    expect(ofertaMinima(17000, 'URBAN')).toBe(12000);
  });
});

describe('Tarifas reales de Viajes (precio por puesto desde Valledupar)', () => {
  it('lee la tabla de rutas sin importar tildes ni mayúsculas', () => {
    expect(precioRutaViajes('Riohacha')).toBe(65000);
    expect(precioRutaViajes('la paz')).toBe(10000);
    expect(precioRutaViajes('Curumaní')).toBe(55000);
    expect(precioRutaViajes('Bogotá')).toBeNull();
  });
  it('multiplica por puestos y descuenta 20 % en vans', () => {
    expect(tarifaViaje(65000, 2)).toBe(130000);
    expect(tarifaViaje(65000, 1, true)).toBe(52000);
  });
  it('distancia aproximada = línea recta × 1,25', () => {
    const km = roadKm(
      { lat: 10.4631, lng: -73.2532 },
      { lat: 11.538, lng: -72.917 },
    );
    expect(km).toBeGreaterThan(150);
    expect(km).toBeLessThan(160);
  });
});

import { RUTAS_LISTA } from './tarifas';
describe('Lista de rutas para la app', () => {
  it('cada destino de la lista tiene la misma tarifa que la tabla de cobro', () => {
    for (const r of RUTAS_LISTA) expect(precioRutaViajes(r.name)).toBe(r.pricePerSeat);
    expect(RUTAS_LISTA.length).toBeGreaterThan(30);
  });
});
