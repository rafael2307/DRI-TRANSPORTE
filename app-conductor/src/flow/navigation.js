// Rutas GPS para el conductor con enlaces directos (sin SDK ni llaves).
export const NAV_APPS = { google: 'Google Maps', waze: 'Waze' };

export function routeUrl(lat, lng, app = 'google') {
    const la = Number(lat), lo = Number(lng);
    if (!isFinite(la) || !isFinite(lo)) return null;
    return app === 'waze'
        ? `https://waze.com/ul?ll=${la},${lo}&navigate=yes`
        : `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}&travelmode=driving`;
}

export const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');

// Etiqueta "Oferta subida +X" cuando el pasajero subió el precio
export function raisedLabel(trip) {
    if (!trip || !trip.raised) return null;
    const extra = Number(trip.fare) - Number(trip.baseFare || trip.fare);
    return extra > 0 ? `Oferta subida +${money(extra)}` : 'Oferta subida';
}
