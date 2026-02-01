import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

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
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Statistics</Text>
                    <Text style={styles.subtitle}>Your consistency journey</Text>
                </View>

                {/* Main Highlight Card */}
                <View style={styles.highlightCard}>
                    <View style={styles.highlightInfo}>
                        <Text style={styles.highlightLabel}>Total Completion</Text>
                        <Text style={styles.highlightValue}>{stats.totalCompletion}%</Text>
                        <Text style={styles.highlightTrend}>
                            <Ionicons name="trending-up" size={16} color="#34D399" />
                            <Text style={styles.trendText}> +12% from last week</Text>
                        </Text>
                    </View>
                    <View style={styles.highlightIcon}>
                        <Ionicons name="ribbon-outline" size={48} color="white" />
                    </View>
                </View>

                {/* Weekly Activity Graph */}
                <View style={styles.chartSection}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <View style={styles.chartContainer}>
                        {weeklyData.map((day, index) => (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barBackground}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            { height: `${Math.max(5, day.percentage * 100)}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{day.dayName}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                            <Ionicons name="flame" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.statsValue}>{stats.bestStreak}</Text>
                        <Text style={styles.statsLabel}>Best Streak</Text>
                    </View>
                    <View style={styles.statsCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="list" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.statsValue}>{stats.activeHabits}</Text>
                        <Text style={styles.statsLabel}>Active Habits</Text>
                    </View>
                </View>

                {/* Habit Breakdown */}
                <View style={styles.breakdownSection}>
                    <Text style={styles.sectionTitle}>Habit Breakdown</Text>
                    {habits.map(habit => (
                        <View key={habit.id} style={styles.breakdownItem}>
                            <View style={styles.breakdownHeader}>
                                <Text style={styles.breakdownName}>{habit.name}</Text>
                                <Text style={styles.breakdownPercent}>
                                    {habit.streak} day streak
                                </Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.min(100, (habit.streak / 30) * 100)}%` }
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
        backgroundColor: '#F9FAFB',
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
        color: '#111827',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 4,
    },
    highlightCard: {
        backgroundColor: '#10B981',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    highlightLabel: {
        color: '#D1FAE5',
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
        color: '#111827',
        marginBottom: 20,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 24,
        height: 200,
        shadowColor: '#000',
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
        backgroundColor: '#F3F4F6',
        borderRadius: 6,
        justifyContent: 'flex-end',
        marginBottom: 12,
    },
    barFill: {
        width: '100%',
        backgroundColor: '#10B981',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statsCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        width: (width - 64) / 2,
        shadowColor: '#000',
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
        color: '#111827',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    breakdownSection: {
        marginBottom: 20,
    },
    breakdownItem: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
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
        color: '#111827',
    },
    breakdownPercent: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    progressTrack: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 4,
    },
});
