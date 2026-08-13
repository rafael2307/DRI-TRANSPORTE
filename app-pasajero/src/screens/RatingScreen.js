import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Star, X } from 'lucide-react-native';

export default function RatingScreen({ navigation, route }) {
    const { tripId, driverName } = route.params || { tripId: 'test-trip', driverName: 'Conductor' };
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Por favor selecciona una calificación');
            return;
        }
        setIsSubmitting(true);
        // Simulate API call to /reviews
        setTimeout(() => {
            setIsSubmitting(false);
            navigation.navigate('Map');
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.content}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.navigate('Map')}
                    >
                        <X color={theme.colors.text.primary} size={24} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>¿Cómo estuvo tu viaje?</Text>
                        <Text style={styles.subtitle}>Califica tu experiencia con {driverName}</Text>
                    </View>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                style={styles.starTouch}
                            >
                                <Star
                                    size={48}
                                    color={star <= rating ? '#FBBF24' : theme.colors.text.secondary}
                                    fill={star <= rating ? '#FBBF24' : 'transparent'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <GlassCard style={styles.commentCard}>
                        <TextInput
                            style={styles.input}
                            placeholder="Cuéntanos más (opcional)..."
                            placeholderTextColor={theme.colors.text.secondary}
                            multiline
                            numberOfLines={4}
                            value={comment}
                            onChangeText={setComment}
                        />
                    </GlassCard>

                    <GradientButton
                        title={isSubmitting ? "Enviando..." : "Enviar Calificación"}
                        onPress={handleSubmit}
                        style={styles.submitButton}
                        disabled={isSubmitting}
                    />
                </View>
            </KeyboardAvoidingView>
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
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl * 2,
    },
    title: {
        fontSize: 28,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl * 2,
    },
    starTouch: {
        marginHorizontal: 8,
    },
    commentCard: {
        marginBottom: theme.spacing.xl,
    },
    input: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        marginTop: theme.spacing.md,
    },
});
