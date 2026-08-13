import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { ChevronLeft, Chrome, Facebook, Music2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation, route }) {
    const { role } = route.params || { role: 'driver' };
    const { login, sendOtp } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async () => {
        if (phoneNumber.length < 10) {
            alert('Ingresa un número válido');
            return;
        }
        setIsLoading(true);
        const res = await sendOtp(phoneNumber, role);
        setIsLoading(false);
        if (res.success) {
            setIsVerifying(true);
        } else {
            alert(res.message);
        }
    };

    const handleVerifyOtp = async () => {
        setIsLoading(true);
        const res = await login(phoneNumber, verificationCode, role);
        setIsLoading(false);
        if (res.success) {
            navigation.navigate('DocumentUpload');
        } else {
            alert(res.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text.primary} size={28} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Bienvenido Socio</Text>
                    <Text style={styles.subtitle}>Ingresa tu número para gestionar tu cuenta</Text>
                </View>

                {!isVerifying ? (
                    <GlassCard style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Teléfono del Conductor</Text>
                        <View style={styles.phoneInputContainer}>
                            <Text style={styles.countryCode}>+57</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="300 123 4567"
                                placeholderTextColor={theme.colors.text.secondary}
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                    </GlassCard>
                ) : (
                    <GlassCard style={styles.inputCard}>
                        <Text style={styles.inputLabel}>Código de Verificación</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="123456"
                            placeholderTextColor={theme.colors.text.secondary}
                            keyboardType="number-pad"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            maxLength={6}
                        />
                    </GlassCard>
                )}

                <GradientButton
                    title={isLoading ? "Cargando..." : isVerifying ? "Verificar Código" : "Continuar"}
                    onPress={isVerifying ? handleVerifyOtp : handleSendOtp}
                    style={styles.mainButton}
                    colors={[theme.colors.success, '#34D399']}
                    disabled={isLoading}
                />

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>o conecta con</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => alert(`Iniciando Google con rol ${role} `)}
                    >
                        <GlassCard style={styles.socialIconCard}>
                            <Chrome color={theme.colors.text.primary} size={24} />
                        </GlassCard>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => alert(`Iniciando Facebook con rol ${role} `)}
                    >
                        <GlassCard style={styles.socialIconCard}>
                            <Facebook color="#1877F2" size={24} />
                        </GlassCard>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        onPress={() => alert(`Iniciando TikTok con rol ${role} `)}
                    >
                        <GlassCard style={styles.socialIconCard}>
                            <Music2 color="#fe2c55" size={24} />
                        </GlassCard>
                    </TouchableOpacity>
                </View>

                <Text style={styles.termsText}>
                    Al registrarte como conductor, aceptas nuestros <Text style={styles.link}>Términos de Socio</Text> y las <Text style={styles.link}>Leyes Locales de Transporte</Text>.
                </Text>
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
        flexGrow: 1,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginBottom: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing.xl * 1.5,
    },
    title: {
        fontSize: 36,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
    },
    inputCard: {
        marginBottom: theme.spacing.xl,
    },
    inputLabel: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        marginBottom: theme.spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countryCode: {
        fontSize: 20,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.md,
    },
    input: {
        flex: 1,
        fontSize: 20,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    mainButton: {
        marginBottom: theme.spacing.xl,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.glass,
    },
    dividerText: {
        paddingHorizontal: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl * 2,
    },
    socialButton: {
        marginHorizontal: theme.spacing.md,
    },
    socialIconCard: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
    },
    termsText: {
        textAlign: 'center',
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        lineHeight: 18,
    },
    link: {
        color: theme.colors.success,
        fontWeight: 'bold',
    },
});
