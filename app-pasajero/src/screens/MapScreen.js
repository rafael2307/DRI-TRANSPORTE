import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Search, MapPin, Navigation, Settings, CreditCard, MessageCircle, MessageSquare, Mic, X, Car, AlertTriangle } from 'lucide-react-native';
import { socketService } from '../services/socket.service';
import { useAuth } from '../context/AuthContext';
import { GradientButton } from '../components/GradientButton';

const { width, height } = Dimensions.get('window');

const MUNICIPALITIES = [
    { id: '1', name: 'Chía', price: 35000 },
    { id: '2', name: 'Cajicá', price: 45000 },
    { id: '3', name: 'Zipaquirá', price: 65000 },
    { id: '4', name: 'Facatativá', price: 75000 },
    { id: '5', name: 'Fusagasugá', price: 120000 },
    ];

export default function MapScreen() {
    const { user, token } = useAuth();
    const [location, setLocation] = useState(null);
    const [drivers, setDrivers] = useState({});
    const [serviceType, setServiceType] = useState('URBAN'); // URBAN or INTERMUNICIPAL
const [destMunicipality, setDestMunicipality] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [tripStatus, setTripStatus] = useState(null); // 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'
const [fare, setFare] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [activeTrip, setActiveTrip] = useState(null);
    const [isSosConfirmVisible, setIsSosConfirmVisible] = useState(false);
    const [isSosSending, setIsSosSending] = useState(false);
    const [sosConfirmedAt, setSosConfirmedAt] = useState(null);
    const [isAssistantVisible, setIsAssistantVisible] = useState(false);
    const [assistantEnabled, setAssistantEnabled] = useState(false);
    const [isAssistantPrefLoading, setIsAssistantPrefLoading] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState([]);
    const [assistantInput, setAssistantInput] = useState('');
    const [isAssistantSending, setIsAssistantSending] = useState(false);

useEffect(() => {
    // Socket connection is handled by AuthProvider or manually if needed
          // but here we ensure we are connected with el token real del usuario
          if (user && token && !socketService.socket) {
              socketService.connect(token);
          }

          (async () => {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') return;

           let loc = await Location.getCurrentPositionAsync({});
              setLocation(loc.coords);

           // Initial fetch of drivers with serviceType
           socketService.socket.emit('findDrivers', {
               lat: loc.coords.latitude,
               lng: loc.coords.longitude,
               serviceType: 'URBAN'
           });
          })();

          socketService.onDriverUpdate((driverUpdate) => {
              setDrivers(prev => ({
                  ...prev,
                  [driverUpdate.driverId]: driverUpdate
              }));
          });

          socketService.onTripAccepted((data) => {
              setIsSearching(false);
              setTripStatus('ACCEPTED');
              setActiveTrip(data);
          });

          socketService.onNewMessage((msg) => {
              setChatMessages(prev => [...prev, msg]);
              if (!isChatVisible) {
                  alert(`Nuevo mensaje: ${msg.message}`);
              }
          });

          socketService.onDriverArrived(() => {
              setTripStatus('ARRIVED');
              alert('¡Tu conductor ha llegado!');
          });

          socketService.onTripStarted(() => {
              setTripStatus('IN_PROGRESS');
          });

          socketService.onTripCompleted(() => {
              setTripStatus('COMPLETED');
              alert('¡Has llegado a tu destino! Por favor, procede al pago.');
          });

          socketService.onTripCancelled(() => {
              setTripStatus(null);
              setIsSearching(false);
              alert('El viaje ha sido cancelado.');
          });

          // Alerta de pánico: confirma que se registró y se le notificó al
          // conductor. El banner se oculta solo después de unos segundos.
          socketService.onSosAlertTriggered(() => {
              setIsSosSending(false);
              setSosConfirmedAt(Date.now());
              setTimeout(() => setSosConfirmedAt(null), 6000);
          });

          // Chat del asistente de IA: solo llega si el pasajero activó la
          // preferencia (ver fetch de assistant-preferences más abajo).
          socketService.onAssistantChatReply((data) => {
              setIsAssistantSending(false);
              setAssistantMessages(prev => [...prev, { from: 'assistant', text: data.reply }]);
          });

          socketService.onAssistantChatError((data) => {
              setIsAssistantSending(false);
              setAssistantMessages(prev => [...prev, { from: 'assistant', text: `⚠️ ${data.message}` }]);
          });

          return () => socketService.disconnect();
}, []);

// Trae la preferencia del asistente al entrar, para saber si mostrar el
// chat directamente o el mensaje de "actívalo primero".
useEffect(() => {
    if (!token) return;
    fetch('http://localhost:3000/pasajero/assistant-preferences', {
        headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => res.json())
    .then((data) => setAssistantEnabled(!!data.enabled))
    .catch(() => { /* si falla, se asume desactivado por defecto */ });
}, [token]);

// Effect to refetch drivers when serviceType changes
useEffect(() => {
    if (socketService.socket && location) {
        socketService.socket.emit('findDrivers', {
            lat: location.latitude,
            lng: location.longitude,
            serviceType
        });
        // Clear current drivers from map when switching types
    setDrivers({});
    }
}, [serviceType]);


const handleRequestTrip = () => {
    setIsSearching(true);
    const dest = serviceType === 'URBAN'
    ? { lat: location.latitude + 0.01, lng: location.longitude + 0.01, name: 'Centro Comercial' }
        : { lat: 4.8617, lng: -74.0531, name: destMunicipality?.name || 'Chía' };

    socketService.requestTrip({
        pickup: { lat: location.latitude, lng: location.longitude, name: 'Mi ubicación' },
        destination: dest,
        routeName: serviceType === 'URBAN' ? 'default' : (destMunicipality?.name || 'inter_base'),
        serviceType
    });
};

// Consulta el estado real de la transacción, que solo cambia cuando Wompi
// llama a nuestro webhook (verificado con firma). Reintenta unos segundos
// porque ese webhook llega de forma asíncrona, después de cerrar el navegador.
const pollTransactionStatus = async (reference, attempts = 10, delayMs = 2000) => {
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetch(`http://localhost:3000/payments/transactions/${reference}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const tx = await res.json();
                if (tx.status && tx.status !== 'PENDING') return tx.status;
            }
        } catch (e) {
            // ignore transient network errors while polling
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return 'PENDING';
};

const handlePayment = async () => {
    setIsPaying(true);
    try {
        const amount = serviceType === 'URBAN' ? 8500 : (destMunicipality?.price || 25000);

    // 1. Pedir al backend la sesión de checkout (firma real + URL de Wompi)
    const response = await fetch('http://localhost:3000/payments/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, tripId: activeTrip?.id })
    });
        if (!response.ok) throw new Error('No se pudo iniciar el pago');
        const checkoutData = await response.json();

    // 2. Abrir el checkout hospedado real de Wompi y esperar a que el
    // usuario complete el pago y sea redirigido de vuelta a la app.
    const result = await WebBrowser.openAuthSessionAsync(
        checkoutData.checkoutUrl,
        'dripasajero://payment-result'
        );

    if (result.type !== 'success') {
        alert('Pago cancelado');
        return;
    }

    // 3. Confirmar el resultado real: Wompi le avisa a nuestro backend
    // por webhook (con firma verificada), no al cliente.
    const finalStatus = await pollTransactionStatus(checkoutData.reference);

    if (finalStatus === 'APPROVED') {
        alert('¡Pago procesado exitosamente con Wompi!');
        setTripStatus(null);
        setDestMunicipality(null);
    } else if (finalStatus === 'DECLINED' || finalStatus === 'ERROR') {
        alert('El pago no fue aprobado. Intenta de nuevo o usa otro método.');
    } else {
        alert('Wompi todavía está confirmando el pago. Revisa tu historial en unos minutos.');
    }
    } catch (error) {
        alert('Error al procesar el pago: ' + error.message);
    } finally {
        setIsPaying(false);
    }
};

const handleVoiceCommand = async () => {
    // In a real app, this would be the output of Speech-to-Text
    const simulatedTranscript = "Me gustaría ir al aeropuerto en un servicio urbano";

    console.log('Processing voice command:', simulatedTranscript);
    try {
        const response = await fetch('http://localhost:3000/ai/extract-destination', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: simulatedTranscript })
        });
        const result = await response.json();

    if (result.success) {
        const { destination, serviceType, price } = result.data;
        alert(`IA detectó:\nDestino: ${destination}\nServicio: ${serviceType}\nPrecio: $${price}`);

        // Auto-configure the trip
        setServiceType(serviceType);
        // If it was intermunicipal, we would set the municipality, but for urban we just show it
        if (serviceType === 'URBAN') {
            // Set destination name or coordinates if we had them
        }
    }
    } catch (error) {
        console.error('AI Error:', error);
        alert('Error al procesar comando de voz');
    }
};

const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    socketService.sendMessage(activeTrip?.tripId, currentMessage);
    setCurrentMessage('');
};

const handleConfirmSos = () => {
    if (!activeTrip?.tripId) return;
    setIsSosSending(true);
    socketService.sendSosAlert(
        activeTrip.tripId,
        location?.latitude,
        location?.longitude
        );
    setIsSosConfirmVisible(false);
};

const handleToggleAssistant = async () => {
    setIsAssistantPrefLoading(true);
    try {
        const response = await fetch('http://localhost:3000/pasajero/assistant-preferences', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ enabled: !assistantEnabled }),
        });
        const data = await response.json();
        setAssistantEnabled(!!data.enabled);
    } catch (error) {
        alert('No se pudo actualizar la preferencia del asistente.');
    } finally {
        setIsAssistantPrefLoading(false);
    }
};

const handleSendAssistantMessage = () => {
    if (!assistantInput.trim()) return;
    setAssistantMessages(prev => [...prev, { from: 'me', text: assistantInput }]);
    setIsAssistantSending(true);
    socketService.sendAssistantChatMessage(assistantInput);
    setAssistantInput('');
};


return (
    <View style={styles.container}>
<MapView
    provider={PROVIDER_GOOGLE}
    style={styles.map}
customMapStyle={mapStyle}
initialRegion={{
    latitude: location?.latitude || 4.6097, // Bogota fallback
    longitude: location?.longitude || -74.0817,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
}}
showsUserLocation
>
{Object.values(drivers).map((driver) => (
    <Marker
                            key={driver.driverId}
coordinate={{ latitude: driver.lat, longitude: driver.lng }}
>
<View style={styles.driverMarker}>
<Car color="white" size={16} fill={theme.colors.success} />
    </View>
    </Marker>
))}
{location && (
    <Marker
 coordinate={{ latitude: location.latitude, longitude: location.longitude }}
title="Tu ubicación"
>
    <View style={styles.userMarker}>
<View style={styles.userMarkerPulse} />
    </View>
    </Marker>
)}
</MapView>

{/* Service Type Selector */}
<View style={styles.serviceSelector}>
<TouchableOpacity
style={[styles.serviceTab, serviceType === 'URBAN' && styles.serviceTabActive]}
onPress={() => setServiceType('URBAN')}
>
    <Text style={[styles.serviceText, serviceType === 'URBAN' && styles.serviceTextActive]}>Urbano</Text>
    </TouchableOpacity>
<TouchableOpacity
style={[styles.serviceTab, serviceType === 'INTERMUNICIPAL' && styles.serviceTabActive]}
onPress={() => setServiceType('INTERMUNICIPAL')}
>
    <Text style={[styles.serviceText, serviceType === 'INTERMUNICIPAL' && styles.serviceTextActive]}>Intermunicipal</Text>
    </TouchableOpacity>
    </View>

<SafeAreaView style={styles.overlay}>
{!isSearching ? (
    <>
{serviceType === 'INTERMUNICIPAL' ? (
    <View style={styles.municipalityContainer}>
 <Text style={styles.sectionTitle}>Elegir Municipio</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.municipalityList}>
 {MUNICIPALITIES.map(m => (
     <TouchableOpacity
                     key={m.id}
                     style={[styles.municipalityCard, destMunicipality?.id === m.id && styles.municipalityCardActive]}
                     onPress={() => setDestMunicipality(m)}
 >
                     <MapPin color={destMunicipality?.id === m.id ? '#FFF' : '#3B82F6'} size={20} />
    <Text style={[styles.municipalityName, destMunicipality?.id === m.id && styles.municipalityNameActive]}>{m.name}</Text>
    <Text style={[styles.municipalityPrice, destMunicipality?.id === m.id && styles.municipalityPriceActive]}>${m.price.toLocaleString()}</Text>
    </TouchableOpacity>
    ))}
    </ScrollView>
    </View>
    ) : (
    <GlassCard style={styles.searchBar}>
    <Search color={theme.colors.text.secondary} size={20} />
    <Text style={styles.searchText}>¿A dónde vamos?</Text>
    </GlassCard>
)}

<View style={styles.bottomCardContainer}>
<GlassCard style={styles.tripCard}>
<View style={styles.tripInfo}>
<Text style={styles.tripTitle}>
{tripStatus === 'COMPLETED' ? 'Viaje Finalizado' : (serviceType === 'URBAN' ? 'Viaje al Centro' : `Hacia ${destMunicipality?.name || 'Selecciona...'}`)}
    </Text>
<Text style={styles.tripPrice}>
{serviceType === 'URBAN' ? '$8.500' : `$${(destMunicipality?.price || 25000).toLocaleString()}`}
    </Text>
    </View>
{tripStatus === 'COMPLETED' ? (
    <GradientButton
    title={isPaying ? "Procesando..." : "Pagar con Wompi"}
onPress={handlePayment}
disabled={isPaying}
/>
    ) : (
        <GradientButton
        title="Solicitar Ahora"
        onPress={handleRequestTrip}
disabled={serviceType === 'INTERMUNICIPAL' && !destMunicipality}
    />
)}
    </GlassCard>
    </View>
    </>
) : (
    <View style={styles.searchingOverlay}>
    <GlassCard style={styles.searchingCard}>
<View style={styles.pulseContainer}>
<View style={styles.pulse} />
    </View>
<Text style={styles.searchingText}>Buscando conductores cercanos...</Text>
<GradientButton
title="Cancelar"
onPress={() => setIsSearching(false)}
colors={[theme.colors.error, '#F87171']}
/>
    </GlassCard>
    </View>
)}

{/* Voice Command Button */}
{!activeTrip && !isSearching && (
    <TouchableOpacity
 style={styles.voiceButton}
onPress={handleVoiceCommand}
>
    <Mic color="white" size={24} />
    </TouchableOpacity>
)}

{/* Botón de asistente de IA — siempre visible mientras no se está
    buscando conductor. Activarlo o no es decisión del pasajero. */}
{!isSearching && (
    <TouchableOpacity
 style={styles.assistantBubble}
onPress={() => setIsAssistantVisible(true)}
>
    <MessageSquare color="white" size={22} />
    </TouchableOpacity>
)}

{/* Botón SOS — solo durante un viaje activo, que es cuando tiene
    sentido (necesita un tripId y un conductor a quien avisar). */}
{activeTrip && tripStatus && tripStatus !== 'COMPLETED' && (
    <TouchableOpacity
 style={styles.sosButton}
onPress={() => setIsSosConfirmVisible(true)}
>
    <AlertTriangle color="white" size={22} />
    </TouchableOpacity>
)}

{/* Confirmación del SOS: nunca se dispara con un solo toque, para
    evitar alertas accidentales. */}
{isSosConfirmVisible && (
    <View style={styles.sosOverlay}>
<GlassCard style={styles.sosCard}>
<AlertTriangle color={theme.colors.error} size={40} />
    <Text style={styles.sosTitle}>¿Enviar alerta de emergencia?</Text>
<Text style={styles.sosDetail}>
Se le avisará de inmediato a tu conductor y quedará un registro con tu ubicación actual.
    </Text>
<View style={styles.sosActions}>
<GradientButton
title="Cancelar"
onPress={() => setIsSosConfirmVisible(false)}
colors={['#475569', '#64748B']}
style={styles.sosButtonHalf}
/>
<GradientButton
title={isSosSending ? "Enviando..." : "Sí, enviar SOS"}
onPress={handleConfirmSos}
colors={[theme.colors.error, '#F87171']}
style={styles.sosButtonHalf}
disabled={isSosSending}
/>
    </View>
    </GlassCard>
    </View>
)}

{sosConfirmedAt && (
    <View style={styles.sosBanner}>
<Text style={styles.sosBannerText}>Alerta enviada. Tu conductor fue notificado.</Text>
    </View>
 )}


{/* Chat Bubble */}
{tripStatus && tripStatus !== 'COMPLETED' && (
    <TouchableOpacity
 style={styles.chatBubble}
onPress={() => setIsChatVisible(true)}
>
    <View style={styles.chatIconBadge}>
<Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>1</Text>
    </View>
<MessageCircle color="white" size={24} />
    <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Chat</Text>
    </TouchableOpacity>
)}

{/* Chat Modal (Simplified) */}
{isChatVisible && (
    <View style={styles.chatModal}>
<GlassCard style={styles.chatContent}>
<View style={styles.chatHeader}>
<Text style={styles.chatTitle}>Chat con el Conductor</Text>
 <TouchableOpacity onPress={() => setIsChatVisible(false)}>
<X color={theme.colors.error} size={24} />
    </TouchableOpacity>
    </View>
<ScrollView style={styles.messagesList}>
{chatMessages.map((m, idx) => (
    <View key={idx} style={[
        styles.messageBubble,
        m.senderId === user.id ? styles.myMessage : styles.otherMessage
        ]}>
    <Text style={styles.messageText}>{m.message}</Text>
    </View>
                  ))}
</ScrollView>
<View style={styles.chatInputContainer}>
<TextInput
style={styles.chatInput}
placeholder="Escribe un mensaje..."
placeholderTextColor="#94A3B8"
value={currentMessage}
onChangeText={setCurrentMessage}
/>
    <GradientButton
title="Enviar"
onPress={handleSendMessage}
style={{ width: 80 }}
/>
    </View>
    </GlassCard>
    </View>
)}

{/* Asistente de IA conversacional — gateado por la preferencia del
    pasajero (GET/PATCH /pasajero/assistant-preferences). Nunca chatea
    si el pasajero no lo activó explícitamente. */}
{isAssistantVisible && (
    <View style={styles.chatModal}>
<GlassCard style={styles.chatContent}>
<View style={styles.chatHeader}>
<Text style={styles.chatTitle}>Asistente de Viaje</Text>
 <TouchableOpacity onPress={() => setIsAssistantVisible(false)}>
<X color={theme.colors.error} size={24} />
    </TouchableOpacity>
    </View>

<View style={styles.assistantToggleRow}>
<Text style={styles.assistantToggleLabel}>
{assistantEnabled ? 'Asistente activado' : 'Asistente desactivado'}
</Text>
<TouchableOpacity
style={[styles.assistantToggle, assistantEnabled && styles.assistantToggleOn]}
onPress={handleToggleAssistant}
disabled={isAssistantPrefLoading}
>
    <View style={[styles.assistantToggleKnob, assistantEnabled && styles.assistantToggleKnobOn]} />
    </TouchableOpacity>
    </View>

{assistantEnabled ? (
    <>
    <ScrollView style={styles.messagesList}>
{assistantMessages.length === 0 ? (
    <Text style={styles.assistantEmptyText}>
Pregúntame lo que quieras sobre tu viaje, o simplemente conversemos.
    </Text>
 ) : assistantMessages.map((m, idx) => (
     <View key={idx} style={[
         styles.messageBubble,
         m.from === 'me' ? styles.myMessage : styles.otherMessage
         ]}>
     <Text style={styles.messageText}>{m.text}</Text>
     </View>
                           ))}
</ScrollView>
<View style={styles.chatInputContainer}>
<TextInput
style={styles.chatInput}
placeholder="Escribe..."
placeholderTextColor="#94A3B8"
value={assistantInput}
onChangeText={setAssistantInput}
/>
    <GradientButton
title={isAssistantSending ? "..." : "Enviar"}
onPress={handleSendAssistantMessage}
style={{ width: 80 }}
disabled={isAssistantSending || !assistantInput.trim()}
/>
    </View>
    </>
) : (
    <Text style={styles.assistantEmptyText}>
    Activa el asistente arriba para poder chatear. Es opcional y lo puedes apagar cuando quieras.
    </Text>
)}
</GlassCard>
    </View>
)}
</SafeAreaView>
    </View>
);
}


    const mapStyle = [
        {
            "elementType": "geometry",
            "stylers": [{ "color": "#1e293b" }]
        },
        {
            "elementType": "labels.text.fill",
            "stylers": [{ "color": "#94a3b8" }]
        },
        {
            "elementType": "labels.text.stroke",
            "stylers": [{ "color": "#1e293b" }]
        },
        {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [{ "color": "#334155" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "color": "#334155" }]
        },
        {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{ "color": "#0f172a" }]
        }
        ];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    serviceSelector: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        borderRadius: 25,
        padding: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 10,
    },
    serviceTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 20,
    },
    serviceTabActive: {
        backgroundColor: theme.colors.primary[0],
    },
    serviceText: {
        color: '#94A3B8',
        fontFamily: theme.fonts.body,
        fontWeight: 'bold',
        fontSize: 14,
    },
    serviceTextActive: {
        color: '#FFFFFF',
    },
    map: {
        width: width,
        height: height,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: theme.spacing.lg,
        pointerEvents: 'box-none',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        marginTop: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    municipalityContainer: {
        marginTop: 60,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontFamily: theme.fonts.heading,
        fontSize: 18,
        marginBottom: 10,
        marginLeft: 5,
    },
    municipalityList: {
        flexDirection: 'row',
    },
    municipalityCard: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 15,
        borderRadius: 20,
        marginRight: 10,
        width: 120,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    municipalityCardActive: {
        backgroundColor: '#3B82F6',
        borderColor: '#60A5FA',
    },
    municipalityName: {
        color: '#FFFFFF',
        fontFamily: theme.fonts.heading,
        fontSize: 16,
        marginTop: 8,
    },
    municipalityNameActive: {
        color: '#FFFFFF',
    },
    municipalityPrice: {
        color: '#3B82F6',
        fontFamily: theme.fonts.body,
        fontSize: 14,
        marginTop: 4,
    },
    municipalityPriceActive: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    statusCard: {
        padding: 20,
        borderRadius: 25,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusTitle: {
        color: '#FFF',
        fontFamily: theme.fonts.heading,
        fontSize: 18,
        marginLeft: 10,
    },
    statusDetail: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontFamily: theme.fonts.body,
        fontSize: 16,
    },
    pulse: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    searchText: {
        marginLeft: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
    },
    quickActions: {
        position: 'absolute',
        bottom: 220,
        right: theme.spacing.lg,
    },
    bottomCardContainer: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
    },
    tripCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
    },
    tripInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    tripTitle: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 18,
    },
    tripPrice: {
        color: theme.colors.primary[0],
        fontFamily: theme.fonts.heading,
        fontSize: 22,
    },
    searchingOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
    },
    searchingCard: {
        width: '80%',
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
    },
    searchingText: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
        textAlign: 'center',
        marginVertical: theme.spacing.xl,
    },
    pulseContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulse: {
        width: 40,
        height: 40,
        backgroundColor: theme.colors.primary[0],
        borderRadius: 20,
        elevation: 20,
        shadowColor: theme.colors.primary[0],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    actionButton: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
        marginBottom: theme.spacing.md,
    },
    driverMarker: {
        padding: 6,
        backgroundColor: theme.colors.success,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'white',
        elevation: 5,
    },
    userMarker: {
        width: 20,
        height: 20,
        backgroundColor: theme.colors.primary[0],
        borderRadius: 10,
        borderWidth: 3,
        borderColor: 'white',
    },
    userMarkerPulse: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        top: -13,
        left: -13,
    },
    voiceButton: {
        position: 'absolute',
        bottom: 320,
        right: 20,
        backgroundColor: theme.colors.primary[0],
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    chatBubble: {
        position: 'absolute',
        bottom: 250,
        right: 20,
        backgroundColor: theme.colors.primary[0],
        padding: 15,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 5,
    },
    chatIconBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chatModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    chatContent: {
        height: '60%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chatTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    messagesList: {
        flex: 1,
        marginBottom: 20,
    },
    messageBubble: {
        padding: 12,
        borderRadius: 15,
        marginBottom: 10,
        maxWidth: '80%',
    },
    myMessage: {
        backgroundColor: theme.colors.primary[0],
        alignSelf: 'flex-end',
        borderBottomRightRadius: 2,
    },
    otherMessage: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 2,
    },
    messageText: {
        color: 'white',
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#FFFFFF',
        fontFamily: theme.fonts.body,
        fontSize: 15,
    },
    assistantBubble: {
        position: 'absolute',
        bottom: 180,
        right: 20,
        backgroundColor: '#7C3AED',
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    sosButton: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        backgroundColor: theme.colors.error,
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    sosOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sosCard: {
        width: '85%',
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
    },
    sosTitle: {
        color: 'white',
        fontFamily: theme.fonts.heading,
        fontSize: 20,
        marginTop: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    sosDetail: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: theme.fonts.body,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
    },
    sosActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    sosButtonHalf: {
        width: '48%',
    },
    sosBanner: {
        position: 'absolute',
        top: 110,
        left: 20,
        right: 20,
        backgroundColor: theme.colors.error,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
    },
    sosBannerText: {
        color: 'white',
        fontFamily: theme.fonts.body,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    assistantToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    assistantToggleLabel: {
        color: 'white',
        fontFamily: theme.fonts.body,
        fontSize: 14,
    },
    assistantToggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 3,
        justifyContent: 'center',
    },
    assistantToggleOn: {
        backgroundColor: '#7C3AED',
    },
    assistantToggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'white',
        alignSelf: 'flex-start',
    },
    assistantToggleKnobOn: {
        alignSelf: 'flex-end',
    },
    assistantEmptyText: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: theme.fonts.body,
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    }
});
