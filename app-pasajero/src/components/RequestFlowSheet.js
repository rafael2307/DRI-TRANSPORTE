import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MapPin, Navigation, Minus, Plus } from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { GradientButton } from './GradientButton';
import { theme } from '../theme/theme';
import { TITLES, SEARCH_SECONDS, money } from '../flow/requestFlow';

// Panel inferior del nuevo flujo: una pregunta por paso, el precio antes de pedir
// y el menú para subir la oferta si nadie toma la solicitud.
export function RequestFlowSheet({ state, dispatch, routes, gps, onUseGps, onRequest, onSendOffer, onCancel }) {
    const { step, serviceType, pickup, destination, quote, offer, error, seats } = state;
    const [count, setCount] = useState(SEARCH_SECONDS[serviceType]);

    useEffect(() => {
        if (step !== 'SEARCHING') return undefined;
        setCount(SEARCH_SECONDS[serviceType]);
        const t = setInterval(() => setCount((c) => Math.max(0, c - 1)), 1000);
        return () => clearInterval(t);
    }, [step, serviceType, quote?.fare]);

    const Err = () => (error ? <Text style={s.error}>{error}</Text> : null);

    if (step === 'PICKUP') {
        return (
            <GlassCard style={s.card}>
                <Text style={s.title}>{TITLES.PICKUP}</Text>
                <Text style={s.help}>Mueve el mapa o tócalo para poner el punto exacto.</Text>
                <TouchableOpacity style={s.row} onPress={onUseGps} disabled={!gps}>
                    <Navigation color={theme.colors.primary || '#3B82F6'} size={18} />
                    <Text style={s.rowText}>{pickup ? pickup.name : 'Usar mi ubicación'}</Text>
                </TouchableOpacity>
                <Err />
                <GradientButton title="Confirmar recogida" onPress={() => dispatch({ type: 'CONFIRM_PICKUP' })} disabled={!pickup} />
            </GlassCard>
        );
    }

    if (step === 'DESTINATION') {
        return (
            <GlassCard style={s.card}>
                <Text style={s.title}>{TITLES.DESTINATION}</Text>
                {serviceType === 'URBAN' ? (
                    <>
                        <Text style={s.help}>Toca el mapa en el sitio al que vas.</Text>
                        {destination ? (
                            <View style={s.row}><MapPin color="#F59E0B" size={18} /><Text style={s.rowText}>{destination.name}</Text></View>
                        ) : null}
                    </>
                ) : (
                    <>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                            {routes.map((r) => {
                                const on = destination?.name === r.name;
                                return (
                                    <TouchableOpacity key={r.name} style={[s.town, on && s.townOn]}
                                        onPress={() => dispatch({ type: 'SET_DESTINATION', destination: { lat: r.lat, lng: r.lng, name: r.name } })}>
                                        <Text style={[s.townName, on && s.townOnText]}>{r.name}</Text>
                                        <Text style={[s.townPrice, on && s.townOnText]}>{money(r.pricePerSeat)} / puesto</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <View style={s.seats}>
                            <Text style={s.rowText}>Puestos</Text>
                            <TouchableOpacity onPress={() => dispatch({ type: 'SET_SEATS', seats: seats - 1 })} accessibilityLabel="Menos puestos"><Minus color="#FFF" size={18} /></TouchableOpacity>
                            <Text style={s.seatsN}>{seats}</Text>
                            <TouchableOpacity onPress={() => dispatch({ type: 'SET_SEATS', seats: seats + 1 })} accessibilityLabel="Más puestos"><Plus color="#FFF" size={18} /></TouchableOpacity>
                        </View>
                    </>
                )}
                <Err />
                <GradientButton title="Confirmar destino" onPress={() => dispatch({ type: 'CONFIRM_DESTINATION' })} disabled={!destination} />
            </GlassCard>
        );
    }

    if (step === 'QUOTE') {
        return (
            <GlassCard style={s.card}>
                <Text style={s.title}>{serviceType === 'URBAN' ? 'Taxi' : 'Viaje'} · {destination?.name}</Text>
                {quote ? (
                    <>
                        <Text style={s.price}>{money(quote.fare)}</Text>
                        <Text style={s.help}>
                            {serviceType === 'URBAN'
                                ? `≈ ${String(quote.distanceKm).replace('.', ',')} km · Este es el valor que pagas.`
                                : `${quote.seats} puesto(s) · Este es el valor que pagas.`}
                        </Text>
                    </>
                ) : (
                    <Text style={s.help}>Calculando el precio…</Text>
                )}
                <Err />
                <GradientButton title={quote ? `Aceptar y pedir · ${money(quote.fare)}` : 'Calculando…'} onPress={onRequest} disabled={!quote} />
                <TouchableOpacity onPress={() => dispatch({ type: 'CHANGE_DESTINATION' })}><Text style={s.link}>Cambiar destino</Text></TouchableOpacity>
            </GlassCard>
        );
    }

    if (step === 'SEARCHING') {
        return (
            <GlassCard style={s.card}>
                <Text style={s.title}>Buscando conductor…</Text>
                <Text style={s.count}>{count} s</Text>
                <Text style={s.help}>Tu solicitud de {money(quote?.fare)} está visible para los conductores cercanos.</Text>
                <GradientButton title="Cancelar" onPress={onCancel} colors={[theme.colors.error, '#F87171']} />
            </GlassCard>
        );
    }

    if (step === 'RAISE_OFFER' && offer) {
        return (
            <GlassCard style={s.card}>
                <Text style={s.title}>Nadie lo tomó todavía. ¿Subes la oferta?</Text>
                <View style={s.stepper}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => dispatch({ type: 'BUMP', dir: -1 })} accessibilityLabel="Bajar oferta"><Minus color="#FFF" size={22} /></TouchableOpacity>
                    <Text style={s.price}>{money(offer.draft)}</Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => dispatch({ type: 'BUMP', dir: 1 })} accessibilityLabel="Subir oferta"><Plus color="#FFF" size={22} /></TouchableOpacity>
                </View>
                <Text style={s.help}>Precio base {money(offer.base)} · máximo {money(offer.max)} · te quedan {offer.raisesLeft} subida(s).</Text>
                <Err />
                <GradientButton title="Enviar nueva oferta" onPress={onSendOffer} disabled={offer.draft <= offer.current || offer.raisesLeft <= 0} />
                <TouchableOpacity onPress={() => dispatch({ type: 'KEEP_WAITING' })}><Text style={s.link}>Seguir esperando</Text></TouchableOpacity>
                <TouchableOpacity onPress={onCancel}><Text style={[s.link, { color: theme.colors.error }]}>Cancelar</Text></TouchableOpacity>
            </GlassCard>
        );
    }

    return null;
}

const s = StyleSheet.create({
    card: { padding: 18, gap: 10 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '700' },
    help: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
    rowText: { color: '#FFF', fontSize: 15 },
    price: { color: '#FFF', fontSize: 34, fontWeight: '800', textAlign: 'center' },
    count: { color: '#FBBF24', fontSize: 28, fontWeight: '800', textAlign: 'center' },
    link: { color: '#93C5FD', textAlign: 'center', paddingVertical: 8, fontSize: 15 },
    error: { color: '#FCA5A5', fontSize: 14 },
    town: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 10, marginRight: 8, minWidth: 120 },
    townOn: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    townName: { color: '#FFF', fontWeight: '700' },
    townPrice: { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    townOnText: { color: '#FFF' },
    seats: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    seatsN: { color: '#FFF', fontSize: 18, fontWeight: '700', minWidth: 20, textAlign: 'center' },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
});
