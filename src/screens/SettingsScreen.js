import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Customize your experience</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.placeholder}>⚙️</Text>
                <Text style={styles.placeholderText}>Settings will appear here</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    placeholder: {
        fontSize: 64,
        marginBottom: 16,
    },
    placeholderText: {
        fontSize: 16,
        color: '#9CA3AF',
    },
});
