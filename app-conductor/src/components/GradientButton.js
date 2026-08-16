import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';

export const GradientButton = ({ title, onPress, style, colors, disabled }) => {
    return (
        <TouchableOpacity
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            activeOpacity={disabled ? 1 : 0.7}
            style={[styles.container, disabled && styles.disabled, style]}
        >
            <LinearGradient
                colors={colors || theme.colors.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <Text style={styles.text}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: theme.colors.primary[0],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    disabled: {
        opacity: 0.5,
    },
    gradient: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: theme.colors.text.primary,
        fontFamily: theme.fonts.heading,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
