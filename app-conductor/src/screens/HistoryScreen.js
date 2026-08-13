import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Calendar, MapPin, Clock, DollarSign } from 'lucide-react-native';

const TripItem = ({ trip }) => (
    <GlassCard style={styles.tripCard}>
        <View style={styles.tripHeader}>
            <View style={styles.dateContainer}>
                <Calendar color={theme.colors.success} size={16} />
                <Text style={styles.dateText}>{trip.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: trip.status === 'COMPLETED' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)' }]}>
                <Text style={[styles.statusText, { color: trip.status === 'COMPLETED' ? theme.colors.success : theme.colors.error }]}>
                    {trip.status === 'COMPLETED' ? 'Completado' : 'Cancelado'}
                </Text>
            </View>
        </View>

        <View style={styles.locationsContainer}>
            <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.locationText} numberOfLines={1}>{trip.pickup}</Text>
            </View>
            <View style={styles.verticalLine} />
            <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />
                <Text style={styles.locationText} numberOfLines={1}>{trip.destination}</Text>
            </View>
        </View>

        <View style={styles.tripFooter}>
            <View style={styles.footerItem}>
                <Clock color={theme.colors.text.secondary} size={14} />
                <Text style={styles.footerText}>{trip.duration}</Text>
            </View>
            <View style={styles.footerItem}>
                <DollarSign color={theme.colors.success} size={14} />
                <Text style={styles.footerText}>Ganancia: ${trip.earning.toLocaleString()}</Text>
            </View>
        </View>
    </GlassCard>
);

export default function HistoryScreen({ navigation }) {
    const [trips] = useState([
        { id: '1', date: 'Hoy, 2:30 PM', status: 'COMPLETED', pickup: 'Centro Comercial Andino', destination: 'Calle 100 #15-20', duration: '45 min', earning: 28000 },
        { id: '2', date: 'Hoy, 10:15 AM', status: 'COMPLETED', pickup: 'Aeropuerto El Dorado', destination: 'Zona T', duration: '35 min', earning: 42000 },
    ]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text.primary} size={28} />
                </TouchableOpacity>
                <Text style={styles.title}>Historial de Viajes</Text>
            </View>

            <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <TripItem trip={item} />}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    backButton: {
        padding: 8,
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: 24,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    listContent: {
        padding: theme.spacing.lg,
    },
    tripCard: {
        marginBottom: theme.spacing.lg,
    },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 8,
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontFamily: theme.fonts.body,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    locationsContainer: {
        marginBottom: theme.spacing.md,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    locationText: {
        flex: 1,
        color: theme.colors.text.primary,
        fontSize: 15,
        fontFamily: theme.fonts.body,
    },
    verticalLine: {
        width: 1,
        height: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 3,
        marginVertical: 2,
    },
    tripFooter: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: theme.spacing.md,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: theme.spacing.xl,
    },
    footerText: {
        marginLeft: 6,
        color: theme.colors.text.secondary,
        fontSize: 13,
    },
});
