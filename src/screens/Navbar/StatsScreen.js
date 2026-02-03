import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Helper to get last 7 days including today
const getLastSevenDays = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate()
        });
    }
    return days;
};

export default function StatsScreen() {
    const { theme } = useTheme();
    const [habits, setHabits] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [stats, setStats] = useState({
        totalCompletion: 0,
        bestStreak: 0,
        activeHabits: 0
    });

    const calculateStats = useCallback((loadedHabits) => {
        const days = getLastSevenDays();
        const activity = days.map(day => {
            const completedCount = loadedHabits.filter(habit =>
                habit.completedDates && habit.completedDates.includes(day.dateStr)
            ).length;

            // Percentage of completion for the day
            const percentage = loadedHabits.length > 0 ? (completedCount / loadedHabits.length) : 0;
            return {
                ...day,
                completedCount,
                percentage
            };
        });

        setWeeklyData(activity);

        // General stats
        const totalStreaks = loadedHabits.map(h => h.streak || 0);
        const bestStreak = totalStreaks.length > 0 ? Math.max(...totalStreaks) : 0;

        // Average completion rate across all habits
        let totalDaysTracked = 0;
        let totalCompletions = 0;

        // For simplicity, let's assume a 30-day window or total completions
        loadedHabits.forEach(h => {
            totalCompletions += (h.completedDates?.length || 0);
        });

        setStats({
            totalCompletion: loadedHabits.length > 0 ? Math.round((totalCompletions / (loadedHabits.length * 30)) * 100) : 0, // Mocked against 30 days
            bestStreak,
            activeHabits: loadedHabits.length
        });
    }, []);

    const loadData = async () => {
        const storedHabits = await storage.getHabits();
        setHabits(storedHabits);
        calculateStats(storedHabits);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>Your consistency journey</Text>
                </View>

                {/* Main Highlight Card */}
                <View style={[styles.highlightCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                    <View style={styles.highlightInfo}>
                        <Text style={[styles.highlightLabel, { color: '#E5E7EB' }]}>Total Completion</Text>
                        <Text style={styles.highlightValue}>{stats.totalCompletion}%</Text>
                        <Text style={styles.highlightTrend}>
                            <Ionicons name="trending-up" size={16} color="white" />
                            <Text style={styles.trendText}> +12% from last week</Text>
                        </Text>
                    </View>
                    <View style={styles.highlightIcon}>
                        <Ionicons name="ribbon-outline" size={48} color="white" />
                    </View>
                </View>

                {/* Weekly Activity Graph */}
                <View style={styles.chartSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Weekly Activity</Text>
                    <View style={[styles.chartContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        {weeklyData.map((day, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <View style={[styles.barBackground, { backgroundColor: theme.input }]}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { height: `${Math.max(5, day.percentage * 100)}%`, backgroundColor: theme.primary }
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.barLabel, { color: theme.subText }]}>{day.dayName}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="flame" size={20} color="#3B82F6" />
                        </View>
                        <Text style={[styles.statsValue, { color: theme.text }]}>{stats.bestStreak}</Text>
                        <Text style={[styles.statsLabel, { color: theme.subText }]}>Best Streak</Text>
                    </View>
                    <View style={[styles.statsCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="list" size={20} color="#F59E0B" />
                        </View>
                        <Text style={[styles.statsValue, { color: theme.text }]}>{stats.activeHabits}</Text>
                        <Text style={[styles.statsLabel, { color: theme.subText }]}>Active Habits</Text>
                    </View>
                </View>

                {/* Habit Breakdown */}
                <View style={styles.breakdownSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Habit Breakdown</Text>
                    {habits.map(habit => (
                        <View key={habit.id} style={[styles.breakdownItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                            <View style={styles.breakdownHeader}>
                                <Text style={[styles.breakdownName, { color: theme.text }]}>{habit.name}</Text>
                                <Text style={[styles.breakdownPercent, { color: theme.primary }]}>
                                    {habit.streak} day streak
                                </Text>
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: theme.input }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.min(100, (habit.streak / 30) * 100)}%`, backgroundColor: theme.primary }
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        marginTop: 4,
    },
    highlightCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    highlightLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    highlightValue: {
        color: 'white',
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 8,
    },
    highlightTrend: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendText: {
        color: '#D1FAE5',
        fontSize: 12,
        fontWeight: '600',
    },
    chartSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 24,
        borderRadius: 24,
        height: 200,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barBackground: {
        width: 12,
        height: 120,
        borderRadius: 6,
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    barFill: {
        width: '100%',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statsCard: {
        borderRadius: 24,
        padding: 20,
        width: (width - 64) / 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statsValue: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    breakdownSection: {
        marginBottom: 20,
    },
    breakdownItem: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    breakdownName: {
        fontSize: 16,
        fontWeight: '700',
    },
    breakdownPercent: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
});
