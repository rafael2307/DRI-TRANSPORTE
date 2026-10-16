// Prueba del flujo sin dependencias: node src/flow/requestFlow.test.js
import assert from 'node:assert/strict';
import { reducer, initialState } from './requestFlow.js';

let s = initialState('URBAN');
const go = (a) => (s = reducer(s, a));
go({ type: 'CONFIRM_DESTINATION' }); assert.equal(s.step, 'PICKUP');
go({ type: 'CONFIRM_PICKUP' }); assert.equal(s.step, 'PICKUP'); assert.ok(s.error, 'no deja seguir sin recogida');
go({ type: 'SET_PICKUP', pickup: { lat: 10.47, lng: -73.25, name: 'Mi ubicación' } });
go({ type: 'CONFIRM_PICKUP' }); assert.equal(s.step, 'DESTINATION');
go({ type: 'CONFIRM_DESTINATION' }); assert.equal(s.step, 'DESTINATION'); assert.ok(s.error, 'no deja seguir sin destino');
go({ type: 'SET_DESTINATION', destination: { lat: 10.46, lng: -73.25, name: 'Centro' } });
go({ type: 'CONFIRM_DESTINATION' }); assert.equal(s.step, 'QUOTE');
go({ type: 'REQUEST' }); assert.equal(s.step, 'QUOTE'); assert.ok(s.error, 'no pide sin precio');
go({ type: 'QUOTE_OK', quote: { fare: 10000, distanceKm: 1.4, maxFare: 15000 } });
go({ type: 'REQUEST' }); assert.equal(s.step, 'SEARCHING');
go({ type: 'TRIP_REQUESTED', tripId: 'T1', fare: 10000 });
go({ type: 'NO_DRIVER', baseFare: 10000, currentFare: 10000, maxFare: 15000, raisesLeft: 3 }); assert.equal(s.step, 'RAISE_OFFER');
go({ type: 'NO_DRIVER', baseFare: 10000, currentFare: 10000, maxFare: 15000, raisesLeft: 3 }); assert.equal(s.step, 'RAISE_OFFER');
go({ type: 'BUMP', dir: -1 }); assert.equal(s.offer.draft, 10000, 'nunca baja');
go({ type: 'SEND_OFFER' }); assert.equal(s.step, 'RAISE_OFFER', 'no envía una oferta igual');
for (let i = 0; i < 10; i++) go({ type: 'BUMP', dir: 1 });
assert.equal(s.offer.draft, 15000, 'tope +50 %');
go({ type: 'BUMP', dir: -1 }); assert.equal(s.offer.draft, 14000);
go({ type: 'SEND_OFFER' }); assert.equal(s.step, 'SEARCHING');
go({ type: 'OFFER_RAISED', fare: 14000, raisesLeft: 2 }); assert.equal(s.quote.fare, 14000);
go({ type: 'ACCEPTED', fare: 14000 }); assert.equal(s.step, 'ACCEPTED'); assert.equal(s.quote.fare, 14000);
// Viaje: redondeo de $1.000
s = initialState('INTERMUNICIPAL');
go({ type: 'SET_PICKUP', pickup: { lat: 10.46, lng: -73.25 } }); go({ type: 'CONFIRM_PICKUP' });
go({ type: 'SET_DESTINATION', destination: { lat: 11.53, lng: -72.91, name: 'Riohacha' } }); go({ type: 'CONFIRM_DESTINATION' });
go({ type: 'QUOTE_OK', quote: { fare: 65000 } }); go({ type: 'REQUEST' });
go({ type: 'NO_DRIVER', baseFare: 65000, currentFare: 65000, maxFare: 97500, raisesLeft: 3 });
go({ type: 'BUMP', dir: 1 }); assert.equal(s.offer.draft, 72000, '+10 % redondeado a $1.000');
go({ type: 'CANCEL' }); assert.equal(s.step, 'PICKUP');
console.log('requestFlow: todas las pruebas pasaron');
