// Máquina de estados del nuevo flujo de solicitud (Taxi y Viaje).
// PICKUP → DESTINATION → QUOTE → SEARCHING ─┬─(acepta conductor)→ ACCEPTED
//                                            ├─(timeout)→ RAISE_OFFER ─(envía oferta)→ SEARCHING
//                                            └─(cancela)→ PICKUP
// Es JavaScript puro (sin React) para poder probarlo aparte: src/flow/requestFlow.test.js

export const STEPS = ['PICKUP', 'DESTINATION', 'QUOTE', 'SEARCHING', 'RAISE_OFFER', 'ACCEPTED'];
export const TITLES = { PICKUP: '¿Dónde te recogemos?', DESTINATION: '¿Para dónde vas?', QUOTE: 'Tu precio' };
export const SEARCH_SECONDS = { URBAN: 45, INTERMUNICIPAL: 90 };
export const OFFER = { step: 0.1, maxUp: 0.5, maxRaises: 3 };

export const roundTo = (n, s) => Math.round(n / s) * s;
export const offerRounding = (serviceType) => (serviceType === 'URBAN' ? 500 : 1000);
export const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');

export const initialState = (serviceType = 'URBAN') => ({
  step: 'PICKUP', serviceType, pickup: null, destination: null, seats: 1,
  quote: null, tripId: null, offer: null, error: null, driver: null,
});

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_SERVICE':
      return initialState(action.serviceType);
    case 'SET_PICKUP':
      return { ...state, pickup: action.pickup, error: null };
    case 'CONFIRM_PICKUP':
      if (!state.pickup) return { ...state, error: 'Confirma dónde te recogemos' };
      return { ...state, step: 'DESTINATION', error: null };
    case 'SET_DESTINATION':
      return { ...state, destination: action.destination, error: null };
    case 'SET_SEATS':
      return { ...state, seats: Math.max(1, Math.min(4, action.seats)) };
    case 'CONFIRM_DESTINATION':
      if (!state.destination) return { ...state, error: 'Confirma para dónde vas' };
      return { ...state, step: 'QUOTE', quote: null, error: null };
    case 'QUOTE_OK':
      return { ...state, quote: action.quote, error: null };
    case 'QUOTE_FAIL':
      return { ...state, error: action.message };
    case 'CHANGE_DESTINATION':
      return { ...state, step: 'DESTINATION', quote: null };
    case 'REQUEST':
      if (!state.pickup || !state.destination || !state.quote) return { ...state, error: 'Falta la recogida, el destino o el precio' };
      return { ...state, step: 'SEARCHING', error: null };
    case 'TRIP_REQUESTED':
      return { ...state, tripId: action.tripId, quote: { ...state.quote, fare: action.fare } };
    case 'NO_DRIVER': {
      if (state.step !== 'SEARCHING') return state; // solo una vez por ciclo
      return { ...state, step: 'RAISE_OFFER', offer: { base: action.baseFare, current: action.currentFare, max: action.maxFare, raisesLeft: action.raisesLeft, draft: action.currentFare } };
    }
    case 'BUMP': {
      if (!state.offer) return state;
      const o = state.offer, s = offerRounding(state.serviceType);
      const next = roundTo(o.draft + action.dir * o.base * OFFER.step, s);
      return { ...state, offer: { ...o, draft: Math.min(o.max, Math.max(o.current, next)) } }; // nunca baja de la oferta vigente
    }
    case 'SEND_OFFER':
      if (!state.offer || state.offer.draft <= state.offer.current || state.offer.raisesLeft <= 0) return state;
      return { ...state, step: 'SEARCHING' };
    case 'OFFER_RAISED':
      return { ...state, quote: { ...state.quote, fare: action.fare }, offer: { ...state.offer, current: action.fare, draft: action.fare, raisesLeft: action.raisesLeft } };
    case 'KEEP_WAITING':
      return { ...state, step: 'SEARCHING' };
    case 'ACCEPTED':
      return { ...state, step: 'ACCEPTED', driver: action.driver || null, quote: { ...state.quote, fare: action.fare ?? state.quote?.fare } };
    case 'CANCEL':
      return initialState(state.serviceType);
    default:
      return state;
  }
}
