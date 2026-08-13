import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Landmark, ArrowLeft, CreditCard, User, FileText } from 'lucide-react-native';

const API_BASE_URL = 'http://localhost:3000'; // Adjust as needed for physical device

const PROVIDERS = [
    { id: 'NEQUI', name: 'Nequi', color: '#DA0081' },
    { id: 'BANCOLOMBIA', name: 'Bancolombia', color: '#FDDA24' },
    { id: 'DAVIPLATA', name: 'Daviplata', color: '#F1000B' },
];

export default function WithdrawalScreen({ navigation }) {
    const [selectedProvider, setSelectedProvider] = useState('NEQUI');
    const [account, setAccount] = useState('');
    const [name, setName] = useState('');
    const [doc, setDoc] = useState('');

    const handleRegister = async () => {
        if (!account || !name || !doc) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            // userId should ideally come from auth context
            const mockUserId = '82ca3324-419b-466d-9799-a9a20464f177'; // Mock for now

            const response = await fetch(`${API_BASE_URL}/payments/bank-accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: mockUserId,
                    provider: selectedProvider,
                    account: account,
                    name: name,
                    doc: doc,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al registrar la cuenta');
            }

            alert(`Cuenta de ${selectedProvider} registrada con éxito`);
            navigation.goBack();
        } catch (error) {
            console.error(error);
            alert('Hubo un error al registrar la cuenta: ' + error.message);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color={theme.colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Método de Retiro</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.label}>Selecciona tu entidad</Text>
                <View style={styles.providerGrid}>
                    {PROVIDERS.map((p) => (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => setSelectedProvider(p.id)}
                            style={styles.providerItem}
                        >
                            <GlassCard style={[
                                styles.providerCard,
                                selectedProvider === p.id && { borderColor: theme.colors.primary[0], borderWidth: 2 }
                            ]}>
                                <Landmark color={p.color} size={32} />
                                <Text style={styles.providerName}>{p.name}</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    ))}
                </View>

                <GlassCard style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <View style={styles.iconContainer}>
                            <CreditCard color={theme.colors.primary[0]} size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Número de cuenta / Celular"
                            placeholderTextColor="#64748b"
                            value={account}
                            onChangeText={setAccount}
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.iconContainer}>
                            <User color={theme.colors.primary[0]} size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del titular"
                            placeholderTextColor="#64748b"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={styles.iconContainer}>
                            <FileText color={theme.colors.primary[0]} size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Documento de identidad"
                            placeholderTextColor="#64748b"
                            value={doc}
                            onChangeText={setDoc}
                            keyboardType="numeric"
                        />
                    </View>
                </GlassCard>

                <GradientButton
                    title="Guardar Configuración"
                    onPress={handleRegister}
                    style={styles.saveButton}
                />

                <Text style={styles.disclaimer}>
                    Los retiros se procesan en un máximo de 24 horas hábiles a la cuenta registrada.
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.lg,
    },
    headerTitle: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 20,
    },
    content: {
        padding: theme.spacing.lg,
    },
    label: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
        marginBottom: theme.spacing.md,
    },
    providerGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    providerItem: {
        width: '31%',
    },
    providerCard: {
        padding: theme.spacing.md,
        alignItems: 'center',
        borderRadius: theme.borderRadius.md,
        height: 100,
        justifyContent: 'center',
    },
    providerName: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        marginTop: theme.spacing.sm,
    },
    formCard: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.xl,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },
    iconContainer: {
        marginRight: theme.spacing.md,
    },
    input: {
        flex: 1,
        height: 50,
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.body,
        fontSize: 16,
    },
    saveButton: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    disclaimer: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    }
});
