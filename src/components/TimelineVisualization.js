import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function TimelineVisualization({ onAddClick }) {
    const { reminders, isFocusRunning, focusTime, currentTime } = useTime();
    const { theme } = useTheme();

    // Generate hours for the timeline (6 AM to Midnight)
    const hours = useMemo(() => {
        const arr = [];
        for (let i = 6; i <= 24; i++) {
            arr.push(i);
        }
        return arr;
    }, []);

    const getCurrentPosition = () => {
        const now = currentTime;
        const h = now.getHours();
        const m = now.getMinutes();
        if (h < 6) return 0; // Pre-timeline
        const pixelsPerHour = 100;
        return (h - 6) * pixelsPerHour + (m / 60) * pixelsPerHour;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.glassBackground, borderBottomColor: theme.glassBorder }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: getCurrentPosition() - width / 2, y: 0 }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={onAddClick}
                    style={styles.timelineContent}
                >
                    {/* Hour Markers */}
                    {hours.map(h => (
                        <View key={h} style={styles.hourMarker}>
                            <View style={[styles.line, { backgroundColor: theme.border }]} />
                            <Text style={[styles.hourText, { color: theme.subText }]}>
                                {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                            </Text>
                        </View>
                    ))}

                    {/* NOW Indicator */}
                    <View style={[styles.nowIndicator, { left: getCurrentPosition() }]}>
                        <LinearGradient
                            colors={[theme.primary, 'transparent']}
                            style={styles.nowLine}
                        />
                        <View style={[styles.nowDot, { backgroundColor: theme.primary }]} />
                    </View>

                    {/* Reminders on Timeline */}
                    {reminders.map(reminder => {
                        const [hrs, mins] = reminder.time.split(':').map(Number);
                        const pos = (hrs - 6) * 100 + (mins / 60) * 100;
                        if (hrs < 6) return null;

                        return (
                            <TouchableOpacity
                                key={reminder.id}
                                style={[styles.reminderSlot, { left: pos, backgroundColor: theme.warning + '30', borderColor: theme.warning }]}
                            >
                                <View style={[styles.reminderDot, { backgroundColor: theme.warning }]} />
                            </TouchableOpacity>
                        );
                    })}

                    {/* Active Focus Session - Visualized as a growing bar */}
                    {isFocusRunning && (
                        <View
                            style={[
                                styles.focusBar,
                                {
                                    left: getCurrentPosition() - (focusTime / 3600000) * 100,
                                    width: (focusTime / 3600000) * 100,
                                    backgroundColor: theme.primary + '40',
                                    borderColor: theme.primary
                                }
                            ]}
                        />
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 80,
        borderBottomWidth: 1,
    },
    timelineContent: {
        width: 1900, // (24-6)*100 + buffer
        height: '100%',
        flexDirection: 'row',
        paddingTop: 10,
    },
    hourMarker: {
        width: 100,
        alignItems: 'center',
    },
    line: {
        width: 1,
        height: 20,
    },
    hourText: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
    },
    nowIndicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 2,
        alignItems: 'center',
        zIndex: 5,
    },
    nowLine: {
        width: 2,
        flex: 1,
    },
    nowDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        position: 'absolute',
        top: 5,
    },
    reminderSlot: {
        position: 'absolute',
        top: 35,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -10,
    },
    reminderDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    focusBar: {
        position: 'absolute',
        top: 38,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        zIndex: 1,
    }
});
