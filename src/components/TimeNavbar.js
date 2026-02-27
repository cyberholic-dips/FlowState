import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function TimeNavbar({ onAddEvent, onToggleTimeline, isTimelineExpanded }) {
    const { currentTime, isFocusRunning, focusTitle, reminders } = useTime();
    const { theme } = useTheme();

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Get status color
    const getStatusColor = () => {
        if (isFocusRunning) return theme.primary; // Blue for focus

        const now = new Date();
        const upcoming = reminders.find(r => r.enabled && !r.triggered);
        if (upcoming) {
            const [hrs, mins] = upcoming.time.split(':').map(Number);
            const target = new Date();
            target.setHours(hrs, mins, 0, 0);
            const diff = (target - now) / 60000;
            if (diff < 0) return theme.danger; // Red for overdue
            if (diff < 15) return theme.warning; // Yellow for soon
        }

        return theme.subText + '40'; // Neutral
    };

    return (
        <View style={[styles.navbar, { backgroundColor: theme.glassBackground, borderBottomColor: theme.glassBorder }]}>
            <TouchableOpacity
                style={styles.expandTrigger}
                onPress={onToggleTimeline}
                activeOpacity={0.7}
            >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                <View>
                    <Text style={[styles.clock, { color: theme.text }]}>{formatTime(currentTime)}</Text>
                    <Text style={[styles.statusText, { color: theme.subText }]}>
                        {isFocusRunning ? `Focusing: ${focusTitle}` : 'Personal Time OS'}
                    </Text>
                </View>
                <Ionicons
                    name={isTimelineExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.subText}
                    style={{ marginLeft: 8 }}
                />
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={onAddEvent}
            >
                <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderBottomWidth: 1,
        zIndex: 100,
    },
    expandTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    clock: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: -2,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    }
});
