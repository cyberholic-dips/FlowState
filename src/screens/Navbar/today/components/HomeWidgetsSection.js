import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function HomeWidgetsSection({
    styles,
    theme,
    projects,
    habits,
    completedCount,
    lifeWidget,
    onOpenProjectModal,
    onOpenHabitModal,
    onOpenLifeScreen,
    onViewTasks,
    onViewHabits,
}) {
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };

    const tasksCount = projects.length;
    const habitsTotal = habits.length;
    const habitsPercent = habitsTotal ? Math.round((completedCount / habitsTotal) * 100) : 0;
    const lifeSegments = Array.from({ length: 20 }, (_, i) => i < Math.round((lifeWidget.passedPercent / 100) * 20));
    const hasBirthDate = Boolean(lifeWidget.birthDate);

    const formatYearsMonths = (value) => {
        const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
        const totalMonths = Math.round(safe * 12);
        const years = Math.floor(totalMonths / 12);
        const months = totalMonths % 12;
        return `${years}y ${months}m`;
    };

    return (
        <View style={styles.widgetsSection}>
            <Text style={[styles.widgetsTitle, { color: theme.text }]}>Home Widgets</Text>

            <View style={styles.widgetsRow}>
                <TouchableOpacity
                    style={[styles.widgetCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
                    onPress={() => {
                        triggerTapFeedback();
                        onOpenProjectModal();
                    }}
                    activeOpacity={0.86}
                >
                    <View style={styles.widgetTop}>
                        <View style={[styles.widgetIcon, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="checkmark-done-outline" size={16} color={theme.primary} />
                        </View>
                        <Text style={[styles.widgetAction, { color: theme.primary }]}>Create</Text>
                    </View>
                    <Text style={[styles.widgetLabel, { color: theme.subText }]}>Tasks to Complete</Text>
                    <Text style={[styles.widgetValue, { color: theme.text }]}>{tasksCount}</Text>
                    <TouchableOpacity
                        style={[styles.widgetSubAction, { borderColor: theme.border }]}
                        onPress={() => {
                            triggerTapFeedback();
                            onViewTasks();
                        }}
                    >
                        <Text style={[styles.widgetSubActionText, { color: theme.subText }]}>View</Text>
                    </TouchableOpacity>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.widgetCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
                    onPress={() => {
                        triggerTapFeedback();
                        onOpenHabitModal();
                    }}
                    activeOpacity={0.86}
                >
                    <View style={styles.widgetTop}>
                        <View style={[styles.widgetIcon, { backgroundColor: theme.success + '20' }]}>
                            <Ionicons name="flame-outline" size={16} color={theme.success} />
                        </View>
                        <Text style={[styles.widgetAction, { color: theme.success }]}>Track</Text>
                    </View>
                    <Text style={[styles.widgetLabel, { color: theme.subText }]}>Daily Habits</Text>
                    <Text style={[styles.widgetValue, { color: theme.text }]}>{completedCount}/{habitsTotal}</Text>
                    <Text style={[styles.widgetMeta, { color: theme.subText }]}>{habitsPercent}% complete</Text>
                    <TouchableOpacity
                        style={[styles.widgetSubAction, { borderColor: theme.border }]}
                        onPress={() => {
                            triggerTapFeedback();
                            onViewHabits();
                        }}
                    >
                        <Text style={[styles.widgetSubActionText, { color: theme.subText }]}>View</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.lifeWidgetCard, { backgroundColor: theme.glassBackground, borderColor: theme.glassBorder }]}
                onPress={() => {
                    triggerTapFeedback();
                    onOpenLifeScreen();
                }}
                activeOpacity={0.9}
            >
                <View style={styles.lifeWidgetHeader}>
                    <Text style={[styles.lifeWidgetTitle, { color: theme.text }]}>Life Activity Map</Text>
                    <View style={[styles.lifeBadge, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.lifeBadgeText, { color: theme.primary }]}>
                            {Math.round(lifeWidget.passedPercent)}% passed
                        </Text>
                    </View>
                </View>

                <View style={styles.lifeMetricRow}>
                    <View style={styles.lifeMetricItem}>
                        <Text style={[styles.lifeMetricLabel, { color: theme.subText }]}>Age</Text>
                        <Text style={[styles.lifeMetricValue, { color: theme.text }]}>
                            {hasBirthDate ? formatYearsMonths(lifeWidget.ageYears) : '--'}
                        </Text>
                    </View>
                    <View style={styles.lifeMetricItem}>
                        <Text style={[styles.lifeMetricLabel, { color: theme.subText }]}>Remaining</Text>
                        <Text style={[styles.lifeMetricValue, { color: theme.text }]}>
                            {hasBirthDate ? formatYearsMonths(lifeWidget.remainingYears) : '--'}
                        </Text>
                    </View>
                    <View style={styles.lifeMetricItem}>
                        <Text style={[styles.lifeMetricLabel, { color: theme.subText }]}>Life Bar</Text>
                        <Text style={[styles.lifeMetricValue, { color: theme.text }]}>{lifeWidget.lifeExpectancy}y</Text>
                    </View>
                </View>

                <View style={[styles.lifeProgressTrack, { backgroundColor: theme.input }]}>
                    <View
                        style={[
                            styles.lifeProgressFill,
                            { width: `${lifeWidget.passedPercent}%`, backgroundColor: theme.primary },
                        ]}
                    />
                </View>

                <View style={styles.lifeMapRow}>
                    {lifeSegments.map((isFilled, index) => (
                        <View
                            key={`segment-${index}`}
                            style={[
                                styles.lifeMapSegment,
                                {
                                    backgroundColor: isFilled ? theme.primary : theme.border,
                                    opacity: isFilled ? 1 : 0.6,
                                },
                            ]}
                        />
                    ))}
                </View>

                {!hasBirthDate && (
                    <Text style={[styles.lifeEmptyHint, { color: theme.subText }]}>
                        Set your birth date in Life to unlock accurate age and remaining years.
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
