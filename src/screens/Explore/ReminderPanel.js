import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTime } from '../../context/TimeContext';
import { useTheme } from '../../context/ThemeContext';

export default function ReminderPanel({ onAddClick }) {
    const { reminders, currentTime } = useTime();
    const { theme } = useTheme();

    const getUrgencyInfo = (timeStr) => {
        const [hrs, mins] = timeStr.split(':').map(Number);
        const target = new Date();
        target.setHours(hrs, mins, 0, 0);

        const now = currentTime;
        const diffMs = target - now;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMs < 0) return { label: 'Overdue', color: theme.danger };
        if (diffMins < 15) return { label: 'Soon', color: theme.warning };
        return { label: 'Scheduled', color: theme.success };
    };

    const formatCountdown = (timeStr) => {
        const [hrs, mins] = timeStr.split(':').map(Number);
        const target = new Date();
        target.setHours(hrs, mins, 0, 0);

        const diffMs = target - currentTime;
        if (diffMs < 0) return 'Passed';

        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        const s = Math.floor((diffMs % 60000) / 1000);

        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    return (
        <View style={[styles.panel, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}>
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: theme.secondary + '15' }]}>
                    <Ionicons name="notifications-outline" size={24} color={theme.secondary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>Reminders</Text>

                <TouchableOpacity
                    style={[styles.miniAdd, { backgroundColor: theme.input }]}
                    onPress={onAddClick}
                >
                    <Ionicons name="add" size={20} color={theme.text} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {reminders.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={32} color={theme.subText} />
                        <Text style={[styles.emptyText, { color: theme.subText }]}>No events scheduled</Text>
                    </View>
                ) : (
                    reminders.map(item => {
                        const urgency = getUrgencyInfo(item.time);
                        return (
                            <View
                                key={item.id}
                                style={[styles.item, { backgroundColor: theme.input, borderColor: theme.border }]}
                            >
                                <View style={styles.itemInfo}>
                                    <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title || 'Untitled Reminder'}</Text>
                                    <Text style={[styles.itemTime, { color: theme.subText }]}>{item.time}</Text>
                                </View>
                                <View style={styles.itemStatus}>
                                    <Text style={[styles.urgency, { color: urgency.color }]}>{urgency.label}</Text>
                                    <Text style={[styles.countdown, { color: theme.text }]}>
                                        {formatCountdown(item.time)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.subText }]}>
                    Next event in {reminders.length > 0 ? formatCountdown(reminders[0].time) : '--'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: {
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        height: 480,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    miniAdd: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    empty: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    item: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    itemTime: {
        fontSize: 12,
        fontWeight: '600',
    },
    itemStatus: {
        alignItems: 'flex-end',
    },
    urgency: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    countdown: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    footer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        fontWeight: '700',
    }
});
