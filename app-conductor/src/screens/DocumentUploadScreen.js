import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { theme } from '../theme/theme';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { ChevronLeft, Camera, FileText, CheckCircle2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const DocumentRow = ({ label, description, isUploaded, onPress }) => (
    <TouchableOpacity style={styles.docRow} onPress={onPress}>
        <GlassCard style={styles.docCard}>
            <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{label}</Text>
                <Text style={styles.docDescription}>{description}</Text>
            </View>
            <View style={styles.docStatus}>
                {isUploaded ? (
                    <CheckCircle2 color={theme.colors.success} size={28} />
                ) : (
                    <Camera color={theme.colors.text.secondary} size={28} />
                )}
            </View>
        </GlassCard>
    </TouchableOpacity>
);

export default function DocumentUploadScreen({ navigation }) {
    const [docs, setDocs] = useState({
        license: null,
        idCard: null,
        vehicleFront: null,
        vehicleBack: null,
        vehicleLeft: null,
        vehicleRight: null,
        vehicleInterior: null,
        profilePicture: null,
    });
    const [serviceType, setServiceType] = useState('URBAN');

    const pickImage = async (key) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setDocs({ ...docs, [key]: result.assets[0].uri });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft color={theme.colors.text.primary} size={28} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Documentación</Text>
                    <Text style={styles.subtitle}>Sube tus documentos para verificar tu cuenta</Text>
                </View>

                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionTitle}>Identificación Personal</Text>
                    <Text style={styles.sectionSubtitle}>Fotos de tus documentos y de ti</Text>
                </View>

                <DocumentRow
                    label="Tu Foto de Perfil"
                    description="Selfie actual de frente, sin gorra ni lentes"
                    isUploaded={!!docs.profilePicture}
                    onPress={() => pickImage('profilePicture')}
                />

                <DocumentRow
                    label="Licencia de Conducir"
                    description="Foto legible por ambos lados"
                    isUploaded={!!docs.license}
                    onPress={() => pickImage('license')}
                />

                <DocumentRow
                    label="Cédula de Ciudadanía"
                    description="Foto de documento de identidad"
                    isUploaded={!!docs.idCard}
                    onPress={() => pickImage('idCard')}
                />

                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionTitle}>Fotos del Vehículo</Text>
                    <Text style={styles.sectionSubtitle}>Asegúrate de que haya buena iluminación</Text>
                </View>

                <DocumentRow
                    label="Frontal"
                    description="Parte delantera del auto"
                    isUploaded={!!docs.vehicleFront}
                    onPress={() => pickImage('vehicleFront')}
                />

                <DocumentRow
                    label="Trasera"
                    description="Parte posterior con placa"
                    isUploaded={!!docs.vehicleBack}
                    onPress={() => pickImage('vehicleBack')}
                />

                <DocumentRow
                    label="Lateral Izquierda"
                    description="Lado del conductor"
                    isUploaded={!!docs.vehicleLeft}
                    onPress={() => pickImage('vehicleLeft')}
                />

                <DocumentRow
                    label="Lateral Derecha"
                    description="Lado del pasajero"
                    isUploaded={!!docs.vehicleRight}
                    onPress={() => pickImage('vehicleRight')}
                />

                <DocumentRow
                    label="Interior"
                    description="Tablero y asientos"
                    isUploaded={!!docs.vehicleInterior}
                    onPress={() => pickImage('vehicleInterior')}
                />

                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionTitle}>Tipo de Servicio</Text>
                    <Text style={styles.sectionSubtitle}>¿Dónde prestarás tus servicios?</Text>
                </View>

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

                <View style={styles.footer}>
                    <GradientButton
                        title="Finalizar Registro"
                        onPress={() => navigation.navigate('Map', { serviceType })}
                        style={styles.footerButton}
                        colors={Object.values(docs).every(v => v) ? [theme.colors.success, '#34D399'] : ['#475569', '#64748b']}
                    />
                    <Text style={styles.footerNote}>
                        Nuestro equipo revisará tus documentos en un plazo de 24-48 horas.
                    </Text>
                </View>
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
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: 32,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
    },
    docRow: {
        marginBottom: theme.spacing.md,
    },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
    },
    docInfo: {
        flex: 1,
    },
    docLabel: {
        fontSize: 18,
        fontFamily: theme.fonts.heading,
        color: theme.colors.text.primary,
    },
    docDescription: {
        fontSize: 14,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
    },
    docStatus: {
        marginLeft: theme.spacing.md,
    },
    footer: {
        marginTop: theme.spacing.xl * 2,
        alignItems: 'center',
    },
    footerButton: {
        width: '100%',
        marginBottom: theme.spacing.md,
    },
    footerNote: {
        fontSize: 12,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    sectionDivider: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: theme.fonts.heading,
        color: theme.colors.primary[0],
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: theme.fonts.body,
        color: theme.colors.text.secondary,
    },
    serviceSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: theme.borderRadius.lg,
        padding: 6,
        marginVertical: theme.spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    serviceTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: theme.borderRadius.md,
    },
    serviceTabActive: {
        backgroundColor: theme.colors.primary[0],
    },
    serviceText: {
        color: theme.colors.text.secondary,
        fontFamily: theme.fonts.body,
        fontWeight: 'bold',
        fontSize: 14,
    },
    serviceTextActive: {
        color: '#FFFFFF',
    }
});
