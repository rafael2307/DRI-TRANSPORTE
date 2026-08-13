import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { ChevronLeft, Star, TrendingUp, DollarSign, Clock, MapPin } from 'lucide-react-native';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <GlassCard style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <Icon color={color} size={24} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </GlassCard>
);

export default function ConductorDashboardScreen({ navigation }) {
    const [stats] = useState({
        rating: 4.8,
        totalEarnings: 850000,
        tripsToday: 12,
        onlineHours: 45,
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft color={theme.colors.text.primary} size={28} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Mi Panel</Text>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        icon={Star}
                        label="Calificación"
                        value={stats.rating.toString()}
                        color="#FBBF24"
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Ganancias Total"
                        value={`$${stats.totalEarnings.toLocaleString()}`}
                        color={theme.colors.success}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Viajes Hoy"
                        value={stats.tripsToday.toString()}
                        color={theme.colors.primary[0]}
                    />
                    <StatCard
                        icon={Clock}
                        label="Horas Online"
                        value={stats.onlineHours.toString()}
                        color="#818CF8"
                    />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Últimas Reseñas</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('History')}>
                        <Text style={styles.seeAll}>Ver todo</Text>
                    </TouchableOpacity>
                </View>

                <GlassCard style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>Juan Perez</Text>
                        <View style={styles.reviewRating}>
                            <Star size={14} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.ratingText}>5.0</Text>
                        </View>
                    </View>
                    <Text style={styles.reviewComment}>"Excelente conductor, muy amable y el carro estaba impecable."</Text>
                    <Text style={styles.reviewDate}>Hace 2 horas</Text>
                </GlassCard>

                <GlassCard style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>Maria Lopez</Text>
                        <View style={styles.reviewRating}>
                            <Star size={14} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.ratingText}>4.5</Text>
                        </View>
                    </View>
                    <Text style={styles.reviewComment}>"Manejó con mucho cuidado, llegamos a tiempo."</Text>
                    <Text style={styles.reviewDate}>Ayer</Text>
                </GlassCard>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    backButton: {
        padding: 8,
        marginRight: theme.spacing.md,
    },
    title: {
        fontSize: 28,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        width: '48%',
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    seeAll: {
        color: theme.colors.primary[0],
        fontSize: 14,
        fontWeight: 'bold',
    },
    reviewCard: {
        marginBottom: theme.spacing.md,
        padding: theme.spacing.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerName: {
        color: theme.colors.text.primary,
        fontSize: 16,
        fontFamily: theme.fonts.heading,
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    ratingText: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    reviewComment: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontFamily: theme.fonts.body,
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewDate: {
        color: theme.colors.text.secondary,
        fontSize: 12,
        opacity: 0.6,
    },
});
