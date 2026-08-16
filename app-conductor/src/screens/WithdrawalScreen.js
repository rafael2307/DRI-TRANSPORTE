import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { Landmark, ArrowLeft, CreditCard, User, FileText, Wallet, Clock, CheckCircle2, XCircle, Pencil } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3000'; // Adjust as needed for physical device

const PROVIDERS = [
    { id: 'NEQUI', name: 'Nequi', color: '#DA0081' },
    { id: 'BANCOLOMBIA', name: 'Bancolombia', color: '#FDDA24' },
    { id: 'DAVIPLATA', name: 'Daviplata', color: '#F1000B' },
];

const STATUS_META = {
    PENDING: { label: 'En proceso', color: theme.colors.warning, Icon: Clock },
    COMPLETED: { label: 'Completado', color: theme.colors.success, Icon: CheckCircle2 },
    REJECTED: { label: 'Rechazado', color: theme.colors.error, Icon: XCircle },
};

const formatCOP = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;

export default function WithdrawalScreen({ navigation }) {
    const { user, token } = useAuth();
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bankAccount, setBankAccount] = useState(null);
    const [editingAccount, setEditingAccount] = useState(false);
    const [balance, setBalance] = useState({ totalEarnings: 0, totalWithdrawn: 0, available: 0 });
    const [withdrawals, setWithdrawals] = useState([]);

    const [selectedProvider, setSelectedProvider] = useState('NEQUI');
    const [account, setAccount] = useState('');
    const [name, setName] = useState('');
    const [doc, setDoc] = useState('');
    const [isSavingAccount, setIsSavingAccount] = useState(false);

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    const loadData = useCallback(async () => {
        if (!user?.id || !token) return;
        try {
            const [accountsRes, balanceRes, withdrawalsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/payments/bank-accounts/me`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/payments/balance/me`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/payments/withdrawals/me`, { headers: authHeaders }),
            ]);

            const accounts = accountsRes.ok ? await accountsRes.json() : [];
            const balanceData = balanceRes.ok ? await balanceRes.json() : null;
            const withdrawalsData = withdrawalsRes.ok ? await withdrawalsRes.json() : [];

            setBankAccount(accounts?.[0] || null);
            if (balanceData) setBalance(balanceData);
            setWithdrawals(withdrawalsData || []);
        } catch (error) {
            console.error('Error cargando datos de retiro:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleRegister = async () => {
        if (!account || !name || !doc) {
            alert('Por favor completa todos los campos');
            return;
        }
        if (!user?.id) {
            alert('No se pudo identificar tu usuario. Inicia sesión de nuevo.');
            return;
        }

        setIsSavingAccount(true);
        try {
            const response = await fetch(`${API_BASE_URL}/payments/bank-accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    provider: selectedProvider,
                    account,
                    name,
                    doc,
                }),
            });

            if (!response.ok) throw new Error('Error al registrar la cuenta');

            alert(`Cuenta de ${selectedProvider} registrada con éxito`);
            setAccount('');
            setName('');
            setDoc('');
            setEditingAccount(false);
            await loadData();
        } catch (error) {
            console.error(error);
            alert('Hubo un error al registrar la cuenta: ' + error.message);
        } finally {
            setIsSavingAccount(false);
        }
    };

    const handleRequestWithdrawal = async () => {
        const amount = Number(withdrawAmount);

        if (!bankAccount) {
            alert('Primero registra tu cuenta de retiro');
            return;
        }
        if (!amount || amount <= 0) {
            alert('Ingresa un monto válido');
            return;
        }
        if (amount > balance.available) {
            alert(`No puedes retirar más de tu saldo disponible (${formatCOP(balance.available)})`);
            return;
        }

        setIsRequesting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/payments/withdrawals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    bankAccountId: bankAccount.id,
                    amount,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || 'Error al solicitar el retiro');

            alert('Solicitud de retiro enviada. Se procesará en máximo 24 horas hábiles.');
            setWithdrawAmount('');
            await loadData();
        } catch (error) {
            console.error(error);
            alert('No se pudo solicitar el retiro: ' + error.message);
        } finally {
            setIsRequesting(false);
        }
    };

    const showAccountForm = editingAccount || !bankAccount;

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered]}>
                <ActivityIndicator color={theme.colors.primaryLight} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color={theme.colors.text.primary} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Retiros</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primaryLight} />}
            >
                {/* Saldo disponible */}
                <GlassCard style={styles.balanceCard}>
                    <View style={styles.balanceHeader}>
                        <Wallet color={theme.colors.primaryLight} size={22} />
                        <Text style={styles.balanceLabel}>Saldo disponible</Text>
                    </View>
                    <Text style={styles.balanceValue}>{formatCOP(balance.available)}</Text>
                    <Text style={styles.balanceSubtext}>
                        Ganado: {formatCOP(balance.totalEarnings)} · Retirado: {formatCOP(balance.totalWithdrawn)}
                    </Text>
                </GlassCard>

                {/* Cuenta de retiro */}
                {!showAccountForm ? (
                    <GlassCard style={styles.accountSummaryCard}>
                        <View style={styles.accountSummaryRow}>
                            <Landmark color={PROVIDERS.find(p => p.id === bankAccount.provider)?.color || theme.colors.primaryLight} size={28} />
                            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                                <Text style={styles.accountSummaryProvider}>
                                    {PROVIDERS.find(p => p.id === bankAccount.provider)?.name || bankAccount.provider}
                                </Text>
                                <Text style={styles.accountSummaryNumber}>{bankAccount.accountNumber}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setEditingAccount(true)} style={styles.editButton}>
                                <Pencil color={theme.colors.text.secondary} size={18} />
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                ) : (
                    <>
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
                            title={isSavingAccount ? 'Guardando...' : 'Guardar Configuración'}
                            onPress={handleRegister}
                            disabled={isSavingAccount}
                            style={styles.saveButton}
                        />

                        {bankAccount && (
                            <TouchableOpacity onPress={() => setEditingAccount(false)} style={styles.cancelEdit}>
                                <Text style={styles.cancelEditText}>Cancelar</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}

                {/* Solicitar retiro */}
                <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Solicitar retiro</Text>
                <GlassCard style={styles.formCard}>
                    <View style={styles.inputGroup}>
                        <View style={styles.iconContainer}>
                            <Wallet color={theme.colors.primary[0]} size={20} />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Monto a retirar"
                            placeholderTextColor="#64748b"
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                            keyboardType="numeric"
                        />
                    </View>
                </GlassCard>
                <GradientButton
                    title={isRequesting ? 'Enviando...' : 'Solicitar Retiro'}
                    onPress={handleRequestWithdrawal}
                    disabled={isRequesting || !bankAccount || balance.available <= 0}
                    style={styles.saveButton}
                />

                <Text style={styles.disclaimer}>
                    Los retiros se procesan en un máximo de 24 horas hábiles a la cuenta registrada.
                </Text>

                {/* Historial */}
                <Text style={[styles.label, { marginTop: theme.spacing.lg }]}>Historial de retiros</Text>
                {withdrawals.length === 0 ? (
                    <GlassCard style={styles.emptyHistoryCard}>
                        <Text style={styles.emptyHistoryText}>Aún no has solicitado retiros</Text>
                    </GlassCard>
                ) : (
                    withdrawals.map((w) => {
                        const meta = STATUS_META[w.status] || STATUS_META.PENDING;
                        const StatusIcon = meta.Icon;
                        return (
                            <GlassCard key={w.id} style={styles.historyRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyAmount}>{formatCOP(w.amount)}</Text>
                                    <Text style={styles.historyDate}>
                                        {new Date(w.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: `${meta.color}20` }]}>
                                    <StatusIcon color={meta.color} size={14} />
                                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                                </View>
                            </GlassCard>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
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
        paddingBottom: theme.spacing.xl,
    },
    balanceCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.xl,
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    balanceLabel: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 14,
        marginLeft: theme.spacing.sm,
    },
    balanceValue: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 32,
        marginBottom: theme.spacing.xs,
    },
    balanceSubtext: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
    },
    accountSummaryCard: {
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.xl,
    },
    accountSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accountSummaryProvider: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 16,
    },
    accountSummaryNumber: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 13,
        marginTop: 2,
    },
    editButton: {
        padding: 8,
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
        marginBottom: theme.spacing.md,
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
        marginBottom: theme.spacing.sm,
    },
    cancelEdit: {
        alignSelf: 'center',
        marginBottom: theme.spacing.lg,
        padding: 8,
    },
    cancelEditText: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 14,
    },
    disclaimer: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: theme.spacing.lg,
    },
    emptyHistoryCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        alignItems: 'center',
    },
    emptyHistoryText: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 14,
    },
    historyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.sm,
    },
    historyAmount: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 16,
    },
    historyDate: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontFamily: theme.fonts.bodyBold,
        marginLeft: 4,
    },
});
