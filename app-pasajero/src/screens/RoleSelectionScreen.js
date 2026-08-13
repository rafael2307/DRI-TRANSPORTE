import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ImageBackground } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { User, Car } from 'lucide-react-native';

export default function RoleSelectionScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Bienvenido a Neo-Motion</Text>
                <Text style={styles.subtitle}>Elige cómo deseas moverte hoy</Text>

                <TouchableOpacity
                    style={styles.cardWrapper}
                    onPress={() => navigation.navigate('Login', { role: 'passenger' })}
                >
                    <GlassCard style={styles.card}>
                        <View style={styles.iconContainer}>
                            <User size={48} color={theme.colors.primary[0]} />
                        </View>
                        <Text style={styles.cardTitle}>Quiero viajar</Text>
                        <Text style={styles.cardDescription}>
                            Solicita un viaje seguro y cómodo en segundos.
                        </Text>
                    </GlassCard>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cardWrapper}
                    onPress={() => {
                        // In a real app, this would open the Driver app or switch mode
                        alert('Cambiando a modo Conductor...');
                    }}
                >
                    <GlassCard style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Car size={48} color={theme.colors.success} />
                        </View>
                        <Text style={styles.cardTitle}>Quiero conducir</Text>
                        <Text style={styles.cardDescription}>
                            Genera ingresos extra con tu vehículo.
                        </Text>
                    </GlassCard>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xl * 1.5,
        textAlign: 'center',
    },
    cardWrapper: {
        marginBottom: theme.spacing.lg,
    },
    card: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: theme.spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
    },
    cardTitle: {
        fontSize: 22,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    cardDescription: {
        fontSize: 14,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.md,
    },
});
