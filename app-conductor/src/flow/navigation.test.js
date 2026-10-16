import assert from 'node:assert/strict';
import { routeUrl, raisedLabel } from './navigation.js';
assert.equal(routeUrl(10.47, -73.25), 'https://www.google.com/maps/dir/?api=1&destination=10.47,-73.25&travelmode=driving');
assert.equal(routeUrl('10.47', '-73.25', 'waze'), 'https://waze.com/ul?ll=10.47,-73.25&navigate=yes');
assert.equal(routeUrl(undefined, 3), null);
assert.equal(raisedLabel({ raised: 0, fare: 10000 }), null);
assert.equal(raisedLabel({ raised: 1, fare: 12000, baseFare: 10000 }), 'Oferta subida +$2.000');
console.log('navigation: todas las pruebas pasaron');
