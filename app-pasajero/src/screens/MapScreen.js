import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { Search, MapPin, Navigation, Settings, CreditCard, MessageCircle, Mic, X, Car } from 'lucide-react-native';
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
    const { user } = useAuth();
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

    useEffect(() => {
        // Socket connection is handled by AuthProvider or manually if needed
        // but here we ensure we are connected with the real user.id
        if (user && !socketService.socket) {
            socketService.connect(user.id);
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

        return () => socketService.disconnect();
    }, []);

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
            passengerId: user?.id || 'pax-unknown',
            pickup: { lat: location.latitude, lng: location.longitude, name: 'Mi ubicación' },
            destination: dest,
            routeName: serviceType === 'URBAN' ? 'default' : (destMunicipality?.name || 'inter_base'),
            serviceType
        });
    };

    const handlePayment = async () => {
        setIsPaying(true);
        try {
            const amount = serviceType === 'URBAN' ? 8500 : (destMunicipality?.price || 25000);

            // 1. Get checkout data from backend
            const response = await fetch('http://localhost:3000/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, amount })
            });
            const checkoutData = await response.json();

            // 2. Simulate Wompi Webhook (in real life, Wompi calls the backend)
            // We'll call the backend ourselves to simulate success for this demo
            await fetch('http://localhost:3000/payments/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'transaction.updated',
                    data: {
                        transaction: {
                            reference: checkoutData.reference,
                            status: 'APPROVED',
                            id: 'WOMPI_SIM_123'
                        }
                    }
                })
            });

            alert('¡Pago procesado exitosamente con Wompi!');
            setTripStatus(null);
            setDestMunicipality(null);
        } catch (error) {
            alert('Error al procesar el pago');
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
        socketService.sendMessage(activeTrip?.tripId, user.id, currentMessage);
        setCurrentMessage('');
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
    }
});
