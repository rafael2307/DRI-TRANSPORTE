// Tarifas REALES de RDI / Radiotaxiupar (las mismas que cobran los bots de WhatsApp).
// Fuente: hoja RADIOTAXIUPAR_URBANO_3006481639 (Tarifas_RDI) y hoja RADIOTAXIUPAR_VIAJES_3046028404 (Rutas).
// Vigentes al 16-oct-2026. Una ruta configurada en PaymentConfig (panel admin) tiene prioridad sobre esta tabla.

export const TARIFA_TAXI = {
  ciudad: 'Valledupar',
  base: 6000,
  kmIncluidos: 3,
  valorKm: 1200,
  minimo: 10000,
  recargoNocturno: 1500, // de 21:00 a 05:00, hora de Colombia
  redondeo: 500,
  aeropuerto: 15000, // tarifa fija al aeropuerto Alfonso López Pumarejo, sin recargo
  ofertaMinima: 8000,
  comisionPct: 10,
};

export const AEROPUERTO_VUP = { lat: 10.4375, lng: -73.2488, radioKm: 0.6 };

export const TARIFA_VIAJES = {
  salida: 'Valledupar',
  descuentoVan: 0.8, // vans de 8 y 12 puestos: 20 % menos por puesto
  redondeo: 1000,
  comisionPct: 10,
};

// Precio por PUESTO desde Valledupar (el regreso cuesta igual).
export const RUTAS_VIAJES: Record<string, number> = {
  'La Paz': 10000,
  Guacoche: 15000,
  'El Javo': 15000,
  'Los Cordobas': 15000,
  'Rio de Oro': 10000,
  'San Diego': 12000,
  'Agustin Codazzi': 20000,
  Codazzi: 20000,
  'San Juan del Cesar': 20000,
  'San Juan': 20000,
  'La Jagua del Pilar': 20000,
  Becerril: 25000,
  'El Alto': 25000,
  'El Molino': 25000,
  Fonseca: 30000,
  Distraccion: 30000,
  'La Jagua de Ibirico': 35000,
  'La Jagua': 35000,
  Barrancas: 35000,
  Papayal: 40000,
  'Hato Nuevo': 40000,
  'La Loma': 45000,
  Chiriguana: 45000,
  'El Paso': 50000,
  Albania: 50000,
  'San Roque': 50000,
  Curumani: 55000,
  'La Mata': 60000,
  Riohacha: 65000,
  Maicao: 65000,
  Aguachica: 65000,
  'Santa Fe': 80000,
  Rionegro: 80000,
  'La Union': 80000,
  Bosconia: 80000,
  'El Copey': 80000,
  'El Banco': 80000,
  Chimichagua: 80000,
  Tamalameque: 80000,
  Pailitas: 80000,
  Ocana: 80000,
  Uribia: 80000,
  Sincelejo: 90000,
  Abrego: 90000,
  'San Alberto': 100000,
};

// Lista para mostrar en la app (paso "¿Para dónde vas?" de Viajes): nombre, precio por puesto y coordenadas.
export const RUTAS_LISTA: Array<{
  name: string;
  pricePerSeat: number;
  lat: number;
  lng: number;
}> = [
  ['La Paz', 10000, 10.387, -73.171],
  ['San Diego', 12000, 10.336, -73.182],
  ['Guacoche', 15000, 10.497, -73.166],
  ['El Javo', 15000, 10.485, -73.185],
  ['Agustin Codazzi', 20000, 10.036, -73.236],
  ['San Juan del Cesar', 20000, 10.773, -73.002],
  ['La Jagua del Pilar', 20000, 10.509, -73.072],
  ['Becerril', 25000, 9.703, -73.229],
  ['El Molino', 25000, 10.652, -72.921],
  ['Fonseca', 30000, 10.889, -72.852],
  ['Distraccion', 30000, 10.897, -72.887],
  ['La Jagua de Ibirico', 35000, 9.564, -73.336],
  ['Barrancas', 35000, 10.956, -72.796],
  ['Hato Nuevo', 40000, 11.066, -72.763],
  ['Papayal', 40000, 10.997, -72.777],
  ['La Loma', 45000, 9.619, -73.595],
  ['Chiriguana', 45000, 9.361, -73.6],
  ['El Paso', 50000, 9.661, -73.746],
  ['Albania', 50000, 11.161, -72.592],
  ['San Roque', 50000, 9.29, -73.514],
  ['Curumani', 55000, 9.201, -73.543],
  ['La Mata', 60000, 8.612, -73.636],
  ['Riohacha', 65000, 11.538, -72.917],
  ['Maicao', 65000, 11.38, -72.242],
  ['Aguachica', 65000, 8.31, -73.614],
  ['Bosconia', 80000, 9.97, -73.891],
  ['El Copey', 80000, 10.149, -73.96],
  ['El Banco', 80000, 9.004, -73.974],
  ['Chimichagua', 80000, 9.258, -73.814],
  ['Tamalameque', 80000, 8.862, -73.811],
  ['Pailitas', 80000, 8.96, -73.626],
  ['Ocana', 80000, 8.239, -73.347],
  ['Uribia', 80000, 11.715, -72.266],
  ['Sincelejo', 90000, 9.305, -75.391],
  ['Abrego', 90000, 8.082, -73.135],
  ['San Alberto', 100000, 7.764, -73.393],
].map(([name, pricePerSeat, lat, lng]) => ({
  name: name as string,
  pricePerSeat: pricePerSeat as number,
  lat: lat as number,
  lng: lng as number,
}));
