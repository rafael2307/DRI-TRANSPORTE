import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Dimensions, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Power, Settings, Navigation, HelpCircle, MessageCircle, MessageSquare, X } from 'lucide-react-native';
import { socketService } from '../services/socket.service';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation, route }) {
    const { user, token } = useAuth();
    const { serviceType = 'URBAN' } = route.params || {};
    const [location, setLocation] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [pendingTrip, setPendingTrip] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null); // { id, passengerSocketId, status }
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [isSupportVisible, setIsSupportVisible] = useState(false);
    const [supportQuery, setSupportQuery] = useState('');
    const [supportResponse, setSupportResponse] = useState('');
    const [isSupportLoading, setIsSupportLoading] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');

    useEffect(() => {
        if (user && token && !socketService.socket) {
            socketService.connect(token);
        }

        socketService.onNewTripRequest((data) => {
            setPendingTrip(data);
        });

        socketService.socket?.on('tripStarted', () => {
            setActiveTrip(prev => ({ ...prev, status: 'IN_PROGRESS' }));
        });

        socketService.socket?.on('tripCompleted', () => {
            setActiveTrip(null);
            alert('¡Viaje completado con éxito!');
        });

        socketService.socket?.on('tripCancelled', () => {
            setActiveTrip(null);
            setPendingTrip(null);
            alert('El viaje ha sido cancelado.');
        });

        socketService.onNewMessage((msg) => {
            setChatMessages(prev => [...prev, msg]);
            if (!isChatVisible) {
                alert(`Mensaje del Pasajero: ${msg.message}`);
            }
        });

        const watchLocation = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            return await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10, // Update every 10 meters
                },
                (loc) => {
                    setLocation(loc.coords);
                    if (isOnline && user) {
                        socketService.updateLocation(loc.coords.latitude, loc.coords.longitude, serviceType);
                    }
                }
            );
        };

        let subscription;
        watchLocation().then(sub => subscription = sub);

        return () => {
            if (subscription) subscription.remove();
            socketService.disconnect();
        };
    }, [isOnline]);

    const handleAcceptTrip = () => {
        socketService.acceptTrip({
            tripId: pendingTrip.tripId,
            passengerSocketId: pendingTrip.passengerSocketId
        });
        setActiveTrip({
            id: pendingTrip.tripId,
            passengerSocketId: pendingTrip.passengerSocketId,
            status: 'ACCEPTED',
            destination: pendingTrip.destination,
            fare: pendingTrip.fare
        });
        setPendingTrip(null);
    };

    const handleArrived = () => {
        socketService.driverArrived(activeTrip.id);
        setActiveTrip(prev => ({ ...prev, status: 'ARRIVED' }));
    };

    const handleStartTrip = () => {
        socketService.startTrip(activeTrip.id);
        setActiveTrip(prev => ({ ...prev, status: 'IN_PROGRESS' }));
    };

    const handleCompleteTrip = () => {
        socketService.completeTrip(activeTrip.id);
    };

    const handleAiSupportQuery = async () => {
        if (!supportQuery.trim()) return;
        setIsSupportLoading(true);
        setSupportResponse('');
        try {
            const response = await fetch('http://localhost:3000/ai/query-support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: supportQuery })
            });
            const data = await response.json();
            setSupportResponse(data.answer);
        } catch (error) {
            setSupportResponse('Error al contactar soporte IA.');
        } finally {
            setIsSupportLoading(false);
        }
    };

    const handleSendMessage = () => {
        if (!currentMessage.trim()) return;
        socketService.sendMessage(activeTrip.id, currentMessage);
        setCurrentMessage('');
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                initialRegion={{
                    latitude: location?.latitude || 4.6097,
                    longitude: location?.longitude || -74.0817,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation
            />

            <SafeAreaView style={styles.overlay}>
                {pendingTrip ? (
                    <View style={styles.tripAlertContainer}>
                        <GlassCard style={styles.tripAlertCard}>
                            <Text style={styles.alertTitle}>¡Nuevo Viaje!</Text>
                            <Text style={styles.alertDetail}>{pendingTrip.destination?.name}</Text>
                            <Text style={styles.alertFare}>${pendingTrip.fare?.toLocaleString()}</Text>
                            <View style={styles.alertActions}>
                                <GradientButton
                                    title="Rechazar"
                                    onPress={() => setPendingTrip(null)}
                                    colors={[theme.colors.error, '#F87171']}
                                    style={styles.alertButton}
                                />
                                <GradientButton
                                    title="Aceptar"
                                    onPress={handleAcceptTrip}
                                    colors={[theme.colors.success, '#34D399']}
                                    style={styles.alertButton}
                                />
                            </View>
                        </GlassCard>
                    </View>
                ) : activeTrip ? (
                    <View style={styles.activeTripContainer}>
                        <GlassCard style={styles.activeTripCard}>
                            <View style={styles.activeTripHeader}>
                                <Navigation color={theme.colors.primary[0]} size={24} />
                                <Text style={styles.activeTripLabel}>
                                    {activeTrip.status === 'ACCEPTED' ? 'Recogiendo Pasajero' : 'Viaje en Curso'}
                                </Text>
                            </View>
                            <Text style={styles.activeTripDest}>{activeTrip.destination.name}</Text>
                            <Text style={styles.activeTripFare}>${activeTrip.fare.toLocaleString()}</Text>

                            <GradientButton
                                title={
                                    activeTrip.status === 'ACCEPTED' ? "Ya llegué" :
                                        activeTrip.status === 'ARRIVED' ? "Iniciar Viaje" :
                                            "Finalizar Viaje"
                                }
                                onPress={
                                    activeTrip.status === 'ACCEPTED' ? handleArrived :
                                        activeTrip.status === 'ARRIVED' ? handleStartTrip :
                                            handleCompleteTrip
                                }
                                colors={
                                    activeTrip.status === 'ACCEPTED' ? [theme.colors.primary[0], '#6366F1'] :
                                        activeTrip.status === 'ARRIVED' ? [theme.colors.success, '#34D399'] :
                                            [theme.colors.warning || '#F59E0B', '#FBBF24']
                                }
                                style={styles.actionButton}
                            />
                        </GlassCard>
                    </View>
                ) : (
                    <>
                        <View style={styles.header}>
                            <GlassCard style={styles.statusCard}>
                                <View style={[styles.statusIndicator, { backgroundColor: isOnline ? theme.colors.success : theme.colors.error }]} />
                                <Text style={styles.statusText}>{isOnline ? 'En línea' : 'Desconectado'}</Text>
                            </GlassCard>
                            <TouchableOpacity onPress={() => navigation.navigate('Withdrawal')}>
                                <GlassCard style={styles.iconButton}>
                                    <Settings color={theme.colors.text.primary} size={24} />
                                </GlassCard>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <GradientButton
                                title={isOnline ? "Desconectarse" : "Conectarse"}
                                onPress={() => setIsOnline(!isOnline)}
                                colors={isOnline ? [theme.colors.error, '#F87171'] : [theme.colors.success, '#34D399']}
                            />
                        </View>
                    </>
                )}

                {/* Chat Bubble Component */}
                {activeTrip && (
                    <TouchableOpacity
                        style={styles.chatBubble}
                        onPress={() => setIsChatVisible(true)}
                    >
                        <View style={styles.chatIconBadge}>
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>!</Text>
                        </View>
                        <MessageCircle color="white" size={24} />
                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8 }}>Chat</Text>
                    </TouchableOpacity>
                )}

                {/* Chat Modal Component */}
                {isChatVisible && (
                    <View style={styles.chatModal}>
                        <GlassCard style={styles.chatContent}>
                            <View style={styles.chatHeader}>
                                <Text style={styles.chatTitle}>Chat con el Pasajero</Text>
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
                                    placeholder="Escribe..."
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

                {/* AI Support Modal */}
                {isSupportVisible && (
                    <View style={styles.chatModal}>
                        <GlassCard style={styles.chatContent}>
                            <View style={styles.chatHeader}>
                                <Text style={styles.chatTitle}>Asistente IA para Conductores</Text>
                                <TouchableOpacity onPress={() => setIsSupportVisible(false)}>
                                    <X color={theme.colors.error} size={24} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ padding: 20 }}>
                                <View style={styles.supportInputContainer}>
                                    <TextInput
                                        style={styles.chatInput}
                                        placeholder="Haz tu pregunta aquí..."
                                        placeholderTextColor="#94A3B8"
                                        value={supportQuery}
                                        onChangeText={setSupportQuery}
                                    />
                                <GradientButton
                                    title="Soporte"
                                    onPress={handleAiSupportQuery}
                                    style={{ width: 100 }}
                                    disabled={isSupportLoading || !supportQuery.trim()}
                                />
                                </View>
                                {isSupportLoading && <Text style={{ marginTop: 10 }}>Pensando...</Text>}
                                {supportResponse ? (
                                    <View style={styles.supportResponseBox}>
                                        <MessageSquare size={16} color={theme.colors.primary[0]} />
                                        <Text style={styles.supportResponseText}>{supportResponse}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </GlassCard>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const mapStyle = [/* Re-using same dark style as passenger for consistency */
    { "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1e293b" }] },
    { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#334155" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
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
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: theme.spacing.sm,
    },
    statusText: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 14,
    },
    iconButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
    },
    footer: {
        marginBottom: theme.spacing.xl,
    },
    onlineButton: {
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    tripAlertContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripAlertCard: {
        width: '90%',
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
    },
    alertTitle: {
        color: theme.colors.primary[0],
        fontFamily: theme.fonts.heading,
        fontSize: 24,
        marginBottom: theme.spacing.md,
    },
    alertDetail: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
        marginBottom: theme.spacing.sm,
    },
    alertFare: {
        color: theme.colors.success,
        fontFamily: theme.fonts.heading,
        fontSize: 32,
        marginVertical: theme.spacing.lg,
    },
    alertActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    alertButton: {
        width: '48%',
    },
    activeTripContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        marginBottom: theme.spacing.xl,
    },
    activeTripCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
    },
    activeTripHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    activeTripLabel: {
        color: theme.colors.primary[0],
        fontFamily: theme.fonts.heading,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    activeTripDest: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: theme.fonts.heading,
        marginBottom: 5,
    },
    activeTripFare: {
        color: theme.colors.success,
        fontSize: 24,
        fontFamily: theme.fonts.heading,
        marginBottom: 20,
    },
    actionButton: {
        width: '100%',
    },
    chatBubble: {
        position: 'absolute',
        bottom: 200,
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
        height: '50%',
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
    supportInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    supportResponseBox: {
        backgroundColor: '#F1F5F9',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        marginTop: 10,
    },
    supportResponseText: {
        marginLeft: 10,
        color: '#334155',
        flex: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
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
