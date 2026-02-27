import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';

export default function HabitsSection({
    styles,
    theme,
    habits,
    loadingHabits,
    habitsError,
    onRetryLoadHabits,
    completedCount,
    isCompleted,
    onToggleHabit,
    onEditHabit,
    onDeleteHabit,
    onOpenOptions,
    onOpenHabitModal,
}) {
    const triggerTapFeedback = () => {
        Haptics.selectionAsync().catch(() => null);
    };

    const renderHabitActions = (habit) => (
        <View style={styles.swipeActionsWrap}>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.success }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onToggleHabit(habit.id);
                }}
            >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onEditHabit(habit);
                }}
            >
                <Ionicons name="pencil" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.swipeActionButton, { backgroundColor: theme.danger }]}
                activeOpacity={0.8}
                onPress={() => {
                    triggerTapFeedback();
                    onDeleteHabit(habit.id);
                }}
            >
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.swipeActionLabel}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.habitsSection}>
            <View style={styles.habitsHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Habits</Text>
                <View style={[styles.progressBadge, { backgroundColor: theme.success + '15' }]}>
                    <Text style={[styles.progressText, { color: theme.success }]}>{completedCount}/{habits.length} done</Text>
                </View>
            </View>

            {loadingHabits && (
                <View style={[styles.sectionStateCard, { borderColor: theme.border, backgroundColor: theme.glassBackground }]}>
                    <ActivityIndicator color={theme.primary} />
                    <Text style={[styles.sectionStateText, { color: theme.subText }]}>Loading habits...</Text>
                </View>
            )}

            {!!habitsError && (
                <View style={[styles.sectionStateCard, { borderColor: theme.danger + '66', backgroundColor: theme.glassBackground }]}>
                    <Text style={[styles.sectionStateText, { color: theme.danger }]}>{habitsError}</Text>
                    <TouchableOpacity
                        style={[styles.inlineActionButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            triggerTapFeedback();
                            onRetryLoadHabits();
                        }}
                    >
                        <Text style={styles.inlineActionText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loadingHabits && !habitsError && habits.length === 0 && (
                <View style={[styles.emptyStateContainer, { borderColor: theme.border, borderWidth: 1, backgroundColor: theme.glassBackground }]}>
                    <LottieView
                        source={{ uri: 'https://lottie.host/b008d5cd-078e-4f32-8df7-cdb1e7f6075c/s1iXoQvSNo.json' }}
                        autoPlay
                        loop
                        style={{ width: 180, height: 180 }}
                    />
                    <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Start Your Journey</Text>
                    <Text style={[styles.emptyStateSubtext, { color: theme.subText }]}>Build habits to shape your future self</Text>
                    <TouchableOpacity
                        style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            triggerTapFeedback();
                            onOpenHabitModal();
                        }}
                    >
                        <Text style={styles.emptyStateButtonText}>Create First Habit</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!loadingHabits && !habitsError && habits.map((habit) => (
                <Swipeable key={habit.id} renderRightActions={() => renderHabitActions(habit)}>
                    <TouchableOpacity
                        style={[
                            styles.habitCard,
                            {
                                backgroundColor: theme.glassBackground,
                                borderColor: theme.glassBorder,
                                borderWidth: 1,
                                shadowColor: theme.shadow,
                            },
                        ]}
                        onPress={() => onToggleHabit(habit.id)}
                        onPressIn={triggerTapFeedback}
                        activeOpacity={0.8}
                    >
                        <View
                            style={[
                                styles.checkCircle,
                                { borderColor: theme.border },
                                isCompleted(habit) && { backgroundColor: theme.primary, borderColor: theme.primary },
                            ]}
                        >
                            {isCompleted(habit) && <Ionicons name="checkmark" size={18} color="white" />}
                        </View>
                        <View style={styles.habitInfo}>
                            <Text style={[styles.habitName, { color: theme.text }, isCompleted(habit) && styles.completedHabitName]}>{habit.name}</Text>
                            <View style={styles.streakInfo}>
                                <Ionicons name="flame" size={14} color={theme.warning} />
                                <Text style={[styles.streakText, { color: theme.subText }]}>
                                    {habit.streak > 0 ? `${habit.streak} day streak` : 'Ready to start'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => onOpenOptions(habit)}
                            onPressIn={triggerTapFeedback}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="ellipsis-vertical" size={18} color={theme.subText} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Swipeable>
            ))}
        </View>
    );
}
