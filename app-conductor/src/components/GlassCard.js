import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../theme/theme';

export const GlassCard = ({ children, style }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.glass,
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
    },
    blur: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.lg,
    },
});
