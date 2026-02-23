import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Dimensions, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { storage } from '../../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { ContributionGraph } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// Helper to get exactly 90 days ago for the heatmap
const getStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
};

// Helper to convert hex to rgba
const hexToRgba = (hex, opacity = 1) => {
    let rawHex = hex.replace('#', '');
    if (rawHex.length === 3) {
        rawHex = rawHex.split('').map(char => char + char).join('');
    }
    const r = parseInt(rawHex.slice(0, 2), 16) || 0;
    const g = parseInt(rawHex.slice(2, 4), 16) || 0;
    const b = parseInt(rawHex.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function StatsScreen() {
    const { theme } = useTheme();
    const [habits, setHabits] = useState([]);
    const [heatmapData, setHeatmapData] = useState([]);
    const [stats, setStats] = useState({
        totalCompletion: 0,
        bestStreak: 0,
        activeHabits: 0
    });
    const [focusSessions, setFocusSessions] = useState([]);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const calculateStats = useCallback((loadedHabits) => {
        // Calculate Heatmap Data
        const dateCounts = {};
        loadedHabits.forEach(habit => {
            if (habit.completedDates) {
                habit.completedDates.forEach(dateStr => {
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                });
            }
        });

        const formattedHeatmapData = Object.keys(dateCounts).map(date => ({
            date,
            count: dateCounts[date]
        }));

        setHeatmapData(formattedHeatmapData);

        const totalStreaks = loadedHabits.map(h => h.streak || 0);
        const bestStreak = totalStreaks.length > 0 ? Math.max(...totalStreaks) : 0;

        let totalCompletions = 0;
        loadedHabits.forEach(h => {
            totalCompletions += (h.completedDates?.length || 0);
        });

        setStats({
            totalCompletion: loadedHabits.length > 0 ? Math.round((totalCompletions / (loadedHabits.length * 30)) * 100) : 0,
            bestStreak,
            activeHabits: loadedHabits.length
        });
    }, []);

    const loadData = async () => {
        const storedHabits = await storage.getHabits();
        const storedSessions = await storage.getFocusSessions();
        setHabits(storedHabits);
        setFocusSessions(storedSessions);
        calculateStats(storedHabits);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleDeleteFocusSession = async (id) => {
        const updatedSessions = await storage.deleteFocusSession(id);
        setFocusSessions(updatedSessions);
    };

    const formatDuration = (ms) => {
        const mins = Math.floor(ms / 60000);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins % 60}m`;
        }
        return `${mins}m`;
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
                    <Text style={[styles.subtitle, { color: theme.subText }]}>Visualizing your progress</Text>
                </Animated.View>

                {/* Main Highlight Card with Gradient */}
                <Animated.View style={[styles.highlightCardContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <LinearGradient
                        colors={[theme.primary, theme.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.highlightCard}
                    >
                        <View style={styles.highlightInfo}>
                            <Text style={[styles.highlightLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>Efficiency Score</Text>
                            <Text style={styles.highlightValue}>{stats.totalCompletion}%</Text>
                            <View style={styles.trendContainer}>
                                <Ionicons name="sparkles" size={16} color="white" />
                                <Text style={styles.trendText}> Keep it up! You're thriving</Text>
                            </View>
                        </View>
                        <View style={styles.highlightIcon}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="flash" size={32} color="white" />
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Activity Heatmap Section */}
                <Animated.View style={[styles.chartSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Activity Map</Text>
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>Last 90 Days</Text>
                    </View>
                    <View style={[styles.chartContainer, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow, paddingLeft: 0, paddingRight: 0 }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            <ContributionGraph
                                values={heatmapData}
                                endDate={new Date()}
                                numDays={90}
                                width={width * 1.5}
                                height={220}
                                chartConfig={{
                                    backgroundColor: 'transparent',
                                    backgroundGradientFrom: theme.glassBackground,
                                    backgroundGradientTo: theme.glassBackground,
                                    backgroundGradientFromOpacity: 0,
                                    backgroundGradientToOpacity: 0,
                                    color: (opacity = 1) => theme.primary.startsWith('#') ? hexToRgba(theme.primary, opacity) : `rgba(50, 150, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => theme.subText.startsWith('#') ? hexToRgba(theme.subText, opacity) : `rgba(150, 150, 150, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForLabels: {
                                        fontSize: 10,
                                        fontWeight: '500'
                                    }
                                }}
                                tooltipDataAttrs={(value) => ({
                                    'data-tooltip': value.date ? `${value.date}: ${value.count} habits` : 'No data'
                                })}
                                getColor={(value) => {
                                    if (!value || value.count === 0) return theme.input; // empty background color
                                    return theme.primary; // Or calculate opacity based on value.count
                                }}
                                squareSize={20}
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </ScrollView>
                    </View>
                </Animated.View>

                {/* Stats Grid with Interactive Cards */}
                <View style={styles.statsGrid}>
                    <TouchableOpacity style={[styles.statsCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                        <LinearGradient
                            colors={[theme.primary + '20', theme.primary + '10']}
                            style={styles.iconBox}
                        >
                            <Ionicons name="flame" size={20} color={theme.primary} />
                        </LinearGradient>
                        <Text style={[styles.statsValue, { color: theme.text }]}>{stats.bestStreak}</Text>
                        <Text style={[styles.statsLabel, { color: theme.subText }]}>Best Streak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.statsCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder, borderWidth: 1, shadowColor: theme.shadow }]}>
                        <LinearGradient
                            colors={[theme.secondary + '20', theme.secondary + '10']}
                            style={styles.iconBox}
                        >
                            <Ionicons name="list" size={20} color={theme.secondary} />
                        </LinearGradient>
                        <Text style={[styles.statsValue, { color: theme.text }]}>{stats.activeHabits}</Text>
                        <Text style={[styles.statsLabel, { color: theme.subText }]}>Active Habits</Text>
                    </TouchableOpacity>
                </View>

                {/* Habit Breakdown Section */}
                <View style={styles.breakdownSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Habit Breakdown</Text>
                    {habits.map((habit, index) => (
                        <Animated.View
                            key={habit.id}
                            style={[
                                styles.breakdownItem,
                                {
                                    backgroundColor: theme.glassBackground,
                                    borderColor: theme.glassBorder,
                                    borderWidth: 1,
                                    shadowColor: theme.shadow,
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <View style={styles.breakdownHeader}>
                                <View style={styles.habitTitleRow}>
                                    <View style={[styles.habitDot, { backgroundColor: theme.primary }]} />
                                    <Text style={[styles.breakdownName, { color: theme.text }]}>{habit.name}</Text>
                                </View>
                                <Text style={[styles.breakdownPercent, { color: theme.primary }]}>
                                    {habit.streak}d streak
                                </Text>
                            </View>
                            <View style={[styles.progressTrack, { backgroundColor: theme.input }]}>
                                <LinearGradient
                                    colors={[theme.primary, theme.primary + '80']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.progressFill,
                                        { width: `${Math.min(100, (habit.streak / 30) * 100)}%` }
                                    ]}
                                />
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* Focus Sessions Section */}
                <View style={styles.focusSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Focus History</Text>
                    {focusSessions.length === 0 ? (
                        <View style={[styles.emptyFocusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="timer-outline" size={42} color={theme.subText} />
                            <Text style={[styles.emptyFocusText, { color: theme.subText }]}>No sessions recorded yet</Text>
                            <Text style={[styles.emptyFocusSubText, { color: theme.subText }]}>Stay focused for at least 30 mins to track</Text>
                        </View>
                    ) : (
                        focusSessions.map(session => (
                            <View key={session.id} style={[styles.focusItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                                <View style={styles.focusInfo}>
                                    <View style={[styles.focusIconBox, { backgroundColor: theme.input }]}>
                                        <Ionicons name="stopwatch" size={24} color={theme.primary} />
                                    </View>
                                    <View style={styles.focusTextContent}>
                                        <Text style={[styles.focusTitle, { color: theme.text }]}>{session.title}</Text>
                                        <Text style={[styles.focusMeta, { color: theme.subText }]}>
                                            {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {formatDuration(session.duration)}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDeleteFocusSession(session.id)}
                                    style={styles.deleteButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
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
        paddingHorizontal: 20,
    },
    header: {
        paddingTop: 24,
        paddingBottom: 24,
    },
    title: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.8,
    },
    highlightCardContainer: {
        marginBottom: 32,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    highlightCard: {
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    highlightLabel: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    highlightValue: {
        color: 'white',
        fontSize: 44,
        fontWeight: '900',
        marginBottom: 12,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    trendText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    highlightIcon: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    chartSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 20,
        borderRadius: 24,
        height: 180,
        elevation: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    barWrapper: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    barBackground: {
        width: 14,
        height: '80%',
        borderRadius: 7,
        justifyContent: 'flex-end',
        marginBottom: 12,
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: 7,
        overflow: 'hidden',
    },
    barGradient: {
        flex: 1,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '700',
    },
    tooltip: {
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
    },
    tooltipText: {
        fontSize: 13,
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
        width: (width - 56) / 2,
        elevation: 2,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statsValue: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 4,
    },
    statsLabel: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.7,
    },
    breakdownSection: {
        marginBottom: 32,
    },
    breakdownItem: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        elevation: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
    },
    breakdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    habitTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    habitDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    breakdownName: {
        fontSize: 17,
        fontWeight: '700',
    },
    breakdownPercent: {
        fontSize: 14,
        fontWeight: '800',
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    focusSection: {
        marginBottom: 20,
    },
    emptyFocusCard: {
        padding: 48,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    emptyFocusText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '700',
    },
    emptyFocusSubText: {
        marginTop: 4,
        fontSize: 13,
        opacity: 0.6,
        textAlign: 'center',
    },
    focusItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        borderRadius: 24,
        marginBottom: 12,
        elevation: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
    },
    focusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    focusIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    focusTextContent: {
        flex: 1,
    },
    focusTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    focusMeta: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.6,
    },
    deleteButton: {
        padding: 10,
    },
});
