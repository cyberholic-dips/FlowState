import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomHeader({ navigation, route, options, back }) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const title = options.title !== undefined ? options.title : route.name;

    return (
        <View style={[styles.container, { backgroundColor: theme.card, paddingTop: insets.top }]}>
            <View style={styles.content}>
                {/* Left: Back Button */}
                <View style={styles.leftContainer}>
                    {back && (
                        <TouchableOpacity
                            onPress={navigation.goBack}
                            style={[styles.button, { backgroundColor: theme.background }]}
                        >
                            <Ionicons name="chevron-back" size={24} color={theme.text} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center: Title */}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                        {title}
                    </Text>
                </View>

                {/* Right: Home Button */}
                <View style={styles.rightContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MainTabs')}
                        style={[styles.button, { backgroundColor: theme.background }]}
                    >
                        <Ionicons name="home-outline" size={22} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 100,
    },
    content: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    titleContainer: {
        flex: 2,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    button: {
        width: 40,
        height: 40,
        borderRadius: 20, // Circular button
        justifyContent: 'center',
        alignItems: 'center',
        // Slight shadow for the button itself
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1.00,
        elevation: 1,
    },
});
