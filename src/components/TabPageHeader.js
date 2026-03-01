import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function TabPageHeader({ title, variant = 'default' }) {
    const { theme } = useTheme();
    const isMinimal = variant === 'minimal';
    const colors = theme.mode === 'dark'
        ? ['#1E3A8A', '#1D4ED8']
        : ['#3B82F6', '#2563EB'];

    if (isMinimal) {
        return (
            <View
                style={[
                    styles.minimalWrapper,
                    {
                        backgroundColor: theme.background,
                        borderBottomColor: theme.border,
                    },
                ]}
            >
                <Text style={[styles.minimalTitle, { color: theme.text }]}>{title}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.wrapper, { borderColor: theme.glassBorder }]}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.title}>{title}</Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 12,
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    minimalWrapper: {
        marginHorizontal: 16,
        marginTop: 25,
        paddingBottom: 8,
        borderBottomWidth: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    minimalTitle: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '700',
        textAlign: 'left',
    },
    header: {
        minHeight: 58,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        lineHeight: 34,
        fontWeight: '800',
        letterSpacing: 0.4,
        textAlign: 'center',
    },
});
